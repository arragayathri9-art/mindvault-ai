import { useState } from "react";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography } from "../styles";
import { Bot, Key, User, ShieldAlert } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple validation (perfect for demo/hackathon purposes)
    setTimeout(() => {
      if (email === "admin@mindvault.ai" && password === "password123") {
        sessionStorage.setItem("userToken", "mindvault-session-token-xyz");
        onLoginSuccess();
      } else {
        setError("Invalid email address or password. Try the demo credentials.");
      }
      setLoading(false);
    }, 600);
  };

  const handleQuickLogin = () => {
    setEmail("admin@mindvault.ai");
    setPassword("password123");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: themeColors.bgBase,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        boxSizing: "border-box",
        fontFamily: typography.body.fontFamily
      }}
    >
      <div style={{ ...cardStyle, width: "100%", maxWidth: "420px", marginTop: 0, padding: "2.5rem" }}>
        
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "12px",
              background: "rgba(201, 162, 39, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              border: `1px solid ${themeColors.accentPrimary}33`
            }}
          >
            <Bot size={28} style={{ color: themeColors.accentPrimary }} />
          </div>
          <h2 style={{ ...typography.heading, fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>
            MindVault AI
          </h2>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginTop: "0.4rem", margin: 0 }}>
            Sign in to access your secure enterprise assistant
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "8px",
                padding: "0.75rem",
                fontSize: "0.8rem",
                color: themeColors.danger,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <User size={12} />
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ ...inputStyle, padding: "0.75rem 1rem" }}
            />
          </div>

          {/* Password input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: "bold", color: themeColors.textSecondary }}>
              <Key size={12} />
              PASSWORD
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, padding: "0.75rem 1rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              marginTop: "0.5rem",
              background: themeColors.accentPrimary,
              color: "#121212",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            {loading ? "Verifying Credentials..." : "Sign In to Workspace"}
          </button>
        </form>

        {/* Quick autofill helper */}
        <div
          style={{
            marginTop: "1.75rem",
            borderTop: `1px solid ${themeColors.borderDivider}`,
            paddingTop: "1.25rem",
            textAlign: "center"
          }}
        >
          <button
            type="button"
            onClick={handleQuickLogin}
            style={{
              background: "transparent",
              border: "none",
              color: themeColors.accentPrimary,
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline"
            }}
          >
            ⚡ Autofill Demo Credentials
          </button>
          <div style={{ fontSize: "0.7rem", color: themeColors.textSecondary, marginTop: "0.35rem" }}>
            admin@mindvault.ai / password123
          </div>
        </div>

      </div>
    </div>
  );
}
