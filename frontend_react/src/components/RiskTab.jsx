import { useState } from "react";
import { checkRisk } from "../api";
import { inputStyle, buttonStyle, cardStyle, sectionLabelStyle } from "../styles";

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
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
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

        <div style={{ marginTop: "0.9rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            Similarity threshold: {threshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
          />
        </div>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Analyzing..." : "Check Risk"}
        </button>
      </form>

      {error && (
        <div style={{ ...cardStyle, borderColor: "#f8717155", color: "#f87171" }}>{error}</div>
      )}

      {result && (
        <div style={cardStyle}>
          <h4 style={sectionLabelStyle}>Matching Analysis</h4>
          <p style={{ color: "#d1d5db" }}>
            Highest cosine similarity to past report: <strong>{result.similarity.toFixed(4)}</strong>
          </p>

          {result.matched ? (
            <>
              <p style={{ color: "#4ade80", fontWeight: 600 }}>
                Matched past situation in file: {result.matched_filename}
              </p>
              <h3 style={{ color: "#f3f4f6" }}>Risk Analysis & Recommendation</h3>
              <p style={{ color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {result.summary}
              </p>
            </>
          ) : (
            <p style={{ color: "#9ca3af" }}>
              No similar past situation was found exceeding the similarity threshold.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
