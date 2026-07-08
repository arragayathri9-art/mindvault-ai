import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            background: "#1C1638",
            border: "1px solid #EF5B5B",
            borderRadius: "14px",
            color: "#F5F3FA",
            marginTop: "1rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#EF5B5B", fontFamily: "'Lora', serif" }}>
            Feature Temporarily Unavailable
          </h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#8B84AD" }}>
            We encountered an error loading this feature. The rest of MindVault is still running normally.
          </p>
          {this.state.error && (
            <pre
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "#120B21",
                border: "1px solid #2E2650",
                borderRadius: "8px",
                color: "#EF5B5B",
                fontSize: "0.8rem",
                overflowX: "auto",
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#4B3F9E",
              color: "#F5F3FA",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem"
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
