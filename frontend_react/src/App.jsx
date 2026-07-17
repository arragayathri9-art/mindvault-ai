import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

// New Redesigned Tab Components
import Workspace from "./components/Workspace";
import KnowledgePage from "./components/KnowledgePage";
import WorkflowsPage from "./components/WorkflowsPage";
import DocumentsPage from "./components/DocumentsPage";
import HistoryPage from "./components/HistoryPage";
import SettingsPage from "./components/SettingsPage";
import Login from "./components/Login";

import { Sparkles, Database, Zap, FolderOpen, Clock, Settings, Bot } from "lucide-react";
import { themeColors, typography, radius } from "./styles";

const NAV_ITEMS = [
  { id: "workspace", label: "Workspace", icon: Sparkles },
  { id: "knowledge", label: "Knowledge", icon: Database },
  { id: "workflows", label: "Workflows", icon: Zap },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("userToken") === "mindvault-session-token-xyz"
  );
  const [activeNav, setActiveNav] = useState("workspace");
  
  // System states passed globally
  const [apiKey, setApiKey] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("General");
  const [userRole, setUserRole] = useState("Software Engineer");

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

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
      {/* 1. Left Sidebar Rail (240px) */}
      <div
        style={{
          width: "240px",
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
          boxShadow: "2px 0 10px rgba(0,0,0,0.01)",
          overflowY: "auto",
        }}
      >
        {/* Brand indicator */}
        <div
          style={{
            fontFamily: typography.heading.fontFamily,
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: themeColors.textPrimary,
            marginBottom: "2rem",
            padding: "0 0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onClick={() => setActiveNav("workspace")}
        >
          <Bot size={22} style={{ color: themeColors.accentPrimary }} />
          <span>MindVault AI</span>
        </div>

        {/* Sidebar Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
                  padding: "0.75rem 1rem",
                  borderRadius: radius.md,
                  background: isActive ? "rgba(16, 185, 129, 0.08)" : "transparent",
                  border: "none",
                  color: isActive ? themeColors.accentPrimary : themeColors.textSecondary,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: typography.body.fontFamily,
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                <IconComponent size={18} style={{ color: isActive ? themeColors.accentPrimary : themeColors.textSecondary }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick status footer */}
        <div style={{ marginTop: "auto", padding: "0.75rem", borderTop: `1px solid ${themeColors.borderDivider}`, fontSize: "0.75rem", color: themeColors.textSecondary }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: themeColors.accentPrimary }} />
            <span>Ready for queries</span>
          </div>
          <div style={{ marginTop: "0.25rem", fontSize: "0.7rem", opacity: 0.8 }}>
            Role: {userRole}
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("userToken");
              setIsAuthenticated(false);
            }}
            style={{
              marginTop: "0.75rem",
              background: "transparent",
              border: "none",
              color: themeColors.textSecondary,
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              textDecoration: "underline",
              padding: 0,
              display: "block",
              width: "100%",
              textAlign: "left"
            }}
          >
            🚪 Sign Out of Workspace
          </button>
        </div>
      </div>

      {/* 2. Main content area */}
      <div
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "3rem",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <ErrorBoundary>
            {activeNav === "workspace" && (
              <Workspace apiKey={apiKey} selectedTeam={selectedTeam} />
            )}
            
            {activeNav === "knowledge" && (
              <KnowledgePage apiKey={apiKey} />
            )}
            
            {activeNav === "workflows" && (
              <WorkflowsPage />
            )}
            
            {activeNav === "documents" && (
              <DocumentsPage />
            )}
            
            {activeNav === "history" && (
              <HistoryPage />
            )}
            
            {activeNav === "settings" && (
              <SettingsPage
                apiKey={apiKey}
                setApiKey={setApiKey}
                selectedTeam={selectedTeam}
                setSelectedTeam={setSelectedTeam}
                userRole={userRole}
                setUserRole={setUserRole}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
