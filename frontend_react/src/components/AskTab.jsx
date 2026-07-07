import { useState, useRef } from "react";
import { askMindVault, notifyExpert, generatePPT } from "../api";
import {
  inputStyle, buttonStyle, linkButtonStyle, cardStyle,
  sectionLabelStyle, pillStyle, confidenceStyle,
} from "../styles";

export default function AskTab({ apiKey }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState("");
  const [notifiedExperts, setNotifiedExperts] = useState({});
  const [generatingPPT, setGeneratingPPT] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setListeningError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setListeningError("");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery((prev) => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (event) => {
        setListeningError("Error during speech recognition: " + event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  async function handleAsk(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setNotifiedExperts({});
    try {
      const data = await askMindVault(query, apiKey);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong reaching the API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNotifyExpert(expertName) {
    setNotifiedExperts((prev) => ({
      ...prev,
      [expertName]: { status: "sending", message: "" }
    }));
    try {
      const data = await notifyExpert(expertName, query);
      setNotifiedExperts((prev) => ({
        ...prev,
        [expertName]: { status: "success", message: data.message }
      }));
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || "Failed to notify expert.";
      setNotifiedExperts((prev) => ({
        ...prev,
        [expertName]: { status: "error", message: errorMsg }
      }));
    }
  }

  async function handleDownloadAnswerCard() {
    if (!result) return;
    setGeneratingPPT(true);
    try {
      const blob = await generatePPT({
        mode: "ask",
        ask_data: {
          query,
          answer: result.answer,
          confidence_score: result.confidence_score,
          sources: result.sources,
          experts: result.experts
        }
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mindvault_answer_${new Date().toISOString().slice(0, 10)}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          alert("Failed to generate answer card slide: " + (parsed.detail || ""));
        } catch (e) {
          alert("Failed to generate answer card slide.");
        }
      } else {
        alert("Failed to generate answer card slide: " + (err.response?.data?.detail || ""));
      }
    } finally {
      setGeneratingPPT(false);
    }
  }

  return (
    <div>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Query HR guidelines, leave policies, onboarding SOPs, and meeting notes.
      </p>

      <form onSubmit={handleAsk}>
        <div style={{ position: "relative" }}>
          <textarea
            placeholder="e.g. What is the remote work policy for new hires?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", paddingRight: "3rem" }}
          />
          <button
            type="button"
            onClick={toggleListening}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "0.75rem",
              background: isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${isListening ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
              borderRadius: "50%",
              width: "2.2rem",
              height: "2.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: isListening ? "#ef4444" : "#a78bfa",
              transition: "all 0.2s",
            }}
            title="Voice input"
          >
            🎤
          </button>
        </div>
        {listeningError && (
          <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>{listeningError}</p>
        )}
        {isListening && (
          <p style={{ color: "#a78bfa", fontSize: "0.85rem", margin: "0.25rem 0 0 0", fontStyle: "italic" }}>
            Listening... speak your question now
          </p>
        )}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Thinking..." : "Ask MindVault"}
        </button>
      </form>

      {error && (
        (() => {
          const isNoDocsIndexed = error.toLowerCase().includes("no documents indexed") || error.toLowerCase().includes("no indexed documents");
          return (
            <div
              style={{
                ...cardStyle,
                borderColor: isNoDocsIndexed ? "rgba(167, 139, 250, 0.3)" : "#f8717155",
                color: isNoDocsIndexed ? "#a78bfa" : "#f87171",
              }}
            >
              {error}
            </div>
          );
        })()
      )}

      {result && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: "#f3f4f6" }}>Answer</h3>
          <p style={{ color: "#d1d5db", lineHeight: 1.6 }}>{result.answer}</p>

          {(() => {
            const c = confidenceStyle(result.confidence_score);
            return (
              <span
                style={{
                  display: "inline-block", padding: "0.4em 0.8em", borderRadius: "999px",
                  fontWeight: 700, fontSize: "0.85rem", color: c.color, background: c.bg,
                  border: `1px solid ${c.color}55`, margin: "1rem 0",
                }}
              >
                {c.label}: {result.confidence_score}/100
              </span>
            );
          })()}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button onClick={() => setShowReasoning((v) => !v)} style={linkButtonStyle}>
              {showReasoning ? "Hide" : "Show"} reasoning details
            </button>
            <button
              type="button"
              onClick={handleDownloadAnswerCard}
              disabled={generatingPPT}
              style={{
                ...linkButtonStyle,
                color: "#a78bfa",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              🖥️ {generatingPPT ? "Downloading..." : "Export as PPT Slide"}
            </button>
          </div>
          {showReasoning && (
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {result.reasoning}
            </p>
          )}

          <div style={{ marginTop: "1.25rem" }}>
            <h4 style={sectionLabelStyle}>Sources</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {result.sources.map((s, i) => (
                <span key={i} style={pillStyle}>📄 {s}</span>
              ))}
            </div>
          </div>

          {result.experts.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h4 style={sectionLabelStyle}>People who may know more</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.experts.map((e, i) => {
                  const status = notifiedExperts[e];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ ...pillStyle, color: "#facc15" }}>👤 {e}</span>
                      
                      {(!status || status.status === "error") && (
                        <button
                          type="button"
                          onClick={() => handleNotifyExpert(e)}
                          disabled={status?.status === "sending"}
                          style={{
                            background: "rgba(167,139,250,0.1)",
                            border: "1px solid rgba(167,139,250,0.3)",
                            borderRadius: "6px",
                            color: "#a78bfa",
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            fontWeight: 600,
                            transition: "all 0.2s",
                          }}
                        >
                          {status?.status === "sending" ? "Sending..." : `Notify ${e}`}
                        </button>
                      )}
                      
                      {status?.status === "sending" && (
                        <span style={{ fontSize: "0.8rem", color: "#a78bfa" }}>Sending...</span>
                      )}
                      
                      {status?.status === "success" && (
                        <span style={{ fontSize: "0.8rem", color: "#4ade80", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          ✅ {status.message}
                        </span>
                      )}
                      
                      {status?.status === "error" && (
                        <span style={{ fontSize: "0.8rem", color: "#f87171" }}>
                          ❌ {status.message}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
