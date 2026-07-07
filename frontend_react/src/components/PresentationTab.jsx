import { useState } from "react";
import { generatePPT } from "../api";
import { cardStyle, buttonStyle, inputStyle, sectionLabelStyle } from "../styles";

export default function PresentationTab({ apiKey }) {
  const [topic, setTopic] = useState("");
  const [loadingMode, setLoadingMode] = useState(null); // 'custom', 'insights', or null
  const [error, setError] = useState(null);

  const handleDownload = async (mode) => {
    setError(null);
    setLoadingMode(mode);
    try {
      const payload = {
        mode,
        api_key: apiKey || null,
        topic: mode === "custom" ? topic : null,
      };

      const blob = await generatePPT(payload);
      
      // Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = mode === "custom" 
        ? `mindvault_${topic.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${timestamp}.pptx`
        : `mindvault_insights_${timestamp}.pptx`;
        
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setError(parsed.detail || "An error occurred while generating the presentation.");
        } catch (e) {
          setError("An error occurred while generating the presentation.");
        }
      } else {
        setError(
          err.response?.data?.detail || "An error occurred while generating the presentation."
        );
      }
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Option 1: AI Custom Deck */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#a78bfa" }}>
          💡 AI PowerPoint Builder
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 1.2rem 0", lineHeight: "1.4" }}>
          Provide any topic, question, or outline, and MindVault AI will generate a complete, custom slide deck using Groq reasoning.
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={sectionLabelStyle}>Presentation Topic / Prompt</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Overview of Remote Work & Equipment Policies for 2026"
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "80px",
            }}
          />
        </div>

        <button
          onClick={() => handleDownload("custom")}
          disabled={loadingMode !== null || !topic.trim()}
          style={{
            ...buttonStyle,
            opacity: loadingMode !== null || !topic.trim() ? 0.6 : 1,
            cursor: loadingMode !== null || !topic.trim() ? "not-allowed" : "pointer",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {loadingMode === "custom" ? (
            <>
              <span className="spinner" style={spinnerStyle}></span>
              Generating PowerPoint Deck...
            </>
          ) : (
            "✨ Generate Custom AI Presentation"
          )}
        </button>
      </div>

      {/* Option 2: Insights Dashboard Deck */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#6366f1" }}>
          📊 Export System Insights Deck
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 1.2rem 0", lineHeight: "1.4" }}>
          Generate a formal presentation detailing system usage stats, index file counts, identified knowledge gaps, and HR expert coverage maps.
        </p>

        <button
          onClick={() => handleDownload("insights")}
          disabled={loadingMode !== null}
          style={{
            ...buttonStyle,
            background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
            opacity: loadingMode !== null ? 0.6 : 1,
            cursor: loadingMode !== null ? "not-allowed" : "pointer",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {loadingMode === "insights" ? (
            <>
              <span className="spinner" style={spinnerStyle}></span>
              Creating Insights PowerPoint...
            </>
          ) : (
            "📥 Download Insights Presentation"
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "10px",
            padding: "1rem",
            color: "#f87171",
            fontSize: "0.9rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Embedded Spinner Styles */}
      <style>{`
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const spinnerStyle = {
  marginRight: "0.5rem",
};
