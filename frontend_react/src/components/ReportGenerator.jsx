import { useState, useEffect } from "react";
import axios from "axios";
import { generateReport, generateQuotation, generateInvoice, generateQuestionPaper } from "../api";
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

  // New document states
  const [documentType, setDocumentType] = useState("Report");
  const [clientName, setClientName] = useState("");
  const [terms, setTerms] = useState("Payment is due within 30 days of quotation date.");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState([{ description: "", qty: 1, rate: 0 }]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);

  const handleAddItem = () => {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

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
    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (documentType === "Report") {
        if (!title.trim()) {
          setError("Please specify a report title.");
          setLoading(false);
          return;
        }
        const data = await generateReport({
          report_type: reportType,
          title: title.trim(),
          details,
          api_key: apiKey
        });
        setResult(data);
      } else if (documentType === "Quotation") {
        if (!clientName.trim()) {
          setError("Please specify a client name.");
          setLoading(false);
          return;
        }
        const blobData = await generateQuotation({
          client_name: clientName.trim(),
          items: items.map(item => ({
            description: item.description,
            qty: parseInt(item.qty) || 0,
            rate: parseFloat(item.rate) || 0.0
          })),
          terms,
          api_key: apiKey
        });
        // Download blob directly
        const blob = new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Quotation_${clientName.trim().replace(/\s+/g, "_")}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setResult({
          title: `Quotation for ${clientName}`,
          content: `Quotation DOCX successfully generated and downloaded.\n\nClient: ${clientName}\nSubtotal: $${items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0).toFixed(2)}\nGST (18%): $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 0.18).toFixed(2)}\nGrand Total: $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 1.18).toFixed(2)}`
        });
      } else if (documentType === "Invoice") {
        if (!clientName.trim() || !invoiceNo.trim()) {
          setError("Please specify client name and invoice number.");
          setLoading(false);
          return;
        }
        const blobData = await generateInvoice({
          invoice_no: invoiceNo.trim(),
          client_name: clientName.trim(),
          items: items.map(item => ({
            description: item.description,
            qty: parseInt(item.qty) || 0,
            rate: parseFloat(item.rate) || 0.0
          })),
          due_date: dueDate,
          api_key: apiKey
        });
        // Download blob directly
        const blob = new Blob([blobData], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Invoice_${invoiceNo.trim()}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setResult({
          title: `Invoice #${invoiceNo} for ${clientName}`,
          content: `Invoice DOCX successfully generated and downloaded.\n\nInvoice No: ${invoiceNo}\nDue Date: ${dueDate}\nSubtotal: $${items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0).toFixed(2)}\nGST (18%): $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 0.18).toFixed(2)}\nGrand Total: $${(items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0) * (parseFloat(curr.rate) || 0), 0) * 1.18).toFixed(2)}`
        });
      } else if (documentType === "Question Paper") {
        if (!topic.trim()) {
          setError("Please specify a topic.");
          setLoading(false);
          return;
        }
        const data = await generateQuestionPaper({
          topic: topic.trim(),
          difficulty,
          num_questions: numQuestions,
          api_key: apiKey
        });
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to generate document.");
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
          AI Document Generator Agent
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Compile corporate status sheets, quotations, invoices, or academic question papers. The Generator Agent structures content dynamically into standard formatted outputs.
        </p>

        {/* Document Type Selector Pills */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          {["Report", "Quotation", "Invoice", "Question Paper"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDocumentType(type)}
              style={{
                background: documentType === type ? "rgba(75, 63, 158, 0.25)" : "transparent",
                color: documentType === type ? themeColors.textPrimary : themeColors.textSecondary,
                border: documentType === type ? `1px solid ${themeColors.accentPrimary}` : `1px solid ${themeColors.borderDivider}`,
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: typography.body.fontFamily,
                transition: "all 0.2s ease",
              }}
            >
              {type === "Report" && "📝 "}
              {type === "Quotation" && "💬 "}
              {type === "Invoice" && "💵 "}
              {type === "Question Paper" && "🎓 "}
              {type}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          {documentType === "Report" && (
            <>
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
            </>
          )}

          {(documentType === "Quotation" || documentType === "Invoice") && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {documentType === "Invoice" && (
                  <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                      required
                    />
                  </div>
                )}
                <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                    required
                  />
                </div>
                {documentType === "Quotation" ? (
                  <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Terms & Conditions
                    </label>
                    <input
                      type="text"
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                    />
                  </div>
                ) : (
                  <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                  Line Items
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        style={{ ...inputStyle, flex: "3", padding: "0.5rem" }}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                        style={{ ...inputStyle, flex: "1", padding: "0.5rem" }}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Rate ($)"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        style={{ ...inputStyle, flex: "1.5", padding: "0.5rem" }}
                        required
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            background: "rgba(239, 91, 91, 0.2)",
                            border: "none",
                            borderRadius: "6px",
                            color: themeColors.confidenceLow,
                            padding: "0.5rem",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    background: "rgba(52, 211, 153, 0.15)",
                    border: "none",
                    borderRadius: "6px",
                    color: themeColors.confidenceHigh,
                    padding: "0.4rem 0.8rem",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginTop: "0.75rem"
                  }}
                >
                  + Add Item
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ ...buttonStyle, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                {loading ? "Generating..." : `Generate ${documentType}`}
              </button>
            </div>
          )}

          {documentType === "Question Paper" && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                    Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fundamentals of Machine Learning"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                    required
                  />
                </div>
                <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      ...inputStyle,
                      padding: "0.6rem 1rem",
                      background: "#120B21"
                    }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: themeColors.textSecondary, fontWeight: 600 }}>
                    No. of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    style={{ ...inputStyle, padding: "0.6rem 1rem" }}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ ...buttonStyle, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                {loading ? "Generating Question Paper..." : "Generate Question Paper"}
              </button>
            </div>
          )}
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
