"""
MindVault AI - FastAPI backend (full version)
Exposes Ask, Risk Check, and Insights Dashboard as JSON endpoints for the
React frontend. Reuses the existing retriever.py, reasoning.py, experts.py
logic unchanged.
"""
import os
import pickle
import json
import tempfile
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Response
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

import db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
HR_DOCS_DIR = os.path.join(BASE_DIR, "hr_docs")

app = FastAPI(title="MindVault AI API")

# Startup database initialization
@app.on_event("startup")
def startup_event():
    db.init_db()

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

# In-memory session state (preserved for backward-compatibility)
STATE = {
    "gap_queries": [],
    "total_queries_asked": 0,
}


class AskRequest(BaseModel):
    query: str
    api_key: str | None = None
    team_id: str | None = "General"  # Additive field


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


class TeamCreateRequest(BaseModel):
    name: str


class DocumentTeamRequest(BaseModel):
    team_id: str


class WorkflowRuleRequest(BaseModel):
    name: str
    condition_type: str
    condition_value: str
    action_type: str
    action_target: str | None = None
    team_id: str | None = "General"


class OnboardingProgressRequest(BaseModel):
    role: str
    item_id: str


def _resolve_api_key(request_key):
    key = request_key or os.environ.get("GROQ_API_KEY", "")
    return sanitize_to_ascii(key)


def evaluate_workflows(query, answer, confidence_score, team_id, api_key):
    try:
        rules = db.get_all_workflow_rules(team_id)
        if team_id != "General":
            rules.extend(db.get_all_workflow_rules("General"))
            
        for rule in rules:
            triggered = False
            if rule["condition_type"] == "confidence_below":
                try:
                    threshold = int(rule["condition_value"])
                    if confidence_score < threshold:
                        triggered = True
                except ValueError:
                    pass
            
            if triggered:
                action_type = rule["action_type"]
                action_target = rule["action_target"] or ""
                
                # Low risk actions execute immediately
                if action_type in ["log_alert", "notify_expert"]:
                    status = "executed"
                    action_executed = f"Executed {action_type} for {action_target}"
                else:
                    status = "pending_review"
                    action_executed = f"Queued {action_type} for review by {action_target}"
                
                db.log_workflow_execution(
                    rule_id=rule["id"],
                    rule_name=rule["name"],
                    query=query,
                    answer=answer,
                    confidence_score=confidence_score,
                    action_executed=action_executed,
                    status=status
                )
    except Exception as e:
        print(f"Error evaluating workflow rules: {e}")


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
    requested_team = request.team_id or "General"

    # Multi-team RAG filtering
    allowed_sources = None
    if requested_team and requested_team != "General":
        doc_mapping = db.get_document_team_map()
        allowed_sources = [fn for fn, t in doc_mapping.items() if t == requested_team]

    matched_chunks = retriever.retrieve(request.query, top_k=4, allowed_sources=allowed_sources)
    if not matched_chunks:
        # Fallback to general documents list check
        doc_files = []
        if os.path.exists(HR_DOCS_DIR):
            doc_files = [f for f in os.listdir(HR_DOCS_DIR) if f.endswith(".txt")]
        if not doc_files:
            raise HTTPException(status_code=404, detail="No documents indexed yet.")
        else:
            raise HTTPException(status_code=404, detail="No indexed documents found for this team context.")

    reasoner = Reasoner(api_key=api_key)
    result = reasoner.generate_answer(request.query, matched_chunks)

    if result.get("answer", "").startswith("Error running reasoning model:"):
        raise HTTPException(status_code=400, detail=result["answer"])

    # Programmatic log gap in backward-compatible state
    if result["confidence_score"] < 40:
        log_knowledge_gap(STATE["gap_queries"], request.query)

    # SQLite query logging (additive)
    try:
        db.log_query(request.query, result["confidence_score"], requested_team)
    except Exception as e:
        print(f"Error logging query: {e}")

    # Evaluate workflow rules (read-only observer)
    evaluate_workflows(request.query, result["answer"], result["confidence_score"], requested_team, api_key)

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
async def upload_doc(file: UploadFile = File(...), team_id: str = "General"):
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

    # Log document-team mapping (additive)
    try:
        db.set_document_team(file.filename, team_id)
    except Exception as e:
        print(f"Error logging document team mapping: {e}")
        
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
    
    # Load team mapping
    try:
        team_map = db.get_document_team_map()
    except Exception:
        team_map = {}

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
            "size_bytes": size_bytes,
            "team_id": team_map.get(filename, "General")
        })
    return result


@app.delete("/api/documents/{filename}")
def delete_document(filename: str):
    if os.path.basename(filename) != filename:
        raise HTTPException(status_code=400, detail="Invalid filename format.")

    filepath = os.path.join(HR_DOCS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document not found.")
    
    try:
        os.remove(filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
        
    if retriever.metadata:
        indices_to_remove = [i for i, meta in enumerate(retriever.metadata) if meta.get("source") == filename]
        if indices_to_remove:
            retriever.metadata = [meta for i, meta in enumerate(retriever.metadata) if i not in indices_to_remove]
            if retriever.embeddings is not None:
                retriever.embeddings = np.delete(retriever.embeddings, indices_to_remove, axis=0)
            
            if not retriever.metadata:
                retriever.metadata = None
                retriever.embeddings = None
                
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
                print(f"Error persisting vector index: {e}")
                
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
            answer_bullets = [s.strip() + "." for s in raw_answer.split(".") if s.strip()]

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

    return Response(
        content=ppt_io.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": "attachment; filename=mindvault_presentation.pptx"}
    )


# ==========================================
# ADDITIVE ENDPOINTS FOR THE 5 NEW FEATURES
# ==========================================

# 1. MULTI-TEAM ROLLOUT ENDPOINTS
@app.get("/api/teams")
def get_teams():
    try:
        return db.get_all_teams()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/teams")
def add_team(request: TeamCreateRequest):
    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Team name cannot be empty.")
    try:
        success = db.create_team(request.name.strip())
        if not success:
            raise HTTPException(status_code=400, detail="Team already exists.")
        return {"status": "success", "team": request.name.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/{filename}/team")
def assign_document_team(filename: str, request: DocumentTeamRequest):
    try:
        db.set_document_team(filename, request.team_id)
        return {"status": "success", "filename": filename, "team_id": request.team_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 2. AUTONOMOUS WORKFLOW ENDPOINTS
@app.get("/api/workflows/rules")
def get_workflow_rules():
    try:
        return db.get_all_workflow_rules()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/rules")
def create_workflow_rule(request: WorkflowRuleRequest):
    try:
        rule_id = db.insert_workflow_rule(
            name=request.name,
            condition_type=request.condition_type,
            condition_value=request.condition_value,
            action_type=request.action_type,
            action_target=request.action_target,
            team_id=request.team_id or "General"
        )
        return {"status": "success", "id": rule_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/workflows/rules/{rule_id}")
def delete_workflow_rule(rule_id: int):
    try:
        db.remove_workflow_rule(rule_id)
        return {"status": "success", "deleted_id": rule_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflows/log")
def get_workflow_logs():
    try:
        return db.get_all_workflow_logs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflows/log/{log_id}/approve")
def approve_workflow_log(log_id: int):
    try:
        db.update_workflow_log(log_id, "approved")
        return {"status": "success", "log_id": log_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. PROACTIVE GAP REPORTS ENDPOINT
@app.get("/api/reports/gaps")
def get_gap_reports(api_key: str | None = None):
    try:
        queries = db.get_low_confidence_queries(100)
        if not queries:
            return []
            
        query_texts = [q["query"] for q in queries]
        if not query_texts:
            return []
            
        try:
            embeddings = retriever.model.encode(query_texts, convert_to_numpy=True)
        except Exception as e:
            print(f"Error embedding queries for gap report: {e}")
            return []
            
        clusters = []
        threshold = 0.6
        
        for i, q in enumerate(queries):
            vector = embeddings[i]
            vector_norm = np.linalg.norm(vector)
            if vector_norm == 0:
                continue
                
            vector = vector / vector_norm
            found = False
            for c in clusters:
                rep_idx = query_texts.index(c[0]["query"])
                rep_vector = embeddings[rep_idx]
                rep_norm = np.linalg.norm(rep_vector)
                if rep_norm > 0:
                    rep_vector = rep_vector / rep_norm
                    sim = float(np.dot(vector, rep_vector))
                    if sim >= threshold:
                        c.append(q)
                        found = True
                        break
            if not found:
                clusters.append([q])
                
        key = _resolve_api_key(api_key)
        if not key:
            reports = []
            for idx, c in enumerate(clusters[:5]):
                queries_in_c = [q["query"] for q in c]
                reports.append({
                    "id": idx + 1,
                    "theme": f"Mock Theme: {queries_in_c[0]}",
                    "cluster_size": len(c),
                    "queries": queries_in_c,
                    "recommendation": "Identify and upload corresponding policy updates in the Knowledge Explorer."
                })
            return reports
            
        client = Groq(api_key=key)
        reports = []
        
        for idx, c in enumerate(clusters[:5]):
            queries_in_c = [q["query"] for q in c]
            prompt = (
                "You are an HR compliance and training analyzer. You are given a list of user queries that resulted in low confidence RAG answers.\n"
                "Analyze these queries and extract:\n"
                "1. A short, concise theme / topic name representing the knowledge gap (maximum 6 words).\n"
                "2. A concrete action plan and recommendation to resolve this knowledge gap (suggest what documents should be added or updated, maximum 2 sentences).\n"
                "Return a JSON object with these exact keys:\n"
                "{\n"
                "  \"theme\": \"theme name\",\n"
                "  \"recommendation\": \"concrete action plan...\"\n"
                "}\n"
                f"Queries:\n{chr(10).join(queries_in_c)}"
            )
            try:
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                data = json.loads(response.choices[0].message.content)
                reports.append({
                    "id": idx + 1,
                    "theme": data.get("theme", f"Theme {idx+1}"),
                    "cluster_size": len(c),
                    "queries": queries_in_c,
                    "recommendation": data.get("recommendation", "Update policies covering this query cluster.")
                })
            except Exception as e:
                print(f"Error calling Groq for gap report: {e}")
                reports.append({
                    "id": idx + 1,
                    "theme": f"Topic: {queries_in_c[0]}",
                    "cluster_size": len(c),
                    "queries": queries_in_c,
                    "recommendation": "Review and index documents regarding this topic."
                })
        return reports
    except Exception as e:
        print(f"Error in gap reports endpoint: {e}")
        return []


# 4. SMART ONBOARDING ENDPOINTS
@app.get("/api/onboarding/suggestions")
def get_onboarding_suggestions(role: str, api_key: str | None = None):
    if not role or not role.strip():
        raise HTTPException(status_code=400, detail="role parameter is required.")
        
    query_str = f"onboarding documents training guidelines policy information roles tasks for {role}"
    matched_chunks = retriever.retrieve(query_str, top_k=5)
    
    if not matched_chunks:
        return []
        
    key = _resolve_api_key(api_key)
    if not key:
        suggestions = []
        for doc in matched_chunks:
            suggestions.append({
                "filename": doc["source"],
                "snippet": doc["text"][:150] + "...",
                "reason": f"Matches query criteria for role of {role}."
            })
        return suggestions
        
    from collections import defaultdict
    doc_chunks = defaultdict(list)
    for c in matched_chunks:
        doc_chunks[c["source"]].append(c["text"])
        
    client = Groq(api_key=key)
    suggestions = []
    
    for filename, texts in doc_chunks.items():
        combined_text = "\n".join(texts)[:800]
        prompt = (
            f"You are an onboarding assistant. Analyze how the following document snippet is relevant to a new hire starting as a '{role}'.\n"
            "State why they should read this document and what critical guidelines it provides for this specific role.\n"
            "Return a JSON object with these exact keys:\n"
            "{\n"
            "  \"reason\": \"A concise 1-2 sentence explanation of the document's relevance to this role.\",\n"
            "  \"key_takeaway\": \"A short 1-sentence key takeaway.\"\n"
            "}\n"
            f"Document snippet:\n{combined_text}"
        )
        try:
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            suggestions.append({
                "filename": filename,
                "snippet": combined_text[:200] + "...",
                "reason": data.get("reason", f"Relevant for learning policy requirements."),
                "key_takeaway": data.get("key_takeaway", "Read to ensure compliance.")
            })
        except Exception as e:
            suggestions.append({
                "filename": filename,
                "snippet": combined_text[:200] + "...",
                "reason": "Useful document reference for policy compliance.",
                "key_takeaway": "Understand operational details."
            })
            
    return suggestions


@app.post("/api/onboarding/progress")
def set_onboarding_progress(request: OnboardingProgressRequest):
    try:
        db.log_onboarding_progress(request.role, request.item_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/onboarding/progress")
def get_onboarding_progress(role: str):
    try:
        completed = db.get_onboarding_completed_items(role)
        return {"completed_items": completed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. VOICE-TO-TEXT MEETING CAPTURE ENDPOINT
@app.post("/api/meetings/transcribe")
async def transcribe_meeting(file: UploadFile = File(...), team_id: str = "General", api_key: str | None = None):
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    key = _resolve_api_key(api_key)
    if not key:
        raise HTTPException(status_code=400, detail="No Groq API key provided for Whisper transcription.")
        
    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        temp_audio.write(file_bytes)
        temp_audio_path = temp_audio.name
        
    try:
        client = Groq(api_key=key)
        with open(temp_audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="verbose_json"
            )
        raw_transcript = transcription.text
    except Exception as e:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=f"Whisper transcription failed: {str(e)}")
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            
    try:
        structuring_prompt = (
            "You are an expert secretary. Given the raw transcript of a meeting, extract:\n"
            "1. Key discussion points (list of strings).\n"
            "2. Critical decisions made (list of strings).\n"
            "3. Action items with assignments (list of strings).\n"
            "Return a JSON object with these exact keys:\n"
            "{\n"
            "  \"key_points\": [\"point 1\", ...],\n"
            "  \"decisions\": [\"decision 1\", ...],\n"
            "  \"action_items\": [\"action 1\", ...]\n"
            "}\n"
            "Keep it professional and concise."
        )
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": structuring_prompt},
                {"role": "user", "content": f"Transcript:\n{raw_transcript}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        structured_data = json.loads(response.choices[0].message.content)
        key_points = structured_data.get("key_points", [])
        decisions = structured_data.get("decisions", [])
        action_items = structured_data.get("action_items", [])
    except Exception as e:
        print(f"Structuring failed: {e}")
        key_points = ["Could not auto-generate key points."]
        decisions = ["No decisions parsed."]
        action_items = ["No action items parsed."]
        
    try:
        meeting_id = db.insert_meeting(
            filename=file.filename,
            transcript=raw_transcript,
            key_points=key_points,
            decisions=decisions,
            action_items=action_items,
            team_id=team_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log meeting in DB: {str(e)}")
        
    meeting_filename = f"meeting_notes_{meeting_id}_{file.filename.split('.')[0]}.txt"
    formatted_notes = (
        f"Meeting notes for: {file.filename}\n"
        f"Team context: {team_id}\n"
        f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Approved by: Compliance Board\n\n"
        f"Key Points:\n" + "\n".join([f"- {p}" for p in key_points]) + "\n\n"
        f"Decisions:\n" + "\n".join([f"- {d}" for d in decisions]) + "\n\n"
        f"Action Items:\n" + "\n".join([f"- {a}" for a in action_items]) + "\n\n"
        f"Full Transcript:\n{raw_transcript}\n"
    )
    
    filepath = os.path.join(HR_DOCS_DIR, meeting_filename)
    try:
        os.makedirs(HR_DOCS_DIR, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(formatted_notes)
            
        new_chunks = chunk_text(formatted_notes)
        if new_chunks:
            new_embeddings = retriever.model.encode(new_chunks, convert_to_numpy=True)
            if retriever.embeddings is None:
                retriever.embeddings = new_embeddings
            else:
                retriever.embeddings = np.vstack([retriever.embeddings, new_embeddings])
                
            new_metadata = []
            for idx, chunk in enumerate(new_chunks):
                new_metadata.append({
                    "text": chunk,
                    "source": meeting_filename,
                    "chunk_index": idx
                })
                
            if retriever.metadata is None:
                retriever.metadata = new_metadata
            else:
                retriever.metadata = retriever.metadata + new_metadata
                
            os.makedirs(DATA_DIR, exist_ok=True)
            np.save(retriever.embeddings_path, retriever.embeddings)
            with open(retriever.metadata_path, "wb") as f:
                pickle.dump(retriever.metadata, f)
                
            db.set_document_team(meeting_filename, team_id)
    except Exception as e:
        print(f"Error saving and indexing meeting: {e}")
        
    return {
        "status": "success",
        "meeting_id": meeting_id,
        "filename": meeting_filename,
        "key_points": key_points,
        "decisions": decisions,
        "action_items": action_items
    }


@app.get("/api/meetings")
def get_meetings(team_id: str | None = None):
    try:
        return db.get_all_meetings(team_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
