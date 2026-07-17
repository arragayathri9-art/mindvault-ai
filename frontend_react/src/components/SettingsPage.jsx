import { useState, useEffect } from "react";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { Settings, ShieldCheck, Key, Users, User, DatabaseBackup } from "lucide-react";
import { getSystemApiKey, saveSystemApiKey } from "../api";

export default function SettingsPage({ apiKey, setApiKey, selectedTeam, setSelectedTeam, userRole, setUserRole }) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [roleInput, setRoleInput] = useState(userRole || "General Employee");
  const [teamInput, setTeamInput] = useState(selectedTeam || "General");

  const currentUserRole = sessionStorage.getItem("userRole") || "Employee";
  const [systemKeyInput, setSystemKeyInput] = useState("");
  const [loadingSystemKey, setLoadingSystemKey] = useState(false);

  useEffect(() => {
    if (currentUserRole === "HR") {
      const fetchSystemKey = async () => {
        setLoadingSystemKey(true);
        try {
          const res = await getSystemApiKey();
          setSystemKeyInput(res.api_key || "");
        } catch (err) {
          console.error("Failed to fetch system API key", err);
        } finally {
          setLoadingSystemKey(false);
        }
      };
      fetchSystemKey();
    }
  }, [currentUserRole]);

  const handleSaveSystemKey = async () => {
    try {
      await saveSystemApiKey(systemKeyInput);
      alert("System-wide AI API Key updated successfully in database.");
    } catch (err) {
      alert("Failed to update system API key: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSave = () => {
    if (setApiKey) setApiKey(keyInput);
    if (setSelectedTeam) setSelectedTeam(teamInput);
    if (setUserRole) setUserRole(roleInput);
    alert("Configuration profiles successfully saved.");
  };

  const roles = ["Software Engineer", "HR Manager", "Customer Support Representative", "General Employee"];
  const teams = ["General", "Engineering", "HR", "Finance", "Legal"];

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", width: "100%" }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Settings size={20} style={{ color: themeColors.accentPrimary }} />
          <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
            System Configuration Profiles
          </h3>
        </div>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Adjust authorization credentials, organizational filters, and role persona styling targets.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* API Key */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Key size={14} />
              GROQ API KEY (PER-SESSION OVERRIDE)
            </label>
            <input
              type="password"
              placeholder="Groq API key (e.g. gsk_... or leave blank to use default)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={inputStyle}
            />
            <p style={{ color: themeColors.textSecondary, fontSize: "0.78rem", margin: 0 }}>
              Leave blank to fall back on database system-wide API credentials.
            </p>
          </div>

          {/* Persona Role */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <User size={14} />
              ACTIVE USER PERSONA ROLE
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              style={{ ...inputStyle, padding: "0.75rem 1rem", background: "#1E1E1E" }}
            >
              {roles.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Selected Team filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Users size={14} />
              ORGANIZATIONAL TEAM SCOPE
            </label>
            <select
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              style={{ ...inputStyle, padding: "0.75rem 1rem", background: "#1E1E1E" }}
            >
              {teams.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <div style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSave}
              style={{
                ...buttonStyle,
                marginTop: 0,
                background: themeColors.accentPrimary,
                color: "#121212",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <ShieldCheck size={16} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* HR System API Key database persistence */}
      {currentUserRole === "HR" && (
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <DatabaseBackup size={20} style={{ color: themeColors.accentPrimary }} />
            <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
              Enterprise System AI Key (HR/Admin)
            </h3>
          </div>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Set or rotate the database persistent Groq API Key. This system key is used for AI decision analysis, performance reviews, and PPT outlines.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "bold", color: themeColors.textSecondary }}>
                <Key size={14} />
                SYSTEM GROQ API KEY
              </label>
              <input
                type="password"
                placeholder={loadingSystemKey ? "Retrieving key from DB..." : "Enter system-wide Groq API key (gsk_...)"}
                value={systemKeyInput}
                onChange={(e) => setSystemKeyInput(e.target.value)}
                style={inputStyle}
                disabled={loadingSystemKey}
              />
              <p style={{ color: themeColors.textSecondary, fontSize: "0.78rem", margin: 0 }}>
                Masked value indicates a saved configuration in the database. Enter a new key to rotate or update.
              </p>
            </div>

            <div style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveSystemKey}
                style={{
                  ...buttonStyle,
                  marginTop: 0,
                  background: themeColors.accentPrimary,
                  color: "#121212",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <ShieldCheck size={16} />
                Update System Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

