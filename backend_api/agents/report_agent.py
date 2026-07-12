from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class ReportAgent:
    def __init__(self):
        pass

    def generate_report(self, report_type: str, title: str, details: str, api_key: str) -> dict:
        if not api_key:
            return {
                "title": "Missing API Key",
                "content": "Please configure your Groq API key.",
                "status": "error"
            }

        system_prompt = (
            "You are a professional business analyst. Your task is to generate a comprehensive, highly-structured business report based on the provided report type, report title, and raw details/updates.\n"
            "Format the report using clean Markdown layout with clear headers (##, ###), bullet points, and tables where applicable to represent performance, highlights, lowlights, and action items.\n"
            "Ensure the report content is detailed, structured, and ready to be printed or exported."
        )

        user_prompt = f"""
        Report Type: {report_type}
        Report Title: {title}
        Raw Notes/Details to include:
        {details}
        """

        system_prompt = sanitize_to_ascii(system_prompt)
        user_prompt = sanitize_to_ascii(user_prompt)

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )

        content = response.choices[0].message.content.strip()

        # Save report into SQLite database
        try:
            report_id = db.save_report(report_type, title, content)
            db.add_activity("report_generation", f"Generated report '{title}' of type '{report_type}'", f"Report ID: {report_id}")
            db.add_notification("Report Generated", f"A new '{report_type}' is ready for review.", "report")
        except Exception as e:
            print(f"ReportAgent DB logging failed: {e}")

        return {
            "title": title,
            "content": content,
            "status": "success"
        }
