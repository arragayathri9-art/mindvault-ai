import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { cardStyle, themeColors, inputStyle, typography } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export default function DocUploader({ onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState(["General"]);
  const [selectedTeam, setSelectedTeam] = useState("General");
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load teams dynamically to populate the dropdown
    axios.get(`${API_BASE_URL}/api/teams`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setTeams(res.data.map(t => t.name || t));
        }
      })
      .catch(err => {
        console.warn("Could not fetch teams for uploader, defaulting to 'General':", err);
      });
  }, []);

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
      const formData = new FormData();
      formData.append("file", file);
      
      // Call endpoint with team_id query parameter
      const response = await axios.post(`${API_BASE_URL}/api/upload-doc?team_id=${encodeURIComponent(selectedTeam)}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setMessage(`✓ Uploaded and indexed: ${response.data.filename} under team '${selectedTeam}'`);
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
      <h3 style={{ ...typography.heading, marginTop: 0, fontSize: "1.1rem" }}>📤 Live Document Ingestion</h3>
      
      {/* Team Selection Dropdown */}
      <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
          Assign to Team Context
        </label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={{
            ...inputStyle,
            padding: "0.5rem 0.75rem",
            background: "#120B21",
            color: themeColors.textPrimary,
          }}
        >
          {teams.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? themeColors.highlightAmber : themeColors.borderDivider}`,
          borderRadius: "10px",
          background: isDragOver ? "rgba(75, 63, 158, 0.1)" : "rgba(255,255,255,0.02)",
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
        <p style={{ margin: 0, color: isDragOver ? themeColors.highlightAmber : themeColors.textSecondary, fontSize: "0.9rem" }}>
          {loading ? "Processing and indexing file..." : "Drag & drop a .txt policy file here, or click to browse"}
        </p>
      </div>
      {message && (
        <p style={{ color: themeColors.confidenceHigh, fontSize: "0.85rem", marginTop: "0.75rem", fontWeight: 500, margin: "0.75rem 0 0 0" }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ color: themeColors.confidenceLow, fontSize: "0.85rem", marginTop: "0.75rem", fontWeight: 500, margin: "0.75rem 0 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}
