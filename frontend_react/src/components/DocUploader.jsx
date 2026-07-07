import { useState, useRef } from "react";
import { uploadDoc } from "../api";
import { cardStyle } from "../styles";

export default function DocUploader({ onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are allowed.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await uploadDoc(file);
      setMessage(`✓ Uploaded and indexed: ${data.filename}`);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      const errMsg = err?.response?.data?.detail || "Failed to upload document.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
      <h3 style={{ marginTop: 0, color: "#f3f4f6", fontSize: "1.1rem" }}>📤 Live Document Ingestion</h3>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? "#a78bfa" : "rgba(255,255,255,0.15)"}`,
          borderRadius: "10px",
          background: isDragOver ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.02)",
          padding: "2rem 1.5rem",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
        }}
      >
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <p style={{ margin: 0, color: isDragOver ? "#a78bfa" : "#94a3b8", fontSize: "0.95rem" }}>
          {loading ? "Processing and indexing file..." : "Drag & drop a .txt policy file here, or click to browse"}
        </p>
      </div>
      {message && (
        <p style={{ color: "#4ade80", fontSize: "0.9rem", marginTop: "0.75rem", fontWeight: 500, margin: "0.75rem 0 0 0" }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.9rem", marginTop: "0.75rem", fontWeight: 500, margin: "0.75rem 0 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}
