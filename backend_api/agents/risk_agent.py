import os
from groq import Groq
from utils.risk_analyzer import get_document_similarity, generate_risk_summary
from utils.encoder import HashedTfidfEncoder
import db

class RiskAgent:
    def __init__(self, hr_docs_dir=None):
        self.hr_docs_dir = hr_docs_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "hr_docs")
        self.model = HashedTfidfEncoder(dimension=384)

    def analyze_risk(self, situation: str, api_key: str, threshold: float = 0.4) -> dict:
        if not api_key:
            return {
                "similarity": 0.0,
                "matched": False,
                "matched_filename": None,
                "summary": "Missing Groq API Key to generate risk summary.",
                "status": "error"
            }

        sim_result = get_document_similarity(situation, self.hr_docs_dir, self.model)
        score = sim_result["similarity"]

        if score >= threshold and sim_result["filename"]:
            summary = generate_risk_summary(
                client=Groq(api_key=api_key),
                model_name="llama-3.3-70b-versatile",
                situation=situation,
                matched_filename=sim_result["filename"],
                matched_content=sim_result["content"]
            )
            
            # Log activity
            db.add_activity("risk_check", f"Performed risk check on situation: '{situation[:50]}...'", f"Similarity: {score:.2f} with {sim_result['filename']}")
            
            return {
                "similarity": score,
                "matched": True,
                "matched_filename": sim_result["filename"],
                "summary": summary,
                "status": "success"
            }
            
        return {
            "similarity": score,
            "matched": False,
            "matched_filename": None,
            "summary": "No matching high-risk policies found in database above the threshold.",
            "status": "success"
        }
