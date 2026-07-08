import { useState, useEffect } from "react";
import { getGapReports } from "../api";
import { cardStyle, buttonStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";

export default function GapReportsTab({ apiKey }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadGapReports = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getGapReports(apiKey);
      setReports(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load proactive gap reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGapReports();
  }, [apiKey]);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div
            style={{
              fontFamily: typography.mono.fontFamily,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: themeColors.highlightAmber,
              marginBottom: "0.25rem",
            }}
          >
            PROACTIVE AUDITING
          </div>
          <h2 style={{ ...typography.heading, fontSize: "1.6rem", margin: 0 }}>
            Knowledge Base Gap Reports
          </h2>
        </div>
        <button
          onClick={loadGapReports}
          disabled={loading}
          style={{
            ...buttonStyle,
            marginTop: 0,
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
          }}
        >
          {loading ? "Analyzing Logs..." : "Force Run Audit"}
        </button>
      </div>

      <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        Weekly automated clustering audits of low-confidence questions asked by employees. This helps identify blindspots in policies.
      </p>

      {error && (
        <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Running clustering analysis on past query logs...</p>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", border: `1px dashed ${themeColors.borderDivider}`, borderRadius: "10px" }}>
          <span style={{ fontSize: "2rem" }}>🎯</span>
          <h4 style={{ ...typography.heading, margin: "0.5rem 0 0.25rem 0", fontSize: "1.1rem" }}>Perfect Coverage!</h4>
          <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "0.85rem" }}>
            No low-confidence question clusters have been logged. All employee queries have met RAG confidence thresholds.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                background: "#120B21",
                borderLeft: `3px solid ${themeColors.highlightAmber}`,
                borderRadius: "0 8px 8px 0",
                padding: "1.25rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ ...typography.heading, fontSize: "1.15rem", margin: 0 }}>
                  Theme: {report.theme}
                </h3>
                <span
                  style={{
                    backgroundColor: themeColors.badgeAmber,
                    color: themeColors.highlightAmber,
                    fontFamily: typography.mono.fontFamily,
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  Size: {report.cluster_size} queries
                </span>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <div style={sectionLabelStyle}>Sample Queries</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {report.queries.map((q, qidx) => (
                    <div
                      key={qidx}
                      style={{
                        color: themeColors.textSecondary,
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                        paddingLeft: "0.5rem",
                        borderLeft: "2px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      &ldquo;{q}&rdquo;
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ ...sectionLabelStyle, color: themeColors.confidenceHigh }}>Suggested Action</div>
                <p style={{ color: themeColors.textPrimary, margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>
                  {report.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
