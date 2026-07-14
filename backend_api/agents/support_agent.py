import os
import json
from retriever import Retriever
from groq import Groq
from utils.encoding_helper import sanitize_to_ascii
import ingest

class SupportAgent:
    def __init__(self, support_docs_dir: str, support_data_dir: str):
        self.support_docs_dir = support_docs_dir
        self.support_data_dir = support_data_dir
        
        # Verify support index directory exists, create if not
        os.makedirs(self.support_data_dir, exist_ok=True)
        
        embeddings_path = os.path.join(self.support_data_dir, "embeddings.npy")
        metadata_path = os.path.join(self.support_data_dir, "metadata.pkl")
        
        if not os.path.exists(embeddings_path) or not os.path.exists(metadata_path):
            print("Support index files missing. Generating vector index for support docs...")
            ingest.run_ingestion(hr_docs_dir=self.support_docs_dir, output_dir=self.support_data_dir)
            
        # Instantiate Retriever pointed at support_data_dir
        self.retriever = Retriever(data_dir=self.support_data_dir)

    def handle_query(self, query: str, api_key: str) -> dict:
        """
        1. Classify the query into category: billing / technical / general / urgent
        2. RAG-retrieve relevant support_docs chunks
        3. Generate a customer-facing answer (friendly tone, not internal-HR tone)
        4. Return {"answer": str, "category": str, "confidence_score": int,
                    "escalate": bool, "sources": list[str]}
           escalate=True if confidence_score < 40 or category == "urgent"
        """
        if not api_key:
            return {
                "answer": "Please configure your Groq API key.",
                "category": "general",
                "confidence_score": 0,
                "escalate": True,
                "sources": []
            }

        # 1. RAG-retrieve relevant support_docs chunks
        sources = []
        context_chunks = []
        try:
            results = self.retriever.retrieve(query, top_k=3)
            for r in results:
                context_chunks.append(f"Source: {r['source']}\nContent: {r['text']}")
                sources.append(r['source'])
        except Exception as e:
            print(f"SupportAgent retrieval failed: {e}")
            
        context_str = "\n---\n".join(context_chunks) if context_chunks else "No relevant customer support documentation found."

        # 2. Setup prompts for Groq
        system_prompt = (
            "You are an expert AI Customer Support Agent for MindVault.\n"
            "Your task is to review the customer's query, consult the retrieved reference context below, and provide a helpful, accurate, and customer-facing response.\n"
            "You must return a JSON object with these exact keys:\n"
            "{\n"
            "  \"answer\": \"your friendly, customer-facing response\",\n"
            "  \"category\": \"billing\" | \"technical\" | \"general\" | \"urgent\",\n"
            "  \"confidence_score\": 0-100 integer representing your confidence based on how well the context answers the query\n"
            "}\n"
            "Formatting & Tone guidelines:\n"
            "- Tone must be helpful, friendly, and external customer-facing (not internal HR employee tone).\n"
            "- Answer must be based strictly on the provided context. If the context does not contain the answer, set confidence_score to less than 40 and explain politely that we don't have that information.\n"
            "- Categorize the query: 'billing' for payments/invoices/refunds, 'technical' for login/MFA/lockouts/shipping tracking updates, 'urgent' for critical system issues or customer frustration, 'general' otherwise."
        )

        user_prompt = f"""
        Customer Query: {query}
        
        Retrieved Reference Context:
        {context_str}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        # 3. Call Groq
        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            res_data = json.loads(response.choices[0].message.content)
            answer = res_data.get("answer", "I apologize, but I am unable to answer your request at the moment.")
            category = res_data.get("category", "general")
            confidence = int(res_data.get("confidence_score", 50))
        except Exception as e:
            print(f"SupportAgent generation failed: {e}")
            answer = "I apologize, but I am having trouble processing your query. Please try again later."
            category = "general"
            confidence = 20

        # Calculate escalation flag
        escalate = confidence < 40 or category == "urgent"

        return {
            "answer": answer,
            "category": category,
            "confidence_score": confidence,
            "escalate": escalate,
            "sources": list(set(sources))
        }
