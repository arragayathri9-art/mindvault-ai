// MindVault AI Purple/Amber Theme Styles

export const themeColors = {
  bgBase: "#161616",
  panelSurface: "#1F1F1F",
  panelSurfaceRaised: "#232323",
  borderDivider: "#333333",
  accentPrimary: "#C9A227",          // gold accent
  highlightAmber: "#C9A227",         // kept for backward-compatibility, now gold
  textPrimary: "#F2F2F0",
  textSecondary: "#8A8A8A",
  success: "#5FA777",                // muted sage
  danger: "#C9524F",                 // muted brick-red
  dangerAdminBadge: "#4A2020",
  confidenceHigh: "#5FA777",
  confidenceMedium: "#C9A227",
  confidenceLow: "#C9524F",
  badgeViolet: "#232323",
  badgeAmber: "#282828",
};

export const typography = {
  heading: {
    fontFamily: "'Lora', 'Source Serif 4', Georgia, serif",
    fontWeight: "700",
    color: themeColors.textPrimary,
  },
  body: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: "400",
    color: themeColors.textPrimary,
  },
  mono: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontWeight: "400",
    fontSize: "0.85rem",
  }
};

export const inputStyle = {
  width: "100%",
  padding: "0.8rem 1.2rem",
  borderRadius: "10px",
  border: `1px solid ${themeColors.borderDivider}`,
  background: "#1A1A1A",
  color: themeColors.textPrimary,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: typography.body.fontFamily,
  transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  ":focus": {
    borderColor: themeColors.accentPrimary,
    boxShadow: `0 0 0 2px ${themeColors.accentPrimary}33`
  }
};

export const buttonStyle = {
  marginTop: "1rem",
  padding: "0.75rem 1.8rem",
  borderRadius: "10px",
  border: "none",
  background: `linear-gradient(135deg, ${themeColors.accentPrimary} 0%, #7A5B0B 100%)`,
  color: themeColors.bgBase,
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  fontFamily: typography.body.fontFamily,
  transition: "transform 0.1s ease, filter 0.2s ease",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
};

export const linkButtonStyle = {
  background: "none",
  border: "none",
  color: themeColors.textSecondary,
  cursor: "pointer",
  padding: 0,
  fontSize: "0.85rem",
  fontWeight: 600,
  fontFamily: typography.body.fontFamily,
  textDecoration: "underline",
  transition: "color 0.2s ease",
};

export const cardStyle = {
  background: themeColors.panelSurface,
  border: `1px solid ${themeColors.borderDivider}`,
  borderRadius: "14px",
  padding: "1.75rem",
  marginTop: "1.25rem",
  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
  animation: "fadeInSlide 0.3s ease-out forwards",
};

export const sectionLabelStyle = {
  fontFamily: typography.mono.fontFamily,
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: themeColors.highlightAmber,
  margin: "0 0 0.5rem 0",
};

export const pillStyle = {
  background: "rgba(201, 162, 39, 0.12)",
  border: `1px solid ${themeColors.borderDivider}`,
  padding: "0.3rem 0.7rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  color: themeColors.textPrimary,
  fontFamily: typography.mono.fontFamily,
};

export function confidenceStyle(score) {
  if (score >= 80) {
    return {
      color: themeColors.confidenceHigh,
      bg: "rgba(95, 167, 119, 0.1)",
      border: `1px solid ${themeColors.confidenceHigh}55`,
      label: "High Confidence"
    };
  }
  if (score >= 40) {
    return {
      color: themeColors.confidenceMedium,
      bg: "rgba(201, 162, 39, 0.1)",
      border: `1px solid ${themeColors.confidenceMedium}55`,
      label: "Medium Confidence"
    };
  }
  return {
    color: themeColors.confidenceLow,
    bg: "rgba(201, 82, 79, 0.1)",
    border: `1px solid ${themeColors.confidenceLow}55`,
    label: "Low Confidence"
  };
}

export const kpiCardStyle = {
  background: themeColors.panelSurface,
  border: `1px solid ${themeColors.borderDivider}`,
  borderRadius: "12px",
  padding: "1.5rem",
  textAlign: "center",
  flex: 1,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};

export const spacing = {
  xs: "0.4rem",
  sm: "0.75rem",
  md: "1.25rem",
  lg: "2rem",
  xl: "3rem",
};

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
};
