import json
from groq import Groq
from utils.encoding_helper import sanitize_to_ascii

class RecommendationAgent:
    def __init__(self):
        pass

    def generate_recommendations(self, query: str, answer: str, api_key: str) -> dict:
        """
        Generates recommended next actions, documents, workflows, reports, emails, meetings.
        """
        fallback_recommendations = {
            "actions": ["Search Knowledge Base", "Start Workflow Rule", "Download Summary"],
            "documents": ["Company_Guidelines.txt", "Leave_Policy_FAQ.txt"],
            "workflows": ["General Compliance Review", "Invoice Categorization Process"],
            "reports": ["Weekly Progress Report", "HR Insights Gap Log"],
            "emails": ["General Inquiry Followup", "Leave Status Check Request"],
            "meetings": ["MOM Followup Team Sync"]
        }

        if not api_key:
            return fallback_recommendations

        system_prompt = (
            "You are a proactive Recommendation Engine for a corporate AI Copilot. "
            "Given a user query and the AI answer, suggest related items that the user might want to check or do next. "
            "Return a JSON object with these exact keys:\n"
            "{\n"
            "  \"actions\": [\"suggested quick action button label 1\", \"label 2\", ...],\n"
            "  \"documents\": [\"related doc filename 1\", \"doc filename 2\"],\n"
            "  \"workflows\": [\"suggested workflow template 1\", ...],\n"
            "  \"reports\": [\"suggested report type 1\", ...],\n"
            "  \"emails\": [\"suggested email template 1\", ...],\n"
            "  \"meetings\": [\"suggested meeting topic 1\", ...]\n"
            "}\n"
            "Limit lists to 2-3 highly relevant items each. Keep labels short (max 4 words)."
        )

        user_prompt = f"""
        User Query: {query}
        AI Answer: {answer}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            
            # Ensure all keys exist
            return {
                "actions": data.get("actions", fallback_recommendations["actions"]),
                "documents": data.get("documents", fallback_recommendations["documents"]),
                "workflows": data.get("workflows", fallback_recommendations["workflows"]),
                "reports": data.get("reports", fallback_recommendations["reports"]),
                "emails": data.get("emails", fallback_recommendations["emails"]),
                "meetings": data.get("meetings", fallback_recommendations["meetings"])
            }
        except Exception as e:
            print(f"RecommendationAgent LLM generation failed: {e}")
            return fallback_recommendations
