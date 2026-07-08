// MindVault AI Purple/Amber Theme Styles

export const themeColors = {
  bgBase: "#150F26",          // deep purple-navy
  panelSurface: "#1C1638",    // raised purple
  borderDivider: "#2E2650",   // hairline divider
  textPrimary: "#F5F3FA",
  textSecondary: "#8B84AD",
  accentPrimary: "#4B3F9E",   // violet buttons, active nav, icons
  highlightAmber: "#F0A742",  // amber eyebrow labels
  confidenceHigh: "#34D399",  // emerald
  confidenceMedium: "#F0A742",// amber
  confidenceLow: "#EF5B5B",   // coral red
  badgeViolet: "#3D3470",     // violet-tinted circle bg
  badgeAmber: "#4A3714",      // amber-tinted circle bg
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
  background: "#120B21",
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
  background: `linear-gradient(135deg, ${themeColors.accentPrimary} 0%, #312680 100%)`,
  color: "white",
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
  background: "rgba(75, 63, 158, 0.15)",
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
      bg: "rgba(52, 211, 153, 0.1)",
      border: `1px solid ${themeColors.confidenceHigh}55`,
      label: "High Confidence"
    };
  }
  if (score >= 40) {
    return {
      color: themeColors.confidenceMedium,
      bg: "rgba(240, 167, 66, 0.1)",
      border: `1px solid ${themeColors.confidenceMedium}55`,
      label: "Medium Confidence"
    };
  }
  return {
    color: themeColors.confidenceLow,
    bg: "rgba(239, 91, 91, 0.1)",
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
