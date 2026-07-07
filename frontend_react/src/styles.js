export const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};

export const buttonStyle = {
  marginTop: "1rem",
  padding: "0.7rem 1.6rem",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(90deg, #a78bfa 0%, #6366f1 100%)",
  color: "white",
  fontWeight: 700,
  fontSize: "0.95rem",
  cursor: "pointer",
};

export const linkButtonStyle = {
  background: "none",
  border: "none",
  color: "#a78bfa",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.85rem",
  fontWeight: 600,
};

export const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "1.5rem",
  marginTop: "1rem",
};

export const sectionLabelStyle = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
  margin: "0 0 0.5rem 0",
};

export const pillStyle = {
  background: "rgba(255,255,255,0.06)",
  padding: "0.3rem 0.7rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  color: "#d1d5db",
};

export function confidenceStyle(score) {
  if (score >= 80) return { color: "#4ade80", bg: "rgba(34, 197, 94, 0.15)", label: "High Confidence" };
  if (score >= 40) return { color: "#facc15", bg: "rgba(234, 179, 8, 0.15)", label: "Medium Confidence" };
  return { color: "#f87171", bg: "rgba(239, 68, 68, 0.15)", label: "Low Confidence" };
}

export const kpiCardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  padding: "1.4rem",
  textAlign: "center",
  flex: 1,
};
