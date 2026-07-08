import { useState } from "react";
import { checkRisk } from "../api";
import { inputStyle, buttonStyle, cardStyle, sectionLabelStyle, themeColors, typography } from "../styles";

export default function RiskTab({ apiKey }) {
  const [situation, setSituation] = useState("");
  const [threshold, setThreshold] = useState(0.4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleCheck(e) {
    e.preventDefault();
    if (!situation.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await checkRisk(situation, apiKey, threshold);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong reaching the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ color: themeColors.textSecondary, marginTop: 0, fontSize: "0.9rem" }}>
        Compare a prospective HR situation against past restructuring and campus recruitment reports.
      </p>

      <form onSubmit={handleCheck}>
        <textarea
          placeholder="e.g. We are planning a redundancy layoff in engineering next month..."
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontFamily: typography.mono.fontFamily }}>
            Similarity threshold: {threshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            style={{ accentColor: themeColors.accentPrimary }}
          />
        </div>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Analyzing..." : "Check Risk"}
        </button>
      </form>

      {error && (
        <div style={{ ...cardStyle, borderColor: `${themeColors.confidenceLow}55`, color: themeColors.confidenceLow }}>
          {error}
        </div>
      )}

      {result && (
        <div style={cardStyle}>
          <h4 style={sectionLabelStyle}>Matching Analysis</h4>
          <p style={{ color: themeColors.textPrimary }}>
            Highest cosine similarity to past report: <strong style={{ fontFamily: typography.mono.fontFamily, color: themeColors.highlightAmber }}>{result.similarity.toFixed(4)}</strong>
          </p>

          {result.matched ? (
            <div style={{ marginTop: "1.25rem" }}>
              <p style={{ color: themeColors.confidenceHigh, fontWeight: 600, margin: "0 0 1rem 0" }}>
                Matched past situation in file: <code style={{ fontFamily: typography.mono.fontFamily }}>{result.matched_filename}</code>
              </p>
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: "1rem 0 0.5rem 0" }}>Risk Analysis & Recommendation</h3>
              <p style={{ color: themeColors.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
                {result.summary}
              </p>
            </div>
          ) : (
            <p style={{ color: themeColors.textSecondary, fontStyle: "italic", margin: "1rem 0 0 0" }}>
              No similar past situation was found exceeding the similarity threshold.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
