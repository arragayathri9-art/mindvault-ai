"""
MindVault AI - FastAPI backend (full version)
Exposes Ask, Risk Check, and Insights Dashboard as JSON endpoints for the
React frontend. Reuses the existing retriever.py, reasoning.py, experts.py
logic unchanged.

Run with:
    uvicorn main:app --reload --port 8000
"""
import os
import pickle
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import numpy as np

from retriever import Retriever
from reasoning import Reasoner
from experts import scan_experts, get_experts_for_sources
from utils.risk_analyzer import get_document_similarity, generate_risk_summary
from utils.knowledge_gap import log_knowledge_gap
from utils.encoding_helper import sanitize_to_ascii
from ingest import chunk_text

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
HR_DOCS_DIR = os.path.join(BASE_DIR, "hr_docs")

app = FastAPI(title="MindVault AI API")

allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
env_origins = os.environ.get("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])
else:
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else [],
    allow_origin_regex=".*" if "*" in allowed_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

retriever = Retriever(data_dir=DATA_DIR)

# In-memory session state (per-server-run, mirrors st.session_state).
# Resets when the server restarts - fine for a hackathon demo.
STATE = {
    "gap_queries": [],
    "total_queries_asked": 0,
}


class AskRequest(BaseModel):
    query: str
    api_key: str | None = None


class AskResponse(BaseModel):
    answer: str
    confidence_score: int
    reasoning: str
    sources: list[str]
    experts: list[str]


class RiskRequest(BaseModel):
    situation: str
    api_key: str | None = None
    threshold: float = 0.40


class RiskResponse(BaseModel):
    similarity: float
    matched: bool
    matched_filename: str | None
    summary: str | None


class InsightsResponse(BaseModel):
    total_documents: int
    total_queries_asked: int
    total_gaps: int
    experts: dict
    gap_queries: list


class NotifyExpertRequest(BaseModel):
    expert_name: str
    context: str | None = None


class PPTRequest(BaseModel):
    mode: str
    topic: str | None = None
    api_key: str | None = None
    ask_data: dict | None = None


def _resolve_api_key(request_key):
    return request_key or os.environ.get("GROQ_API_KEY", "")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "documents_indexed": len(retriever.metadata or [])}


@app.post("/api/ask", response_model=AskResponse)
def ask(request: AskRequest):
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    api_key = _resolve_api_key(request.api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="No Groq API key provided.")

    STATE["total_queries_asked"] += 1

    matched_chunks = retriever.retrieve(request.query, top_k=4)
    if not matched_chunks:
        # Check if we have any files at all
        doc_files = []
        if os.path.exists(HR_DOCS_DIR):
            doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]
        if not doc_files:
            raise HTTPException(status_code=404, detail="No documents indexed yet.")
        else:
            raise HTTPException(status_code=404, detail="No indexed documents found. Run ingest.py first.")

    reasoner = Reasoner(api_key=api_key)
    result = reasoner.generate_answer(request.query, matched_chunks)

    if result.get("answer", "").startswith("Error running reasoning model:"):
        raise HTTPException(status_code=400, detail=result["answer"])

    if result["confidence_score"] < 40:
        log_knowledge_gap(STATE["gap_queries"], request.query)

    sources = [c["source"] for c in matched_chunks]
    experts = get_experts_for_sources(sources, hr_docs_dir=HR_DOCS_DIR)

    return AskResponse(
        answer=result["answer"],
        confidence_score=result["confidence_score"],
        reasoning=result["reasoning"],
        sources=sources,
        experts=experts,
    )


@app.post("/api/risk-check", response_model=RiskResponse)
def risk_check(request: RiskRequest):
    if not request.situation or not request.situation.strip():
        raise HTTPException(status_code=400, detail="Situation cannot be empty.")

    api_key = _resolve_api_key(request.api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="No Groq API key provided.")

    sim_result = get_document_similarity(request.situation, HR_DOCS_DIR, retriever.model)
    score = sim_result["similarity"]

    if score >= request.threshold and sim_result["filename"]:
        summary = generate_risk_summary(
            client=Groq(api_key=api_key),
            model_name="llama-3.3-70b-versatile",
            situation=request.situation,
            matched_filename=sim_result["filename"],
            matched_content=sim_result["content"],
        )
        return RiskResponse(
            similarity=score,
            matched=True,
            matched_filename=sim_result["filename"],
            summary=summary,
        )

    return RiskResponse(similarity=score, matched=False, matched_filename=None, summary=None)


@app.get("/api/insights", response_model=InsightsResponse)
def insights():
    doc_files = []
    if os.path.exists(HR_DOCS_DIR):
        doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]

    expert_map = scan_experts(hr_docs_dir=HR_DOCS_DIR)

    return InsightsResponse(
        total_documents=len(doc_files),
        total_queries_asked=STATE["total_queries_asked"],
        total_gaps=len(STATE["gap_queries"]),
        experts=expert_map,
        gap_queries=STATE["gap_queries"],
    )


@app.post("/api/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are allowed.")
    
    try:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be a valid UTF-8 encoded text file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    os.makedirs(HR_DOCS_DIR, exist_ok=True)
    filepath = os.path.join(HR_DOCS_DIR, file.filename)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    new_chunks = chunk_text(content)
    if not new_chunks:
        raise HTTPException(status_code=400, detail="File contains no text chunks.")
        
    try:
        new_embeddings = retriever.model.encode(new_chunks, convert_to_numpy=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
        
    if retriever.embeddings is None:
        retriever.embeddings = new_embeddings
    else:
        retriever.embeddings = np.vstack([retriever.embeddings, new_embeddings])
        
    new_metadata = []
    for idx, chunk in enumerate(new_chunks):
        new_metadata.append({
            "text": chunk,
            "source": file.filename,
            "chunk_index": idx
        })
        
    if retriever.metadata is None:
        retriever.metadata = new_metadata
    else:
        retriever.metadata = retriever.metadata + new_metadata
        
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        np.save(retriever.embeddings_path, retriever.embeddings)
        with open(retriever.metadata_path, "wb") as f:
            pickle.dump(retriever.metadata, f)
    except Exception as e:
        print(f"Error persisting vector index to disk: {e}")
        
    doc_files = []
    if os.path.exists(HR_DOCS_DIR):
        doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]
        
    return {
        "filename": file.filename,
        "chunks_added": len(new_chunks),
        "total_documents": len(doc_files)
    }


@app.get("/api/documents")
def list_documents():
    if not os.path.exists(HR_DOCS_DIR):
        return []
    
    doc_files = sorted([f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")])
    metadata_list = retriever.metadata or []
    
    result = []
    for filename in doc_files:
        filepath = os.path.join(HR_DOCS_DIR, filename)
        try:
            size_bytes = os.path.getsize(filepath)
        except Exception:
            size_bytes = 0
            
        chunk_count = sum(1 for m in metadata_list if m.get("source") == filename)
        result.append({
            "filename": filename,
            "chunk_count": chunk_count,
            "size_bytes": size_bytes
        })
    return result


@app.delete("/api/documents/{filename}")
def delete_document(filename: str):
    # Guard against directory traversal
    if os.path.basename(filename) != filename:
        raise HTTPException(status_code=400, detail="Invalid filename format.")

    filepath = os.path.join(HR_DOCS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document not found.")
    
    try:
        os.remove(filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
        
    # Update retriever index if it exists and has metadata
    if retriever.metadata:
        # Find indices to remove (any chunk originating from this document)
        indices_to_remove = [i for i, meta in enumerate(retriever.metadata) if meta.get("source") == filename]
        if indices_to_remove:
            # Filter metadata
            retriever.metadata = [meta for i, meta in enumerate(retriever.metadata) if i not in indices_to_remove]
            # Delete from embeddings
            if retriever.embeddings is not None:
                retriever.embeddings = np.delete(retriever.embeddings, indices_to_remove, axis=0)
            
            # If no metadata remains, reset retriever values
            if not retriever.metadata:
                retriever.metadata = None
                retriever.embeddings = None
                
            # Persist updated index to disk
            try:
                os.makedirs(DATA_DIR, exist_ok=True)
                if retriever.embeddings is not None:
                    np.save(retriever.embeddings_path, retriever.embeddings)
                elif os.path.exists(retriever.embeddings_path):
                    os.remove(retriever.embeddings_path)
                    
                if retriever.metadata is not None:
                    with open(retriever.metadata_path, "wb") as f:
                        pickle.dump(retriever.metadata, f)
                elif os.path.exists(retriever.metadata_path):
                    os.remove(retriever.metadata_path)
            except Exception as e:
                print(f"Error persisting vector index to disk after deletion: {e}")
                
    # Return: { filename, deleted: true, remaining_documents: int }
    doc_files = []
    if os.path.exists(HR_DOCS_DIR):
        doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]
        
    return {
        "filename": filename,
        "deleted": True,
        "remaining_documents": len(doc_files)
    }


@app.post("/api/notify-expert")
def notify_expert(request: NotifyExpertRequest):
    if not request.expert_name or not request.expert_name.strip():
        raise HTTPException(status_code=400, detail="expert_name is required and cannot be empty.")
    return {
        "status": "sent",
        "message": f"Mock notification sent to {request.expert_name}. (No real email/SMS is configured in this demo.)"
    }


@app.post("/api/generate-ppt")
def generate_ppt(request: PPTRequest):
    import io
    from fastapi.responses import StreamingResponse
    from pptx import Presentation
    from pptx.util import Inches
    from utils.ppt_generator import (
        create_title_slide,
        create_content_slide,
        create_two_column_slide,
        create_kpi_slide
    )

    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    if request.mode == "custom":
        if not request.topic or not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty for custom slide generation.")
        
        api_key = _resolve_api_key(request.api_key)
        if not api_key:
            raise HTTPException(status_code=400, detail="No Groq API key configured for AI generation.")
        
        # Call Groq to generate slide outline
        client = Groq(api_key=api_key)
        system_prompt = (
            "You are an expert presentation designer. Create a structured outline for a professional PowerPoint presentation based on the user's requested topic.\n"
            "You must return a JSON object with these exact keys:\n"
            "{\n"
            "  \"title\": \"Title of the presentation\",\n"
            "  \"subtitle\": \"Subtitle of the presentation\",\n"
            "  \"slides\": [\n"
            "    {\n"
            "      \"type\": \"title\" | \"content\" | \"two_column\",\n"
            "      \"title\": \"Slide Title\",\n"
            "      \"bullets\": [\"bullet point 1\", \"bullet point 2\", ...],\n"
            "      \"left_text\": \"(Only for 'two_column' type) Left column highlight/overview statement.\",\n"
            "      \"right_bullets\": [\"(Only for 'two_column' type) Right column bullet 1\", \"Right column bullet 2\", ...]\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Limit presentation to 4-7 slides total. Keep slide content structured, highly professional, and informative."
        )
        user_prompt = f"Topic: {request.topic}"
        
        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)
        
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            import json
            deck_data = json.loads(response.choices[0].message.content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate presentation from AI: {str(e)}")

        title = deck_data.get("title", request.topic)
        subtitle = deck_data.get("subtitle", "AI Generated Outline")
        create_title_slide(prs, title, subtitle)

        for slide_info in deck_data.get("slides", []):
            stype = slide_info.get("type", "content")
            stitle = slide_info.get("title", "Untitled Slide")
            if stype == "title":
                ssub = slide_info.get("subtitle", "")
                create_title_slide(prs, stitle, ssub)
            elif stype == "two_column":
                left_text = slide_info.get("left_text", "")
                right_bullets = slide_info.get("right_bullets", [])
                create_two_column_slide(prs, stitle, left_text, right_bullets)
            else:  # content
                bullets = slide_info.get("bullets", [])
                create_content_slide(prs, stitle, bullets)

    elif request.mode == "insights":
        doc_files = []
        if os.path.exists(HR_DOCS_DIR):
            doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]
        expert_map = scan_experts(hr_docs_dir=HR_DOCS_DIR)

        create_title_slide(prs, "MindVault AI Insights Report", "Knowledge Base Stats & HR Gap Analysis")

        metrics = [
            {"label": "Indexed Documents", "value": len(doc_files), "color": "purple"},
            {"label": "Queries Answered", "value": STATE["total_queries_asked"], "color": "indigo"},
            {"label": "Identified Knowledge Gaps", "value": len(STATE["gap_queries"]), "color": "gold"}
        ]
        create_kpi_slide(prs, "System Activity & Health Dashboard", metrics)

        gaps_list = [f"Query: \"{g['query']}\" (Logged: {g.get('count', 1)} times)" for g in STATE["gap_queries"]]
        if not gaps_list:
            gaps_list = ["No knowledge gaps identified so far! System coverage is 100%."]
        create_content_slide(prs, "Identified Knowledge Gaps", gaps_list[:5])

        expert_bullets = []
        from collections import defaultdict
        expert_to_files = defaultdict(list)
        for filename, names in expert_map.items():
            for name in names:
                expert_to_files[name].append(filename)

        for expert, files in expert_to_files.items():
            files_str = ", ".join(files)
            expert_bullets.append(f"{expert} - Covers: {files_str}")

        if not expert_bullets:
            expert_bullets = ["No experts currently mapped in system documents."]
        create_content_slide(prs, "HR Expert Domain Coverage", expert_bullets[:5])

    elif request.mode == "ask":
        ask_data = request.ask_data or {}
        query = ask_data.get("query", "HR Query")
        answer = ask_data.get("answer", "No answer details provided.")
        confidence = ask_data.get("confidence_score", 100)
        sources = ask_data.get("sources", [])
        experts = ask_data.get("experts", [])

        create_title_slide(prs, "MindVault Q&A Answer Card", f"Query: \"{query}\"")

        raw_answer = answer.strip()
        answer_bullets = [s.strip() for s in raw_answer.split("\n") if s.strip()]
        if len(answer_bullets) <= 1:
            # Split by sentence if only one block of text exists
            answer_bullets = [s.strip() + "." for s in raw_answer.split(".") if s.strip()]

        # Filter out empty or placeholder sentences
        answer_bullets = [b for b in answer_bullets if b and b != "."]
        if not answer_bullets:
            answer_bullets = [raw_answer]

        create_content_slide(prs, f"Calibrated Answer (Confidence: {confidence}%)", answer_bullets[:5])

        source_text = "Retrieved Source Documents:\n\n" + ("\n".join([f"•  {s}" for s in set(sources)]) if sources else "•  None")
        expert_list = [f"{e} (Expert Contact)" for e in experts] if experts else ["No experts mapped for these sources."]
        create_two_column_slide(prs, "References & Contact Info", source_text, expert_list)

    else:
        raise HTTPException(status_code=400, detail="Invalid mode for PowerPoint generation.")

    ppt_io = io.BytesIO()
    prs.save(ppt_io)
    ppt_io.seek(0)

    return StreamingResponse(
        ppt_io,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": "attachment; filename=mindvault_presentation.pptx"}
    )
