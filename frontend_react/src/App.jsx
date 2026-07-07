import { useState } from "react";
import AskTab from "./components/AskTab";
import RiskTab from "./components/RiskTab";
import InsightsTab from "./components/InsightsTab";
import PresentationTab from "./components/PresentationTab";
import DocUploader from "./components/DocUploader";
import DocumentList from "./components/DocumentList";
import { inputStyle } from "./styles";

const TABS = [
  { id: "ask", label: "🔍 Ask MindVault" },
  { id: "risk", label: "⚠️ Risk Check" },
  { id: "insights", label: "📊 Insights Dashboard" },
  { id: "presentation", label: "💡 Generate Slides" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("ask");
  const [apiKey, setApiKey] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1e38 0%, #0d0d1b 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#e5e7eb",
        padding: "2rem",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "2.5rem",
          maxWidth: "1280px",
          margin: "0 auto",
          flexWrap: "wrap"
        }}
      >
        {/* Left Column: Config, Ingestion, Documents */}
        <div
          style={{
            flex: "0 0 380px",
            width: "380px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                background: "linear-gradient(90deg, #a78bfa 0%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              MindVault AI
            </h1>
            <p style={{ color: "#94a3b8", marginTop: "0.3rem", marginBottom: 0, fontSize: "0.85rem" }}>
              Intelligent HR Knowledge Base & Risk Management
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#94a3b8",
                fontWeight: 600
              }}
            >
              Groq API Config
            </label>
            <input
              type="password"
              placeholder="Groq API key (or leave blank for server key)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <DocUploader onUploadSuccess={handleUploadSuccess} />
          
          <DocumentList refreshTrigger={refreshTrigger} />
        </div>

        {/* Right Column: Main Console */}
        <div
          style={{
            flex: "1 1 500px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}
        >
          {/* Tabs Control */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "0.75rem",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "rgba(167,139,250,0.15)" : "transparent",
                  color: activeTab === tab.id ? "#a78bfa" : "#94a3b8",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.6rem 1.2rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Console Panel */}
          <div style={{ minHeight: "400px" }}>
            {activeTab === "ask" && <AskTab apiKey={apiKey} />}
            {activeTab === "risk" && <RiskTab apiKey={apiKey} />}
            {activeTab === "insights" && <InsightsTab />}
            {activeTab === "presentation" && <PresentationTab apiKey={apiKey} />}
          </div>
        </div>
      </div>
    </div>
  );
}
