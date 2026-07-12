import { useState } from "react";
import { generateEmail } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle } from "../styles";

const TEMPLATES = [
  "Leave Request",
  "Customer Reply",
  "Offer Letter",
  "Meeting Invitation",
  "Reminder",
  "Escalation",
  "Complaint Response"
];

const TONES = [
  "Professional",
  "Casual",
  "Empathetic",
  "Urgently",
  "Direct"
];

export default function EmailGenerator({ apiKey }) {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!recipient.trim()) {
      setError("Please specify a recipient.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      const data = await generateEmail({
        template_type: template,
        recipient: recipient.trim(),
        tone,
        details,
        api_key: apiKey
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to generate email.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    if (!result) return;
    const fullText = `Subject: ${result.subject}\n\n${result.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const fullText = `Subject: ${result.subject}\n\n${result.body}`;
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `email_${template.toLowerCase().replace(/ /g, "_")}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>AI AGENT SYSTEM</div>
        <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
          Email Generator Agent
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Generate customized, polished corporate emails in seconds. Specify the template, target recipient, tone, and specific guidelines, and let the AI Email Agent build the message.
        </p>

        {error && (
          <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                Select Email Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                style={{
                  ...inputStyle,
                  padding: "0.6rem 1rem",
                  background: "#120B21"
                }}
              >
                {TEMPLATES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                  Recipient
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hiring Manager"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                  required
                />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  style={{
                    ...inputStyle,
                    padding: "0.6rem 1rem",
                    background: "#120B21"
                  }}
                >
                  {TONES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
              {loading ? "Generating Draft..." : "Generate Corporate Email"}
            </button>
          </div>

          <div style={{ flex: "1.5 1 350px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
              Specific context or instructions
            </label>
            <textarea
              placeholder="e.g. State that I am requesting leave from Monday 14th to Friday 18th July for family reasons. Mention I have handed over urgent engineering tasks to Jane."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
                height: "100%",
                minHeight: "150px"
              }}
            />
          </div>
        </form>
      </div>

      {result && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
            <h3 style={{ ...typography.heading, fontSize: "1.3rem", margin: 0 }}>
              Generated Result
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleCopy}
                style={{
                  background: "rgba(75, 63, 158, 0.25)",
                  border: `1px solid ${themeColors.borderDivider}`,
                  borderRadius: "6px",
                  color: themeColors.textPrimary,
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                {copied ? "Copied! ✓" : "Copy to Clipboard"}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  background: themeColors.highlightAmber,
                  border: "none",
                  borderRadius: "6px",
                  color: "#150F26",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                Download Email (.txt)
              </button>
            </div>
          </div>

          <div style={{ background: "#120B21", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.5rem" }}>
            <p style={{ margin: "0 0 1rem 0", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily, fontSize: "0.95rem" }}>
              <strong>Subject:</strong> {result.subject}
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", color: themeColors.textPrimary, lineHeight: 1.6, fontSize: "0.95rem" }}>
              {result.body}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
