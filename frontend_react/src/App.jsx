import { useState } from "react";
import AskTab from "./components/AskTab";
import RiskTab from "./components/RiskTab";
import InsightsTab from "./components/InsightsTab";
import PresentationTab from "./components/PresentationTab";
import DocUploader from "./components/DocUploader";
import DocumentList from "./components/DocumentList";
import ErrorBoundary from "./components/ErrorBoundary";
import MeetingsTab from "./components/MeetingsTab";
import WorkflowsTab from "./components/WorkflowsTab";
import GapReportsTab from "./components/GapReportsTab";
import TeamsTab from "./components/TeamsTab";
import OnboardingTab from "./components/OnboardingTab";

// Copilot New Components
import CopilotDashboard from "./components/CopilotDashboard";
import EmailGenerator from "./components/EmailGenerator";
import ReportGenerator from "./components/ReportGenerator";
import AdminDashboard from "./components/AdminDashboard";
import SupportTab from "./components/SupportTab";

import { themeColors, typography } from "./styles";

const NAV_ITEMS = [
  { id: "chat", label: "Employee Copilot", icon: "🤖", badgeFill: "#3D3470" },
  { id: "documents", label: "Knowledge Explorer", icon: "📁", badgeFill: "#4A3714" },
  { id: "meetings", label: "Meetings", icon: "🎤", badgeFill: "#3D3470" },
  { id: "emails", label: "Email Generator", icon: "📧", badgeFill: "#4A3714" },
  { id: "reports", label: "Report Generator", icon: "📝", badgeFill: "#3D3470" },
  { id: "workflows", label: "Workflows", icon: "⚡", badgeFill: "#4A3714" },
  { id: "gaps", label: "Gap Reports", icon: "📊", badgeFill: "#3D3470" },
  { id: "teams", label: "Teams", icon: "👥", badgeFill: "#4A3714" },
  { id: "onboarding", label: "Onboarding", icon: "🎓", badgeFill: "#3D3470" },
  { id: "admin", label: "Admin Dashboard", icon: "🛡️", badgeFill: "#4A3714" },
  { id: "settings", label: "Settings", icon: "⚙️", badgeFill: "#4A3714" },
];

export default function App() {
  const [activeNav, setActiveNav] = useState("chat");
  const [apiKey, setApiKey] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("General");

  // Default to Copilot Dashboard
  const [chatSubTab, setChatSubTab] = useState("copilot");

  const handleUploadSuccess = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: themeColors.bgBase,
        color: themeColors.textPrimary,
        fontFamily: typography.body.fontFamily,
        display: "flex",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Left Icon Rail (68px) */}
      <div
        style={{
          width: "68px",
          backgroundColor: themeColors.panelSurface,
          borderRight: `1px solid ${themeColors.borderDivider}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem 0",
          gap: "0.75rem",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          boxShadow: "4px 0 15px rgba(0,0,0,0.15)",
          overflowY: "auto",
        }}
      >
        {/* Brand indicator */}
        <div
          style={{
            fontFamily: typography.heading.fontFamily,
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: themeColors.highlightAmber,
            marginBottom: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setActiveNav("chat")}
          title="MindVault AI"
        >
          MV
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: isActive ? themeColors.accentPrimary : item.badgeFill,
                border: isActive ? `2px solid ${themeColors.highlightAmber}` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.2rem",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                outline: "none",
                position: "relative",
              }}
              title={item.label}
            >
              <span style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}>{item.icon}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Main Content Workspace */}
      <div
        style={{
          marginLeft: "68px",
          flex: 1,
          padding: "2.5rem",
          boxSizing: "border-box",
          minWidth: 0, // Prevent flex items from overflowing
        }}
      >
        {/* Header Eyebrow + Serif Pattern */}
        <div style={{ marginBottom: "2rem" }}>
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
            MindVault Dashboard
          </div>
          <h1
            style={{
              fontFamily: typography.heading.fontFamily,
              fontSize: "2.2rem",
              fontWeight: 700,
              margin: 0,
              color: themeColors.textPrimary,
            }}
          >
            {NAV_ITEMS.find((n) => n.id === activeNav)?.label || "Workspace"}
          </h1>
        </div>

        {/* View Routing with Error Boundaries */}
        <div style={{ position: "relative", width: "100%" }}>
          {/* A. Chat View (Centered Pane) */}
          {activeNav === "chat" && (
            <div style={{ maxWidth: chatSubTab === "copilot" ? "1200px" : "720px", margin: "0 auto" }}>
              {/* Sub-tabs: Copilot / Ask / Risk Check / Generate Slides */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderBottom: `1px solid ${themeColors.borderDivider}`,
                  paddingBottom: "0.75rem",
                  marginBottom: "1.5rem",
                  overflowX: "auto"
                }}
              >
                {[
                  { id: "copilot", label: "🤖 Copilot Dashboard" },
                  { id: "ask", label: "🔍 Ask MindVault" },
                  { id: "risk", label: "⚠️ Risk Check" },
                  { id: "presentation", label: "💡 Generate Slides" },
                  { id: "support", label: "📞 Support Agent" },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setChatSubTab(sub.id)}
                    style={{
                      background: chatSubTab === sub.id ? "rgba(75, 63, 158, 0.25)" : "transparent",
                      color: chatSubTab === sub.id ? themeColors.textPrimary : themeColors.textSecondary,
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.6rem 1.2rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: typography.body.fontFamily,
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: "400px" }}>
                {chatSubTab === "copilot" && (
                  <ErrorBoundary>
                    <CopilotDashboard apiKey={apiKey} selectedTeam={selectedTeam} setActiveNav={setActiveNav} />
                  </ErrorBoundary>
                )}
                {chatSubTab === "ask" && (
                  <ErrorBoundary>
                    <AskTab apiKey={apiKey} selectedTeam={selectedTeam} />
                  </ErrorBoundary>
                )}
                {chatSubTab === "risk" && (
                  <ErrorBoundary>
                    <RiskTab apiKey={apiKey} />
                  </ErrorBoundary>
                )}
                 {chatSubTab === "presentation" && (
                  <ErrorBoundary>
                    <PresentationTab apiKey={apiKey} />
                  </ErrorBoundary>
                )}
                {chatSubTab === "support" && (
                  <ErrorBoundary>
                    <SupportTab apiKey={apiKey} />
                  </ErrorBoundary>
                )}
              </div>
            </div>
          )}

          {/* B. Knowledge Explorer View */}
          {activeNav === "documents" && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "2.5rem",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: "1 1 380px", maxWidth: "450px" }}>
                <ErrorBoundary>
                  <DocUploader onUploadSuccess={handleUploadSuccess} />
                </ErrorBoundary>
              </div>
              <div style={{ flex: "2 1 500px" }}>
                <ErrorBoundary>
                  <DocumentList refreshTrigger={refreshTrigger} />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* C. Meetings View (Voice-to-Text) */}
          {activeNav === "meetings" && (
            <ErrorBoundary>
              <MeetingsTab apiKey={apiKey} selectedTeam={selectedTeam} onUploadSuccess={handleUploadSuccess} />
            </ErrorBoundary>
          )}

          {/* D. Workflows View */}
          {activeNav === "workflows" && (
            <ErrorBoundary>
              <WorkflowsTab apiKey={apiKey} selectedTeam={selectedTeam} />
            </ErrorBoundary>
          )}

          {/* E. Gap Reports View */}
          {activeNav === "gaps" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <ErrorBoundary>
                <GapReportsTab />
              </ErrorBoundary>
              <ErrorBoundary>
                <div style={{ marginTop: "1rem" }}>
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
                    SYSTEM INSIGHTS
                  </div>
                  <h3
                    style={{
                      fontFamily: typography.heading.fontFamily,
                      fontSize: "1.5rem",
                      margin: "0 0 1.25rem 0",
                    }}
                  >
                    Usage Analytics & Experts
                  </h3>
                  <InsightsTab />
                </div>
              </ErrorBoundary>
            </div>
          )}

          {/* F. Teams View */}
          {activeNav === "teams" && (
            <ErrorBoundary>
              <TeamsTab selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
            </ErrorBoundary>
          )}

          {/* G. Onboarding View */}
          {activeNav === "onboarding" && (
            <ErrorBoundary>
              <OnboardingTab apiKey={apiKey} />
            </ErrorBoundary>
          )}

          {/* Email Generator View */}
          {activeNav === "emails" && (
            <ErrorBoundary>
              <EmailGenerator apiKey={apiKey} />
            </ErrorBoundary>
          )}

          {/* Report Generator View */}
          {activeNav === "reports" && (
            <ErrorBoundary>
              <ReportGenerator apiKey={apiKey} />
            </ErrorBoundary>
          )}

          {/* Admin Dashboard View */}
          {activeNav === "admin" && (
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          )}

          {/* H. Settings View */}
          {activeNav === "settings" && (
            <div style={{ maxWidth: "600px" }}>
              <div
                style={{
                  background: themeColors.panelSurface,
                  border: `1px solid ${themeColors.borderDivider}`,
                  borderRadius: "14px",
                  padding: "2rem",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                <h3
                  style={{
                    fontFamily: typography.heading.fontFamily,
                    marginTop: 0,
                    marginBottom: "1rem",
                  }}
                >
                  System Configuration
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: themeColors.textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      Groq API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Groq API key (e.g. gsk_... or leave blank to use server key)"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      autoComplete="new-password"
                      style={{
                        padding: "0.8rem 1rem",
                        borderRadius: "10px",
                        border: `1px solid ${themeColors.borderDivider}`,
                        background: "#120B21",
                        color: themeColors.textPrimary,
                        fontSize: "0.95rem",
                        outline: "none",
                      }}
                    />
                    <p style={{ color: themeColors.textSecondary, fontSize: "0.8rem", margin: 0 }}>
                      If not provided, the server will fallback to the default <code>GROQ_API_KEY</code> environment variable.
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: `1px solid ${themeColors.borderDivider}`,
                      paddingTop: "1rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 0.5rem 0",
                        fontSize: "0.95rem",
                        color: themeColors.textPrimary,
                      }}
                    >
                      Active Filter Profile
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: themeColors.textSecondary }}>Selected Team Context:</span>
                      <span
                        style={{
                          background: "rgba(240, 167, 66, 0.15)",
                          border: "1px solid rgba(240, 167, 66, 0.3)",
                          color: themeColors.highlightAmber,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                        }}
                      >
                        {selectedTeam}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
