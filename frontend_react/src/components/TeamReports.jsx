import { useState, useEffect } from "react";
import { submitTeamReport, getTeamReports, generatePPT } from "../api";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { FileText, Clipboard, Send, User, Calendar, ShieldCheck, Download } from "lucide-react";

export default function TeamReports({ role }) {
  const userEmail = sessionStorage.getItem("userEmail") || "";
  const userName = sessionStorage.getItem("userName") || "";
  const userTeamId = sessionStorage.getItem("userTeamId") || "General";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamFilter, setTeamFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getTeamReports(role, userEmail, teamFilter || null);
      setReports(data || []);
    } catch (err) {
      console.error("Failed to fetch team reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [teamFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setMsg({ text: "", type: "" });

    const payload = {
      title: title.trim(),
      content: content.trim(),
      employee_email: userEmail
    };

    try {
      const res = await submitTeamReport(payload);
      if (res.status === "success" || res.id) {
        setMsg({ text: "Report submitted successfully to your manager!", type: "success" });
        setTitle("");
        setContent("");
        fetchReports();
      } else {
        setMsg({ text: "Failed to submit report.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Error submitting report.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportText = (report) => {
    const reportText = `TEAM REPORT: ${report.title}\n=====================================\nSubmitted By: ${report.employee_name} (${report.employee_email})\nTeam: ${report.team_id}\nDate: ${new Date(report.submitted_at).toLocaleString()}\n\nContent:\n${report.content}`;
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${report.title.replace(/\s+/g, "_")}_report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPPT = async (report) => {
    try {
      const payload = {
        mode: "ask",
        ask_data: {
          query: `Team Report summary for: ${report.title}`,
          answer: report.content,
          confidence_score: 100,
          sources: [`Submitted by employee: ${report.employee_name}`],
          experts: [report.employee_email]
        }
      };
      const data = await generatePPT(payload);
      const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${report.title.replace(/\s+/g, "_")}_presentation.pptx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export PPT: " + (err.message || err));
    }
  };

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Form or Selector (Left Column) */}
      <div style={{ flex: "1.2 1 450px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {role === "Employee" ? (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Send size={20} style={{ color: themeColors.accentPrimary }} />
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
                Submit Team Report
              </h3>
            </div>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Provide weekly accomplishment logs or status updates directly to your manager.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {msg.text && (
                <div style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  background: msg.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${msg.type === "success" ? themeColors.success : "rgba(239, 68, 68, 0.3)"}`,
                  color: msg.type === "success" ? themeColors.success : themeColors.confidenceLow,
                }}>
                  {msg.text}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>REPORT TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Status Report - Engineering Q3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>REPORT CONTENT</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Summarize key tasks completed, current blockers, and planned tasks for next week..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ ...inputStyle, fontFamily: typography.body.fontFamily, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...buttonStyle,
                  background: themeColors.accentPrimary,
                  color: "#121212",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Send size={14} />
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <ShieldCheck size={20} style={{ color: themeColors.accentPrimary }} />
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
                {role === "HR" ? "Global Reports Hub" : "Team Report Queue"}
              </h3>
            </div>
            <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              {role === "HR" 
                ? "Company-wide employee status logs. HR has cross-team report visibility." 
                : `Reports from your team (${userTeamId}) members.`}
            </p>

            {role === "HR" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>FILTER BY TEAM</label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  style={{ ...inputStyle, background: "#1E1E1E", height: "45px" }}
                >
                  <option value="">All Teams</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="HR Operations">HR Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            )}

            <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {loading && reports.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                  Loading reports...
                </p>
              ) : reports.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                  No reports submitted yet.
                </p>
              ) : (
                reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    style={{
                      background: selectedReport?.id === rep.id ? "rgba(201, 162, 39, 0.08)" : themeColors.panelSurfaceRaised,
                      border: `1px solid ${selectedReport?.id === rep.id ? themeColors.accentPrimary : themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.9rem", color: themeColors.textPrimary }}>
                        {rep.title}
                      </span>
                      <span style={{ ...pillStyle, fontSize: "0.68rem", padding: "0.1rem 0.4rem", color: "#3B82F6", borderColor: "transparent", background: "rgba(59,130,246,0.08)" }}>
                        {rep.team_id}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: themeColors.textSecondary }}>
                      <User size={12} />
                      <span>{rep.employee_name}</span>
                      <span>•</span>
                      <Calendar size={12} />
                      <span>{new Date(rep.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail or Submissions List (Right Column) */}
      <div style={{ flex: "1.5 1 500px" }}>
        {role === "Employee" ? (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Clipboard size={22} style={{ color: themeColors.accentPrimary }} />
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
                My Submissions
              </h3>
            </div>
            
            <div style={{ maxHeight: "550px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {loading && reports.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                  Loading submission history...
                </p>
              ) : reports.length === 0 ? (
                <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                  No reports submitted yet.
                </p>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      background: themeColors.panelSurfaceRaised,
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1.25rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.5rem" }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: "600", fontSize: "1rem", color: themeColors.textPrimary }}>{rep.title}</h4>
                        <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                          Submitted: {new Date(rep.submitted_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleExportText(rep)}
                          style={{ background: "transparent", border: "none", color: themeColors.textSecondary, cursor: "pointer" }}
                          title="Export as Text"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handleExportPPT(rep)}
                          style={{ background: "transparent", border: "none", color: themeColors.accentPrimary, cursor: "pointer" }}
                          title="Export as PPT"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: themeColors.textPrimary, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5 }}>
                      {rep.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          selectedReport ? (
            <div style={{ ...cardStyle, marginTop: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: "600", fontSize: "1.2rem", color: themeColors.textPrimary }}>
                    {selectedReport.title}
                  </h4>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: themeColors.textSecondary }}>
                    From: <strong>{selectedReport.employee_name}</strong> ({selectedReport.employee_email})
                  </p>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78rem", color: themeColors.textSecondary }}>
                    Date: {new Date(selectedReport.submitted_at).toLocaleString()} | Team: <strong>{selectedReport.team_id}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => handleExportText(selectedReport)}
                    style={{
                      ...buttonStyle,
                      marginTop: 0,
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.78rem",
                      background: "transparent",
                      border: `1px solid ${themeColors.borderDivider}`,
                      color: themeColors.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <Download size={13} />
                    Text
                  </button>
                  <button
                    onClick={() => handleExportPPT(selectedReport)}
                    style={{
                      ...buttonStyle,
                      marginTop: 0,
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.78rem",
                      background: "rgba(201, 162, 39, 0.1)",
                      border: `1px solid ${themeColors.accentPrimary}`,
                      color: themeColors.accentPrimary,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <FileText size={13} />
                    PPT
                  </button>
                </div>
              </div>
              <div style={{
                background: "#1E1E1E",
                border: `1px solid ${themeColors.borderDivider}`,
                borderRadius: "12px",
                padding: "1.25rem",
                fontSize: "0.9rem",
                color: themeColors.textPrimary,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                maxHeight: "450px",
                overflowY: "auto"
              }}>
                {selectedReport.content}
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, marginTop: 0, textAlign: "center", padding: "6rem 2rem", borderStyle: "dashed" }}>
              <Clipboard size={46} style={{ color: "#CBD5E1", margin: "0 auto 1rem" }} />
              <h4 style={{ ...typography.heading, fontSize: "1.05rem", margin: 0, color: themeColors.textSecondary }}>
                Report Detail Panel
              </h4>
              <p style={{ color: "#94A3B8", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Select a report from the list on the left to inspect its details and access export features.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
