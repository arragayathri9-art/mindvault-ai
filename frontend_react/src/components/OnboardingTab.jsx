import { useState, useEffect } from "react";
import { getOnboardingSuggestions, logOnboardingProgress, getOnboardingProgress } from "../api";
import { cardStyle, buttonStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";

const ROLES = [
  "Software Engineer",
  "Sales Representative",
  "HR Specialist",
  "Product Manager",
  "General Employee"
];

export default function OnboardingTab({ apiKey }) {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [suggestions, setSuggestions] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSuggestionsAndProgress = async (role) => {
    setLoading(true);
    setError("");
    try {
      // 1. Load recommendations
      const data = await getOnboardingSuggestions(role, apiKey);
      setSuggestions(data);
      
      // 2. Load reading progress
      const progressData = await getOnboardingProgress(role);
      setCompletedItems(progressData.completed_items || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load onboarding suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestionsAndProgress(selectedRole);
  }, [selectedRole, apiKey]);

  const handleMarkAsRead = async (filename) => {
    try {
      await logOnboardingProgress(selectedRole, filename);
      setCompletedItems(prev => [...prev, filename]);
    } catch (err) {
      alert("Failed to save progress: " + (err?.response?.data?.detail || ""));
    }
  };

  const percentComplete = suggestions.length > 0
    ? Math.round((completedItems.filter(item => suggestions.some(s => s.filename === item)).length / suggestions.length) * 100)
    : 0;

  return (
    <div style={cardStyle}>
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
        EMPLOYEE EXPERIENCE
      </div>
      <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
        Role-Based Onboarding
      </h2>

      <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        Semantic analysis of the knowledge base guides new hires to policies and compliance training materials most relevant to their role.
      </p>

      {/* Role Selection Dropdown */}
      <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "300px" }}>
        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
          Select Onboarding Profile
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "10px",
            background: "#120B21",
            color: themeColors.textPrimary,
            border: `1px solid ${themeColors.borderDivider}`,
            outline: "none",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontFamily: typography.body.fontFamily,
          }}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Retrieving and analyzing recommended documents...</p>
      ) : suggestions.length === 0 ? (
        <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>No specific onboarding documents mapped for this role yet. Try adding more policies in the Knowledge Explorer.</p>
      ) : (
        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: themeColors.textSecondary }}>Reading Progress:</span>
              <span style={{ fontSize: "0.9rem", color: themeColors.highlightAmber, fontFamily: typography.mono.fontFamily, fontWeight: "bold" }}>
                {percentComplete}% Complete
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${percentComplete}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${themeColors.accentPrimary} 0%, ${themeColors.highlightAmber} 100%)`,
                  borderRadius: "4px",
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
          </div>

          {/* Suggestions List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {suggestions.map((sug) => {
              const isRead = completedItems.includes(sug.filename);
              return (
                <div
                  key={sug.filename}
                  style={{
                    background: "#120B21",
                    border: `1px solid ${isRead ? "rgba(52, 211, 153, 0.25)" : themeColors.borderDivider}`,
                    borderRadius: "10px",
                    padding: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.5rem",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: "1rem" }}>📄 {sug.filename}</span>
                      {isRead && (
                        <span
                          style={{
                            background: "rgba(52, 211, 153, 0.15)",
                            color: themeColors.confidenceHigh,
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                            fontFamily: typography.mono.fontFamily,
                            fontWeight: "bold",
                          }}
                        >
                          COMPLETED
                        </span>
                      )}
                    </div>

                    <p style={{ color: themeColors.textPrimary, fontSize: "0.9rem", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>
                      <strong style={{ color: themeColors.highlightAmber }}>Relevance:</strong> {sug.reason}
                    </p>

                    {sug.key_takeaway && (
                      <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: 0, fontStyle: "italic" }}>
                        Takeaway: {sug.key_takeaway}
                      </p>
                    )}
                  </div>

                  <button
                    disabled={isRead}
                    onClick={() => handleMarkAsRead(sug.filename)}
                    style={{
                      flexShrink: 0,
                      background: isRead ? "rgba(255, 255, 255, 0.03)" : "rgba(75, 63, 158, 0.25)",
                      border: `1px solid ${isRead ? themeColors.borderDivider : "rgba(75, 63, 158, 0.5)"}`,
                      color: isRead ? themeColors.textSecondary : themeColors.textPrimary,
                      padding: "0.4rem 0.8rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      cursor: isRead ? "default" : "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    {isRead ? "✓ Read" : "Mark as read"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
