import { useState, useEffect } from "react";
import { listDocuments, deleteDocument } from "../api";
import { cardStyle, pillStyle, linkButtonStyle } from "../styles";

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DeleteButton({ filename, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [timerId, setTimerId] = useState(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (confirm) {
      if (timerId) clearTimeout(timerId);
      setConfirm(false);
      onDelete(filename);
    } else {
      setConfirm(true);
      const id = setTimeout(() => {
        setConfirm(false);
      }, 4000); // 4-second confirmation window
      setTimerId(id);
    }
  };

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const normalStyle = {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#f87171",
    padding: "0.35rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  };

  const confirmStyle = {
    background: "#ef4444",
    border: "1px solid #ef4444",
    color: "#ffffff",
    padding: "0.35rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
  };

  return (
    <button
      onClick={handleClick}
      style={confirm ? confirmStyle : normalStyle}
    >
      {confirm ? "Confirm delete?" : "Delete"}
    </button>
  );
}

export default function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [expanded, setExpanded] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshTrigger]);

  const handleDelete = async (filename) => {
    setInfoMessage("");
    setErrorMessage("");

    const previousDocs = [...documents];
    // Optimistic UI update
    setDocuments((prev) => prev.filter((d) => d.filename !== filename));

    try {
      await deleteDocument(filename);
      setInfoMessage(`Deleted ${filename}`);
      setTimeout(() => {
        setInfoMessage("");
      }, 3000);
    } catch (err) {
      // Revert on error
      setDocuments(previousDocs);
      const errMsg = err?.response?.data?.detail || `Failed to delete ${filename}`;
      setErrorMessage(errMsg);
    }
  };

  return (
    <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: expanded ? "1rem" : "0",
          cursor: "pointer",
          userSelect: "none",
          padding: "0.25rem",
          borderRadius: "6px",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <h3 style={{ margin: 0, color: "#f3f4f6", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          📂 Indexed Documents
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: "inline-block",
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchDocs();
          }}
          disabled={loading}
          style={{ ...linkButtonStyle, fontSize: "0.9rem" }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {expanded && (
        <>
          {infoMessage && (
            <p style={{ color: "#4ade80", fontSize: "0.9rem", margin: "0 0 1rem 0", fontWeight: 500 }}>
              {infoMessage}
            </p>
          )}

          {errorMessage && (
            <p style={{ color: "#f87171", fontSize: "0.9rem", margin: "0 0 1rem 0", fontWeight: 500 }}>
              ❌ {errorMessage}
            </p>
          )}

          {error && (
            <p style={{ color: "#f87171", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
              {error}
            </p>
          )}

          {loading && documents.length === 0 ? (
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem", fontStyle: "italic" }}>
              No documents currently indexed.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "320px", overflowY: "auto", paddingRight: "0.25rem" }}>
              {documents.map((doc) => (
                <div
                  key={doc.filename}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "#e5e7eb", fontSize: "0.95rem" }}>📄 {doc.filename}</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={pillStyle}>{doc.chunk_count} chunk(s)</span>
                      <span style={{ ...pillStyle, opacity: 0.8 }}>{formatBytes(doc.size_bytes)}</span>
                    </div>
                  </div>
                  <DeleteButton filename={doc.filename} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
