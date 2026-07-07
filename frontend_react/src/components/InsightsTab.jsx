import { useEffect, useState } from "react";
import { getInsights } from "../api";
import { cardStyle, sectionLabelStyle, kpiCardStyle, buttonStyle } from "../styles";

export default function InsightsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await getInsights();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Loading insights...</p>;
  if (error) return <div style={{ ...cardStyle, borderColor: "#f8717155", color: "#f87171" }}>{error}</div>;
  if (!data) return null;

  const expertEntries = Object.entries(data.experts || {});

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>{data.total_documents}</div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>Documents Indexed</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>{data.total_queries_asked}</div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>Queries Asked</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa" }}>{data.total_gaps}</div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>Knowledge Gaps</div>
        </div>
      </div>

      <button onClick={load} style={{ ...buttonStyle, marginTop: 0, marginBottom: "1.25rem" }}>
        Refresh
      </button>

      <div style={cardStyle}>
        <h4 style={sectionLabelStyle}>Identified HR Experts & Associated Policies</h4>
        {expertEntries.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No experts found in documents yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#d1d5db" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "0.5rem 0" }}>Document</th>
                <th style={{ padding: "0.5rem 0" }}>Experts / Contacts</th>
              </tr>
            </thead>
            <tbody>
              {expertEntries.map(([file, experts]) => (
                <tr key={file} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.5rem 0" }}>{file}</td>
                  <td style={{ padding: "0.5rem 0" }}>{experts.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ ...cardStyle }}>
        <h4 style={sectionLabelStyle}>Logged Knowledge Gaps (Low Confidence Queries)</h4>
        {data.gap_queries.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No knowledge gaps identified yet. All queries met confidence thresholds.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#d1d5db" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "0.5rem 0" }}>Unresolved Query</th>
                <th style={{ padding: "0.5rem 0" }}>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {data.gap_queries.map((g, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.5rem 0" }}>{g.query}</td>
                  <td style={{ padding: "0.5rem 0", color: "#94a3b8" }}>{g.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
