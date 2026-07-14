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

// UI Redesign components
import PageShell from "./components/PageShell";
import AdminLock from "./components/AdminLock";
import { Bot, FolderOpen, Mic, Mail, FileText, Zap, BarChart3, Users, GraduationCap, ShieldAlert, ShieldCheck, Settings, Search, AlertTriangle, Lightbulb, Headset } from "lucide-react";

import { themeColors, typography, radius, spacing } from "./styles";

const NAV_ITEMS = [
  { id: "chat", label: "Employee Copilot", icon: Bot },
  { id: "documents", label: "Knowledge Explorer", icon: FolderOpen },
  { id: "meetings", label: "Meetings", icon: Mic },
  { id: "emails", label: "Email Generator", icon: Mail },
  { id: "reports", label: "Report Generator", icon: FileText },
  { id: "workflows", label: "Workflows", icon: Zap },
  { id: "gaps", label: "Gap Reports", icon: BarChart3 },
  { id: "teams", label: "Teams", icon: Users },
  { id: "onboarding", label: "Onboarding", icon: GraduationCap },
];

const ADMIN_NAV_ITEMS = [
  { id: "admin", label: "Admin Dashboard", icon: ShieldAlert },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [activeNav, setActiveNav] = useState("chat");
  const [apiKey, setApiKey] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("General");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(
    () => sessionStorage.getItem("adminToken") === "admin-session-token-abc"
  );

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
      {/* 1. Left Icon Rail (216px) */}
      <div
        style={{
          width: "216px",
          backgroundColor: themeColors.panelSurface,
          borderRight: `1px solid ${themeColors.borderDivider}`,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0.75rem",
          gap: "0.5rem",
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
            fontSize: "1.3rem",
            fontWeight: "bold",
            color: themeColors.highlightAmber,
            marginBottom: "1.5rem",
            padding: "0 1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onClick={() => setActiveNav("chat")}
        >
          <Bot size={24} style={{ color: themeColors.highlightAmber }} />
          <span>MindVault AI</span>
        </div>

        <div style={{ fontFamily: typography.mono.fontFamily, fontSize: "0.7rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.5rem 1rem 0.25rem" }}>
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1rem",
                borderRadius: radius.sm,
                background: isActive ? "rgba(201, 162, 39, 0.12)" : "transparent",
                border: "none",
                borderLeft: isActive ? `3px solid ${themeColors.highlightAmber}` : "3px solid transparent",
                color: isActive ? themeColors.textPrimary : themeColors.textSecondary,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: typography.body.fontFamily,
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s ease",
              }}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div style={{ fontFamily: typography.mono.fontFamily, fontSize: "0.7rem", color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", padding: "1rem 1rem 0.25rem", borderTop: `1px solid ${themeColors.borderDivider}`, marginTop: "0.5rem" }}>
          System
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          let IconComponent = item.icon;
          if (item.id === "admin") {
            IconComponent = isAdminUnlocked ? ShieldCheck : ShieldAlert;
          }
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1rem",
                borderRadius: radius.sm,
                background: isActive ? "rgba(201, 162, 39, 0.12)" : "transparent",
                border: "none",
                borderLeft: isActive ? `3px solid ${themeColors.highlightAmber}` : "3px solid transparent",
                color: isActive ? themeColors.textPrimary : themeColors.textSecondary,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: typography.body.fontFamily,
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s ease",
              }}
            >
              <IconComponent size={20} style={{ color: item.id === "admin" && !isAdminUnlocked ? themeColors.confidenceLow : "inherit" }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Main Content Workspace */}
      <div
        style={{
          marginLeft: "216px",
          flex: 1,
          padding: "2.5rem",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >

        {/* View Routing with Error Boundaries */}
        <div style={{ position: "relative", width: "100%" }}>
          {/* A. Chat View (Centered Pane) */}
          {activeNav === "chat" && (
            <PageShell eyebrow="MindVault Dashboard" title={chatSubTab === "support" ? "Support Agent Console" : "Employee Copilot"} maxWidth={chatSubTab === "copilot" ? "1200px" : "720px"}>
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
                  { id: "copilot", label: "Copilot Dashboard", icon: Bot },
                  { id: "ask", label: "Ask MindVault", icon: Search },
                  { id: "risk", label: "Risk Check", icon: AlertTriangle },
                  { id: "presentation", label: "Generate Slides", icon: Lightbulb },
                  { id: "support", label: "Support Agent", icon: Headset },
                ].map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setChatSubTab(sub.id)}
                      style={{
                        background: chatSubTab === sub.id ? "rgba(201, 162, 39, 0.12)" : "transparent",
                        color: chatSubTab === sub.id ? themeColors.textPrimary : themeColors.textSecondary,
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.6rem 1.2rem",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: typography.body.fontFamily,
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <SubIcon size={14} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
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
            </PageShell>
          )}

          {/* B. Knowledge Explorer View */}
          {activeNav === "documents" && (
            <PageShell eyebrow="MindVault Dashboard" title="Knowledge Explorer" maxWidth="1100px">
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
            </PageShell>
          )}

          {/* C. Meetings View (Voice-to-Text) */}
          {activeNav === "meetings" && (
            <PageShell eyebrow="MindVault Dashboard" title="Meetings">
              <ErrorBoundary>
                <MeetingsTab apiKey={apiKey} selectedTeam={selectedTeam} onUploadSuccess={handleUploadSuccess} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* D. Workflows View */}
          {activeNav === "workflows" && (
            <PageShell eyebrow="MindVault Dashboard" title="Workflows">
              <ErrorBoundary>
                <WorkflowsTab apiKey={apiKey} selectedTeam={selectedTeam} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* E. Gap Reports View */}
          {activeNav === "gaps" && (
            <PageShell eyebrow="MindVault Dashboard" title="Gap Reports">
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <ErrorBoundary>
                  <GapReportsTab />
                </ErrorBoundary>
                <ErrorBoundary>
                  <div style={{ marginTop: spacing.xl, borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: spacing.lg }}>
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
                        margin: `0 0 ${spacing.md} 0`,
                      }}
                    >
                      Usage Analytics & Experts
                    </h3>
                    <InsightsTab />
                  </div>
                </ErrorBoundary>
              </div>
            </PageShell>
          )}

          {/* F. Teams View */}
          {activeNav === "teams" && (
            <PageShell eyebrow="MindVault Dashboard" title="Teams">
              <ErrorBoundary>
                <TeamsTab selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* G. Onboarding View */}
          {activeNav === "onboarding" && (
            <PageShell eyebrow="MindVault Dashboard" title="Onboarding">
              <ErrorBoundary>
                <OnboardingTab apiKey={apiKey} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* Email Generator View */}
          {activeNav === "emails" && (
            <PageShell eyebrow="MindVault Dashboard" title="Email Generator">
              <ErrorBoundary>
                <EmailGenerator apiKey={apiKey} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* Report Generator View */}
          {activeNav === "reports" && (
            <PageShell eyebrow="MindVault Dashboard" title="Report Generator">
              <ErrorBoundary>
                <ReportGenerator apiKey={apiKey} />
              </ErrorBoundary>
            </PageShell>
          )}

          {/* Admin Dashboard View */}
          {activeNav === "admin" && (
            <PageShell eyebrow="MindVault Dashboard" title="Admin Dashboard" maxWidth="1200px">
              {!isAdminUnlocked ? (
                <AdminLock onUnlock={() => setIsAdminUnlocked(true)} />
              ) : (
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              )}
            </PageShell>
          )}

          {/* H. Settings View */}
          {activeNav === "settings" && (
            <PageShell eyebrow="MindVault Dashboard" title="Settings" maxWidth="600px">
              <div
                style={{
                  background: themeColors.panelSurface,
                  border: `1px solid ${themeColors.borderDivider}`,
                  borderRadius: radius.md,
                  padding: "2rem",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                <h3
                  style={{
                    fontFamily: typography.heading.fontFamily,
                    marginTop: 0,
                    marginBottom: "1rem",
                    color: themeColors.textPrimary,
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
                        background: "#1A1A1A",
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
                          background: "rgba(201, 162, 39, 0.15)",
                          border: "1px solid rgba(201, 162, 39, 0.3)",
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
            </PageShell>
          )}
        </div>
      </div>
    </div>
  );
}
