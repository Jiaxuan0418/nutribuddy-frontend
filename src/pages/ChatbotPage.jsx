// src/pages/ChatbotPage.jsx — AI nutrition chatbot with persistent chat history

import { useState, useEffect, useRef } from "react";
import { C } from "../theme";

const API_URL = "https://JxChan-nutribuddy-backend.hf.space/api";

const SUGGESTIONS = [
  "What should I eat for breakfast?",
  "Give me a high-protein meal idea",
  "How do I calculate my BMR?",
  "I hit my calorie target, any tips?",
];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// ── Message formatter: converts AI Markdown text into structured JSX ──────────
//
// Handles:
//   **bold**        → <strong>
//   *italic*        → <em>
//   - item / • item → <ul><li>
//   1. item         → <ol><li>
//   ### Heading     → green section header
//   blank line      → paragraph gap
//   Fallback        → auto-splits long run-on sentences at ". " boundaries
//                     so even un-formatted AI replies get some structure
//
function formatMessage(text) {
  if (!text) return null;

  // ── Inline bold / italic formatter ──────────────────────────────────────
  function inlineFormat(str) {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  }

  // ── Pre-process: normalise line endings ─────────────────────────────────
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const elements = [];
  let listItems = [];
  let listType  = null;
  let key       = 0;

  function flushList() {
    if (!listItems.length) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    const isOrdered = listType === "ol";
    elements.push(
      <div key={key++} style={{ margin: "6px 0 4px" }}>
        <Tag style={{
          paddingLeft: 20,
          display: "flex", flexDirection: "column", gap: 3,
          listStyleType: isOrdered ? "decimal" : "disc",
        }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ fontSize: 14, lineHeight: 1.6, color: "inherit" }}>
              {inlineFormat(item)}
            </li>
          ))}
        </Tag>
      </div>
    );
    listItems = [];
    listType  = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // ── Section heading: ###, ##, # ───────────────────────────────────────
    const headMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headMatch) {
      flushList();
      elements.push(
        <div key={key++} style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800, fontSize: 12,
          color: "#4CAF7D",
          textTransform: "uppercase", letterSpacing: ".6px",
          marginTop: 10, marginBottom: 3,
          borderBottom: "1.5px solid #e8f5ee",
          paddingBottom: 3,
        }}>
          {headMatch[1]}
        </div>
      );
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid #e8f5ee", margin: "8px 0" }} />);
      continue;
    }

    // ── Unordered list: "- " or "• " or "* " ─────────────────────────────
    const ulMatch = line.match(/^[-•*]\s+(.+)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    // ── Ordered list: "1. " or "1) " ─────────────────────────────────────
    const olMatch = line.match(/^\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    // ── Blank line → paragraph gap ────────────────────────────────────────
    if (line.trim() === "") {
      flushList();
      if (elements.length > 0) {
        elements.push(<div key={key++} style={{ height: 6 }} />);
      }
      continue;
    }

    // ── Normal text line ──────────────────────────────────────────────────
    flushList();

    // Fallback: if a line is a long run-on paragraph (>120 chars, no Markdown),
    // auto-split at sentence boundaries so it's easier to read.
    const trimmed = line.trim();
    const isLong  = trimmed.length > 120 && !trimmed.includes("**");

    if (isLong) {
      // Split on ". ", "! ", "? " — keep the punctuation on the left chunk
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) {
        sentences.forEach((sentence, si) => {
          if (!sentence.trim()) return;
          elements.push(
            <p key={key++} style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              {inlineFormat(sentence.trim())}
            </p>
          );
          // Add a tiny gap between sentences
          if (si < sentences.length - 1) {
            elements.push(<div key={key++} style={{ height: 4 }} />);
          }
        });
        continue;
      }
    }

    elements.push(
      <p key={key++} style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
        {inlineFormat(trimmed)}
      </p>
    );
  }

  flushList();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {elements}
    </div>
  );
}

// ── History sidebar ───────────────────────────────────────────────────────────
function HistoryPanel({ sessions, activeSessionId, onSelect, onNew, onDelete, loading, historyEnabled }) {
  return (
    <div style={{
      width: 240, minWidth: 240,
      background: "#fff",
      border: `1.5px solid ${C.border}`,
      borderRadius: 16,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>💬 History</div>
        <button
          onClick={onNew}
          style={{
            background: C.green, color: "#fff",
            border: "none", borderRadius: 8,
            padding: "5px 10px", fontSize: 12, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {!historyEnabled && (
          <div style={{
            fontSize: 11, color: C.muted, padding: "10px 8px",
            background: "#fffbe6", borderRadius: 8, margin: "4px 0",
            lineHeight: 1.5,
          }}>
            ⚠️ Run <b>chat_history_migration.sql</b> in phpMyAdmin to enable history.
          </div>
        )}
        {historyEnabled && loading && (
          <div style={{ fontSize: 12, color: C.muted, padding: 12, textAlign: "center" }}>
            Loading…
          </div>
        )}
        {historyEnabled && !loading && sessions.length === 0 && (
          <div style={{ fontSize: 12, color: C.muted, padding: 12, textAlign: "center" }}>
            No past chats yet.<br />Start a conversation!
          </div>
        )}
        {sessions.map((s) => {
          const isActive = s.session_id === activeSessionId;
          return (
            <div
              key={s.session_id}
              onClick={() => onSelect(s.session_id)}
              style={{
                padding: "10px 10px",
                borderRadius: 10,
                marginBottom: 4,
                cursor: "pointer",
                background: isActive ? C.greenLight : "transparent",
                border: `1.5px solid ${isActive ? C.green : "transparent"}`,
                transition: "all .15s",
                position: "relative",
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.text,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                paddingRight: 22,
              }}>
                {s.title || "Chat session"}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                {formatDate(s.started_at)} · {s.message_count} msgs
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); onDelete(s.session_id); }}
                title="Delete session"
                style={{
                  position: "absolute", top: 8, right: 8,
                  fontSize: 13, color: C.muted, cursor: "pointer",
                  padding: 2, borderRadius: 4, opacity: 0.6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = 1; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.muted;   e.currentTarget.style.opacity = 0.6; }}
              >
                🗑
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatbotPage({ profile, user }) {
  const makeGreeting = () => ({
    role: "ai",
    text: `Hi ${user.name.split(" ")[0]}! 👋 I'm your NutriBuddy AI assistant. I can help you with meal ideas, nutritional advice, and personalised diet guidance. What would you like to know today?`,
  });

  const [messages,        setMessages]        = useState([makeGreeting()]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [sessionId,       setSessionId]       = useState(null);
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyEnabled,  setHistoryEnabled]  = useState(true);
  const [showHistory,     setShowHistory]     = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    if (!user?.id) return;
    setSessionsLoading(true);
    try {
      const res  = await fetch(`${API_URL}/chat/history/${user.id}`);
      const data = await res.json();
      // Backend returns a "warning" key when the SQL table isn't set up yet
      if (data.warning) {
        setHistoryEnabled(false);
      } else {
        setHistoryEnabled(true);
        setSessions(data.sessions || []);
      }
    } catch {
      // Network error — don't block the chat
    }
    setSessionsLoading(false);
  }

  async function loadSession(sid) {
    if (sid === sessionId) return; // already loaded
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/chat/history/${user.id}/${sid}`);
      const data = await res.json();
      const loaded = (data.messages || []).map((m) => ({
        role: m.role === "assistant" ? "ai" : "user",
        text: m.text,
        time: m.created_at,
      }));
      setMessages([makeGreeting(), ...loaded]);
      setSessionId(sid);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function startNewChat() {
    setMessages([makeGreeting()]);
    setSessionId(null);
    setInput("");
  }

  async function deleteSession(sid) {
    try {
      await fetch(`${API_URL}/chat/history/${user.id}/${sid}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.session_id !== sid));
      if (sid === sessionId) startNewChat();
    } catch { /* ignore */ }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg    = { role: "user", text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build history — skip the greeting, use "user"/"model" roles for backend
    const historyPayload = newMessages.slice(1).map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      text: m.text,
    }));

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          profile,
          session_id: sessionId,   // null on first message → backend generates one
          history:    historyPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data   = await res.json();
      const reply  = data.reply || "Sorry, I couldn't generate a response.";
      const newSid = data.session_id;

      setMessages((prev) => [...prev, { role: "ai", text: reply }]);

      // Update session id and refresh the history list
      if (newSid) {
        const isNewSession = !sessionId;
        setSessionId(newSid);
        if (historyEnabled) {
          // Small delay so DB write completes before we fetch the list
          setTimeout(fetchSessions, 400);
          if (isNewSession) {
            // Immediately add a placeholder so the panel updates right away
            setSessions((prev) => {
              const exists = prev.some((s) => s.session_id === newSid);
              if (exists) return prev;
              return [{
                session_id:    newSid,
                started_at:    new Date().toISOString(),
                message_count: 2,
                title:         text.slice(0, 60),
              }, ...prev];
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `⚠️ Could not reach the backend. Make sure Flask is running (\`python app.py\` in the backend folder). Error: ${err.message}`,
        },
      ]);
      console.error("Chat fetch error:", err);
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) sendMessage();
  }

  return (
    <div className="fade-in" style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24 }}>AI Chatbot 💬</h1>
          <p style={{ color: C.muted, marginTop: 4 }}>Your personal nutrition assistant, powered by Llama 3.3 via Groq</p>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          style={{
            background: showHistory ? C.greenLight : "#f0f0f0",
            color: showHistory ? C.green : C.muted,
            border: `1.5px solid ${showHistory ? C.green : C.border}`,
            borderRadius: 10, padding: "8px 14px",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>

        {/* History panel */}
        {showHistory && (
          <HistoryPanel
            sessions={sessions}
            activeSessionId={sessionId}
            onSelect={loadSession}
            onNew={startNewChat}
            onDelete={deleteSession}
            loading={sessionsLoading}
            historyEnabled={historyEnabled}
          />
        )}

        {/* Chat window */}
        <div style={{
          flex: 1, background: "#fff",
          border: `1.5px solid ${C.border}`, borderRadius: 16,
          display: "flex", flexDirection: "column",
          overflow: "hidden", minHeight: 0,
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: C.greenLight,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>NutriBuddy Assistant</div>
              <div style={{ fontSize: 12, color: C.green }}>● Online · Llama 3.3 70B via Groq</div>
            </div>
            {sessionId && (
              <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>Session active</div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: 20,
            display: "flex", flexDirection: "column",
          }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div className={`chat-bubble ${m.role === "user" ? "chat-user" : "chat-ai"}`}>
                  {m.role === "ai" ? formatMessage(m.text) : m.text}
                </div>
                {m.time && (
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                    {formatTime(m.time)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-ai" style={{ maxWidth: 80 }}>
                <div className="chat-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
              {SUGGESTIONS.map((s) => (
                <div
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    padding: "6px 12px", borderRadius: 99,
                    border: `1px solid ${C.border}`,
                    fontSize: 12, cursor: "pointer",
                    color: C.muted, fontWeight: 600, transition: "all .18s",
                  }}
                  onMouseEnter={(e) => (e.target.style.borderColor = C.green)}
                  onMouseLeave={(e) => (e.target.style.borderColor = C.border)}
                >
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: "12px 20px", borderTop: `1px solid ${C.border}`,
            display: "flex", gap: 10, flexShrink: 0,
          }}>
            <input
              className="nb-input"
              placeholder="Ask me anything about nutrition..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1 }}
            />
            <button
              className="btn-green"
              onClick={sendMessage}
              disabled={loading}
              style={{ padding: "11px 18px" }}
            >
              {loading ? "..." : "Send ↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}