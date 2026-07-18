import { useState, useEffect } from "react";
import { sendManagerMessage, getManagerMessages } from "../api";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { MessageSquare, Send, Mail, Calendar, CheckCircle, Clock } from "lucide-react";

export default function ContactManager() {
  const userEmail = sessionStorage.getItem("userEmail") || "";
  const userName = sessionStorage.getItem("userName") || "";
  const userTeamId = sessionStorage.getItem("userTeamId") || "General";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getManagerMessages("Employee", userEmail);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch manager messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await sendManagerMessage({
        employee_email: userEmail,
        subject: subject.trim(),
        message: message.trim()
      });
      if (res.status === "success" || res.id) {
        setMsg({ 
          text: `Message successfully sent to your team manager (${res.routed_to_manager})!`, 
          type: "success" 
        });
        setSubject("");
        setMessage("");
        fetchMessages();
      } else {
        setMsg({ text: "Failed to send message.", type: "error" });
      }
    } catch (err) {
      setMsg({ 
        text: err.response?.data?.detail || "Error sending message to manager.", 
        type: "error" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Left Column: Form */}
      <div style={{ flex: "1.2 1 450px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MessageSquare size={20} style={{ color: themeColors.accentPrimary }} />
            <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
              Contact My Manager
            </h3>
          </div>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Send a direct message to your team manager. The message will be routed based on your assigned team ({userTeamId}).
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {msg.text && (
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                background: msg.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${msg.type === "success" ? themeColors.success : "rgba(239, 68, 68, 0.3)"}`,
                color: msg.type === "success" ? themeColors.success : themeColors.confidenceLow,
              }}>
                {msg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>SUBJECT</label>
              <input
                type="text"
                required
                placeholder="e.g. Query regarding Q3 goals or Project blocker"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>MESSAGE</label>
              <textarea
                required
                rows={8}
                placeholder="Type your message to the manager here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, fontFamily: typography.body.fontFamily, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...buttonStyle,
                background: themeColors.accentPrimary,
                color: "#121212",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              <Send size={14} />
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Sent Messages History List & Inspector */}
      <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Mail size={20} style={{ color: themeColors.accentPrimary }} />
            <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
              Sent Messages
            </h3>
          </div>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            History of direct messages sent to your team manager.
          </p>

          <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading && messages.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                Loading messages...
              </p>
            ) : messages.length === 0 ? (
              <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                No messages sent yet.
              </p>
            ) : (
              messages.map((m) => {
                const isRead = m.status === "read";
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMsg(m)}
                    style={{
                      background: selectedMsg?.id === m.id ? "rgba(201, 162, 39, 0.08)" : themeColors.panelSurfaceRaised,
                      border: `1px solid ${selectedMsg?.id === m.id ? themeColors.accentPrimary : themeColors.borderDivider}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.9rem", color: themeColors.textPrimary }}>
                        {m.subject}
                      </span>
                      <span style={{
                        ...pillStyle,
                        fontSize: "0.68rem",
                        padding: "0.1rem 0.4rem",
                        color: isRead ? themeColors.success : themeColors.confidenceMedium,
                        borderColor: isRead ? themeColors.success : themeColors.confidenceMedium,
                        background: isRead ? "rgba(16, 185, 129, 0.04)" : "rgba(245, 158, 11, 0.04)"
                      }}>
                        {m.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: themeColors.textSecondary, marginTop: "0.4rem" }}>
                      <Calendar size={12} />
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>To: {m.manager_email}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Message Inspector */}
        {selectedMsg && (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ ...typography.heading, fontSize: "1.1rem", margin: 0 }}>
                Message Details
              </h4>
              <span style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: selectedMsg.status === "read" ? themeColors.success : themeColors.confidenceMedium
              }}>
                {selectedMsg.status === "read" ? <CheckCircle size={14} /> : <Clock size={14} />}
                {selectedMsg.status === "read" ? "Read by Manager" : "Unread"}
              </span>
            </div>
            
            <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginBottom: "1rem" }}>
              Subject: <strong>{selectedMsg.subject}</strong><br/>
              Sent: <strong>{new Date(selectedMsg.created_at).toLocaleString()}</strong><br/>
              Manager: <strong>{selectedMsg.manager_email}</strong>
            </div>

            <div style={{
              background: "#1E1E1E",
              border: `1px solid ${themeColors.borderDivider}`,
              borderRadius: "12px",
              padding: "1.25rem",
              fontSize: "0.85rem",
              color: themeColors.textPrimary,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6
            }}>
              {selectedMsg.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
