import { useState, useEffect } from "react";
import axios from "axios";
import { getTeams, createTeam, listDocuments } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function TeamsTab({ selectedTeam, setSelectedTeam }) {
  const [teams, setTeams] = useState([]);
  const [docSummary, setDocSummary] = useState({});
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadTeamsAndDocs = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch teams
      const teamData = await getTeams();
      const teamNames = teamData.map(t => t.name || t);
      setTeams(teamNames);
      
      // 2. Fetch docs to count them per team
      const docData = await listDocuments();
      const summary = {};
      teamNames.forEach(t => {
        summary[t] = 0;
      });
      // Fallback/General
      summary["General"] = 0;
      
      docData.forEach(doc => {
        const team = doc.team_id || "General";
        summary[team] = (summary[team] || 0) + 1;
      });
      
      setDocSummary(summary);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load team data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamsAndDocs();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setError("");
    setSuccessMsg("");
    try {
      await createTeam(newTeamName.trim());
      setSuccessMsg(`✓ Created team '${newTeamName.trim()}'`);
      setNewTeamName("");
      loadTeamsAndDocs();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create team.");
    }
  };

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
        ORGANIZATIONAL ROLLOUT
      </div>
      <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
        Multi-Team Configurations
      </h2>

      <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        Isolate policy compliance scopes by business teams. Choosing a team profile filters RAG document retrievals to documents associated with that team context.
      </p>

      {/* Team Activation Grid */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={sectionLabelStyle}>Active Search Team Context</div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {teams.map((t) => {
            const isSelected = selectedTeam === t;
            const docCount = docSummary[t] || 0;
            return (
              <div
                key={t}
                onClick={() => setSelectedTeam(t)}
                style={{
                  background: isSelected ? "rgba(75, 63, 158, 0.25)" : "#120B21",
                  border: `2px solid ${isSelected ? themeColors.highlightAmber : themeColors.borderDivider}`,
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.25rem",
                  minWidth: "150px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "1rem" }}>👥</span>
                  <span style={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: "0.95rem" }}>{t}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: themeColors.textSecondary, fontFamily: typography.mono.fontFamily }}>
                  {docCount} document(s)
                </span>
                {isSelected && (
                  <span style={{ color: themeColors.highlightAmber, fontSize: "0.7rem", fontWeight: "bold", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ● ACTIVE CONTEXT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Team Form */}
      <div style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.5rem" }}>
        <div style={sectionLabelStyle}>Create New Team Profile</div>
        <form onSubmit={handleCreateTeam} style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="e.g. Engineering"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: "250px", padding: "0.6rem 1rem" }}
          />
          <button type="submit" style={{ ...buttonStyle, marginTop: 0, padding: "0.6rem 1.2rem" }}>
            Add Team
          </button>
        </form>

        {successMsg && (
          <p style={{ color: themeColors.confidenceHigh, fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 500 }}>
            {successMsg}
          </p>
        )}

        {error && (
          <p style={{ color: themeColors.confidenceLow, fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 500 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
