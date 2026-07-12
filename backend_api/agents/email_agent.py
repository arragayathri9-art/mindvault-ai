from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class EmailAgent:
    def __init__(self):
        pass

    def generate_email(self, template_type: str, recipient: str, tone: str, details: str, api_key: str) -> dict:
        if not api_key:
            return {
                "subject": "Missing API Key",
                "body": "Please configure your Groq API key.",
                "status": "error"
            }

        system_prompt = (
            "You are an expert corporate communications copywriter. "
            "Your job is to generate a professional, polished email based on the template type, recipient, tone, and specific details provided.\n"
            "Format the email clearly, starting with a suitable Subject line on the first line (prefixed with 'Subject: '), "
            "followed by a blank line and the full email body (including salutation, body paragraphs, and professional sign-off).\n"
            "Keep the content appropriate for the chosen tone and recipient."
        )

        user_prompt = f"""
        Template Type: {template_type}
        Recipient: {recipient}
        Tone: {tone}
        Key details and instructions:
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
            temperature=0.7,
        )

        raw_content = response.choices[0].message.content.strip()

        # Parse Subject and Body
        subject = f"Email: {template_type}"
        body = raw_content

        lines = raw_content.split("\n")
        if lines[0].lower().startswith("subject:"):
            subject = lines[0][len("subject:"):].strip()
            body = "\n".join(lines[2:]).strip() if len(lines) > 2 else "\n".join(lines[1:]).strip()

        # Save email into SQLite database
        try:
            email_id = db.save_email(template_type, recipient, subject, body)
            db.add_activity("email_generation", f"Generated email using template '{template_type}' for '{recipient}'", f"Email ID: {email_id}")
            db.add_notification("Email Generated", f"A new email copy is ready for '{recipient}' with theme '{template_type}'.", "email")
        except Exception as e:
            print(f"EmailAgent DB logging failed: {e}")

        return {
            "subject": subject,
            "body": body,
            "status": "success"
        }
