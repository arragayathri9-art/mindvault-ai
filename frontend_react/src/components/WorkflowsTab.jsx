import { useState, useEffect } from "react";
import axios from "axios";
import { getWorkflowRules, createWorkflowRule, deleteWorkflowRule, getWorkflowLogs, approveWorkflowLog, getTeams } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";

export default function WorkflowsTab({ apiKey, selectedTeam }) {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [teams, setTeams] = useState(["General"]);
  
  // Create Rule State
  const [ruleName, setRuleName] = useState("");
  const [condValue, setCondValue] = useState("50");
  const [actionType, setActionType] = useState("log_alert");
  const [actionTarget, setActionTarget] = useState("");
  const [ruleTeam, setRuleTeam] = useState("General");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const rulesData = await getWorkflowRules();
      setRules(rulesData);
      
      const logsData = await getWorkflowLogs();
      setLogs(logsData);
      
      const teamsData = await getTeams();
      setTeams(teamsData.map(t => t.name || t));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load workflow data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    setError("");
    setSuccess("");
    try {
      await createWorkflowRule({
        name: ruleName.trim(),
        condition_type: "confidence_below",
        condition_value: condValue,
        action_type: actionType,
        action_target: actionTarget.trim() || null,
        team_id: ruleTeam
      });
      setSuccess(`✓ Rule '${ruleName.trim()}' created!`);
      setRuleName("");
      setActionTarget("");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create rule.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteWorkflowRule(ruleId);
      loadData();
    } catch (err) {
      alert("Failed to delete rule: " + (err?.response?.data?.detail || ""));
    }
  };

  const handleApproveLog = async (logId) => {
    try {
      await approveWorkflowLog(logId);
      loadData();
    } catch (err) {
      alert("Failed to approve action: " + (err?.response?.data?.detail || ""));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Rule Creation and Active Rules */}
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
          COMPLIANCE OBSERVATION
        </div>
        <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
          Autonomous Workflow Triggers
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Establish active monitoring rules. When RAG response confidence falls below thresholds, triggers will execute actions (like notifying an expert) or queue flags for human review.
        </p>

        {error && (
          <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: themeColors.confidenceHigh, padding: "1rem", border: `1px solid ${themeColors.confidenceHigh}33`, borderRadius: "8px", background: "rgba(52, 211, 153, 0.05)", marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
          {/* Create Rule Form */}
          <div style={{ flex: "1 1 300px" }}>
            <h4 style={{ ...sectionLabelStyle, marginBottom: "0.75rem" }}>Create Monitor Rule</h4>
            <form onSubmit={handleCreateRule} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Critical Layoff Warning"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem 0.75rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Trigger Condition</label>
                  <select
                    style={{ ...inputStyle, padding: "0.5rem" }}
                    disabled
                  >
                    <option>Confidence Below</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={condValue}
                    onChange={(e) => setCondValue(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                  >
                    <option value="log_alert">Log Alert (Low Risk)</option>
                    <option value="notify_expert">Notify Expert (Low Risk)</option>
                    <option value="flag_risk">Flag Risk (High Risk - Review Required)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Target Person / Node</label>
                  <input
                    type="text"
                    placeholder="e.g. Deepak Rao"
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    style={{ ...inputStyle, padding: "0.5rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>Scope Team</label>
                <select
                  value={ruleTeam}
                  onChange={(e) => setRuleTeam(e.target.value)}
                  style={{ ...inputStyle, padding: "0.5rem" }}
                >
                  {teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button type="submit" style={{ ...buttonStyle, marginTop: "0.5rem" }}>
                Activate Rule
              </button>
            </form>
          </div>

          {/* Active Rules List */}
          <div style={{ flex: "1.5 1 350px", borderLeft: `1px solid ${themeColors.borderDivider}`, paddingLeft: "1.5rem" }}>
            <h4 style={sectionLabelStyle}>Active Rules</h4>
            {loading && rules.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Loading active rules...</p>
            ) : rules.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>No active rules found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      background: "#120B21",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: themeColors.textPrimary }}>{rule.name}</div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                        Condition: <code style={{ fontFamily: typography.mono.fontFamily }}>confidence &lt; {rule.condition_value}%</code> | Team: <code style={{ fontFamily: typography.mono.fontFamily }}>{rule.team_id}</code>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: themeColors.highlightAmber, marginTop: "0.15rem" }}>
                        Action: <strong>{rule.action_type}</strong> {rule.action_target && `(Target: ${rule.action_target})`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{
                        background: "rgba(239, 91, 91, 0.1)",
                        border: "none",
                        color: themeColors.confidenceLow,
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Rule Trigger Audit Logs */}
      <div style={cardStyle}>
        <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
          Workflow Execution Log
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
          Lists rule executions. Actions classified as high risk (e.g. Flag Risk) remain pending review until authorized.
        </p>

        {loading && logs.length === 0 ? (
          <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Loading logs...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>No rule executions logged yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflowY: "auto" }}>
            {logs.map((log) => {
              const isPending = log.status === "pending_review";
              return (
                <div
                  key={log.id}
                  style={{
                    background: "#120B21",
                    border: `1px solid ${isPending ? "rgba(240, 167, 66, 0.3)" : themeColors.borderDivider}`,
                    borderRadius: "10px",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>Rule: {log.rule_name}</span>
                      <span
                        style={{
                          fontFamily: typography.mono.fontFamily,
                          fontSize: "0.7rem",
                          backgroundColor: isPending ? "rgba(240, 167, 66, 0.15)" : "rgba(52, 211, 153, 0.15)",
                          color: isPending ? themeColors.highlightAmber : themeColors.confidenceHigh,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          fontWeight: "bold"
                        }}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: themeColors.textSecondary, margin: "0.25rem 0" }}>
                      <strong>Employee Query:</strong> &ldquo;{log.query}&rdquo;
                    </div>
                    <div style={{ fontSize: "0.85rem", color: themeColors.textSecondary, margin: "0.25rem 0" }}>
                      <strong>Observed Confidence:</strong> <code style={{ fontFamily: typography.mono.fontFamily, color: themeColors.confidenceLow }}>{log.confidence_score}%</code>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: themeColors.textPrimary, margin: "0.25rem 0" }}>
                      <strong>Action Log:</strong> {log.action_executed}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontFamily: typography.mono.fontFamily, marginTop: "0.5rem" }}>
                      Triggered At: {log.created_at}
                    </div>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleApproveLog(log.id)}
                      style={{
                        background: themeColors.highlightAmber,
                        border: "none",
                        color: "#150F26",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        boxShadow: "0 2px 6px rgba(240,167,66,0.3)"
                      }}
                    >
                      Authorize Action
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
