import { useState, useEffect } from "react";
import axios from "axios";
import { generateReport } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle } from "../styles";

const REPORT_TYPES = [
  "Weekly Report",
  "Monthly Report",
  "Department Report",
  "Project Report",
  "Sales Report",
  "Performance Report"
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function ReportGenerator({ apiKey }) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [recentReports, setRecentReports] = useState([]);
  const [exportingFormat, setExportingFormat] = useState(null);

  // Load recent reports for list
  const fetchRecentReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard`);
      setRecentReports(response.data?.memory?.recent_reports || []);
    } catch (e) {
      console.error("Failed to load recent reports", e);
    }
  };

  useEffect(() => {
    fetchRecentReports();
  }, [result]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify a report title.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await generateReport({
        report_type: reportType,
        title: title.trim(),
        details,
        api_key: apiKey
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (reportId, format) => {
    setExportingFormat({ id: reportId, format });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/exports/report/${reportId}`, {
        params: { format },
        responseType: "blob"
      });
      
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export report", err);
      alert("Failed to export report in " + format.toUpperCase() + " format.");
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Generator Panel */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>AI WORK DOCUMENTS</div>
        <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
          Report Generator Agent
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Compile corporate status sheets, sales breakdowns, or team performance logs. The Report Agent structures raw details into structured, formatted business layouts.
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
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  ...inputStyle,
                  padding: "0.6rem 1rem",
                  background: "#120B21"
                }}
              >
                {REPORT_TYPES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                Report Title
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Engineering Progress Brief"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                required
              />
            </div>

            <button type="submit" disabled={loading} style={{ ...buttonStyle, marginTop: "0.5rem" }}>
              {loading ? "Compiling Report..." : "Generate Business Report"}
            </button>
          </div>

          <div style={{ flex: "1.5 1 350px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
              Raw report details, updates, bullet points or metrics
            </label>
            <textarea
              placeholder="e.g. Completed migrations to FastAPI. Set up Whisper transcribing. Found 3 critical policy gaps in HR docs. Next weeks tasks: complete frontend, run unit tests, present demo."
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

      {/* 2. Generated Output Panel */}
      {result && (
        <div style={cardStyle}>
          <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "1rem", borderBottom: `1px solid ${themeColors.borderDivider}`, paddingBottom: "0.75rem" }}>
            Generated Document Preview: {result.title}
          </h3>
          <div style={{ background: "#120B21", border: `1px solid ${themeColors.borderDivider}`, borderRadius: "10px", padding: "1.5rem", overflowX: "auto" }}>
            {/* Displaying markdown summary */}
            <div style={{ color: themeColors.textPrimary, lineHeight: 1.6, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
              {result.content}
            </div>
          </div>
        </div>
      )}

      {/* 3. History List with Export triggers */}
      <div style={cardStyle}>
        <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
          Generated Report History & Exports
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
          Export generated documents as official formatted Word files (.docx) or PDF files (.pdf) using ReportLab/Docx formatting.
        </p>

        {recentReports.length === 0 ? (
          <p style={{ color: themeColors.textSecondary, fontStyle: "italic", margin: 0 }}>No reports generated in this session yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "350px", overflowY: "auto" }}>
            {recentReports.map((rep) => (
              <div
                key={rep.id}
                style={{
                  background: "#120B21",
                  border: `1px solid ${themeColors.borderDivider}`,
                  borderRadius: "8px",
                  padding: "0.8rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: themeColors.textPrimary }}>📝 {rep.title}</div>
                  <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                    Type: {rep.report_type} | Generated: {new Date(rep.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleExport(rep.id, "docx")}
                    disabled={exportingFormat?.id === rep.id}
                    style={{
                      background: "rgba(75, 63, 158, 0.25)",
                      border: `1px solid ${themeColors.borderDivider}`,
                      borderRadius: "6px",
                      color: themeColors.textPrimary,
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}
                  >
                    {exportingFormat?.id === rep.id && exportingFormat?.format === "docx" ? "Exporting..." : "Word (DOCX)"}
                  </button>
                  <button
                    onClick={() => handleExport(rep.id, "pdf")}
                    disabled={exportingFormat?.id === rep.id}
                    style={{
                      background: themeColors.highlightAmber,
                      border: "none",
                      borderRadius: "6px",
                      color: "#150F26",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}
                  >
                    {exportingFormat?.id === rep.id && exportingFormat?.format === "pdf" ? "Exporting..." : "PDF"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
