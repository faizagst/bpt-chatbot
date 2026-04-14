"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { G, BRAND, SOURCE_BADGE, QUICK_REPLIES, WA_LINK, TICKET_LINK } from "./constants";
import Md from "./Md";

// ── Countdown Timer — ticks every second ──────────────────────────────────────
function CountdownTimer({ resetAt }) {
  const calc = () => {
    const diff = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return { diff, h, m, s };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (time.diff <= 0) return;
    const t = setInterval(() => {
      const next = calc();
      setTime(next);
      if (next.diff <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [resetAt]);

  if (time.diff <= 0)
    return (
      <span style={{ color: "#16a34a", fontWeight: 700 }}>
        Kuota sudah tersedia kembali — silakan coba lagi!
      </span>
    );

  return (
    <span>
      Coba lagi dalam{" "}
      <span style={{ fontWeight: 800, color: BRAND.RED, fontVariantNumeric: "tabular-nums" }}>
        {time.h > 0 && `${time.h} jam `}{time.m > 0 && `${time.m} menit `}{time.s} detik
      </span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CHAT WIDGET — v9: terintegrasi dengan backend RAG Python
// ═══════════════════════════════════════════════════════════════
export default function ChatWidget({ onLogMessage, isEmbedded = false }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{
    id: 0, from: "bot",
    text: "Halo! Saya **LENTERA (Layanan Talenta Digital Responsif AI)** 👋\n\nAda yang bisa saya bantu? Tanyakan informasi seputar program pelatihan, pendaftaran, sertifikasi, atau hal lainnya.",
    time: new Date()
  }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hoverLauncher, setHoverLauncher] = useState(false);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(null);
  // Waktu reset kuota (timestamp ms) — dipakai CountdownTimer
  const [quotaResetAt, setQuotaResetAt] = useState(null);
  const endRef = useRef();
  const inputRef = useRef();
  const sessionId = useRef(null);

  // Initialize Session ID immediately for persistence
  if (sessionId.current === null && typeof window !== "undefined") {
    let id = localStorage.getItem("bpt_chat_session_id");
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("bpt_chat_session_id", id);
    }
    sessionId.current = id;
  }

  useEffect(() => { if (open) { endRef.current?.scrollIntoView({ behavior: "smooth" }); setUnread(0); } }, [msgs, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const fetchQuota = async () => {
    try {
      const res = await fetch(`/api/rag/quota?session_id=${sessionId.current}`);
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (err) {
      console.error("Fetch quota error:", err);
    }
  };

  useEffect(() => {
    if (open && !quota) {
      fetchQuota();
    }
  }, [open, quota]);

  const send = async (text = input) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput("");
    setError(null);
    const userMsg = { id: Date.now(), from: "user", text: q, time: new Date() };
    setMsgs(p => [...p, userMsg]);
    setTyping(true);

    try {
      // ── Kirim ke backend RAG via Next.js proxy ──
      const res = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, session_id: sessionId.current }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          // Backend mengirim ttl_seconds → simpan waktu reset untuk countdown
          const ttlSec = errData.ttl_seconds || 0;
          const resetAt = Date.now() + ttlSec * 1000;
          setQuotaResetAt(resetAt);
          if (errData.quota) setQuota(errData.quota);
          // Simpan resetAt di pesan agar CountdownTimer bisa dirender
          const errMsg = {
            id: Date.now() + 1,
            from: "bot",
            isError: true,
            isQuotaError: true,
            resetAt,
            text: errData.detail || "Batas penggunaan tercapai.",
            time: new Date(),
          };
          setMsgs(p => [...p, errMsg]);
          if (!open) setUnread(n => n + 1);
          return;
        }
        throw new Error(errData.message || errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const { answer, sources = [], quota: newQuota, is_fallback } = data;
      if (newQuota) setQuota(newQuota);

      const botMsg = {
        id: Date.now() + 1,
        from: "bot",
        isError: is_fallback, // Flag to render as error card instead of standard Md
        isFallbackError: is_fallback, // Differentiator for header text
        text: answer,
        time: new Date(),
        source: "rag",
        docNames: sources,
      };
      setMsgs(p => [...p, botMsg]);
      if (!open) setUnread(n => n + 1);

    } catch (err) {
      console.error("Chat RAG error:", err);
      setError(err.message);
      const errMsg = {
        id: Date.now() + 1,
        from: "bot",
        isError: true,
        isQuotaError: false,
        text: "Maaf, terjadi kesalahan saat menghubungi server. Silakan coba beberapa saat lagi.",
        time: new Date(),
        source: "fallback",
      };
      setMsgs(p => [...p, errMsg]);
    } finally {
      setTyping(false);
    }
  };

  const timeStr = (d) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{opacity:0;transform:scale(.8) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.6)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        .qr-btn:hover{background:#eff6ff!important;border-color:${BRAND.BLUE}!important;color:${BRAND.NAVY}!important}
        .msg-in{animation:fadeUp .25s ease forwards}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
      `}</style>

      {/* Widget Launcher */}
      <div style={{ position: isEmbedded ? "absolute" : "fixed", bottom: isEmbedded ? 10 : 24, right: isEmbedded ? 10 : 24, zIndex: 9999 }}>
        {!open && unread > 0 && (
          <div style={{ position: "absolute", top: -6, right: -6, background: BRAND.RED, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, zIndex: 1, animation: "pulse 2s infinite" }}>{unread}</div>
        )}
        <button onClick={() => setOpen(!open)} onMouseEnter={() => setHoverLauncher(true)} onMouseLeave={() => setHoverLauncher(false)}
          style={{ width: 68, height: 68, borderRadius: "50%", background: "#fff", border: open ? "2px solid #e2e8f0" : `3.5px solid ${BRAND.BLUE}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: open ? "0 4px 12px rgba(0,0,0,.1)" : "0 8px 24px rgba(30,58,138,.3)", transition: "all .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)", transform: hoverLauncher && !open ? "scale(1.08)" : "scale(1)", position: "relative" }}>
          {open
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                <img src="/logo-lentera.png" alt="LENTERA" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(2)" }} />
                <span style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, background: "#10b981", borderRadius: "50%", border: "2.5px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}></span>
              </div>
            )
          }
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: isEmbedded ? "absolute" : "fixed",
          bottom: isEmbedded ? 80 : 96,
          right: isEmbedded ? 10 : 24,
          width: isEmbedded ? "calc(100% - 20px)" : 380,
          height: isEmbedded ? "calc(100% - 90px)" : 620,
          maxWidth: isEmbedded ? 380 : "none",
          maxHeight: isEmbedded ? 620 : "none",
          background: "#f8fafc",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: isEmbedded ? "0 10px 40px rgba(0,0,0,.1)" : "0 24px 80px rgba(0,0,0,.15)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          zIndex: 9998,
          animation: isEmbedded ? "none" : "pop .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif"
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(110deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
            position: "relative", borderBottom: `2px solid ${BRAND.BLUE}33`
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "40%", background: `radial-gradient(circle at top right, ${BRAND.NAVY}06 0%, transparent 60%)`, pointerEvents: "none" }} />

            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BRAND.NAVY}15`, boxShadow: "0 4px 10px rgba(30,156,215,0.08)", overflow: "hidden" }}>
              <img src="/logo-lentera.png" alt="Chatbot Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.9)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14.5, fontWeight: 900, color: BRAND.NAVY, lineHeight: 1.2, letterSpacing: "-.3px" }}>LENTERA</p>
              <p style={{ fontSize: 11.5, color: "#6b7280", display: "flex", alignItems: "center", gap: 5, fontWeight: 500, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Online - Responsif AI
              </p>
            </div>

            {/* Quota Pill */}
            {quota && (
              <div style={{ background: "#fff", border: `1px solid ${quota.remaining === 0 ? BRAND.RED : BRAND.BLUE}44`, borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 6px rgba(0,0,0,.03)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: quota.remaining === 0 ? BRAND.RED : BRAND.BLUE }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: BRAND.NAVY }}>{quota.remaining}/{quota.limit}</span>
              </div>
            )}

            <button onClick={() => setOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b7280", transition: "background .2s", marginTop: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div style={{ height: 1, background: "#e2e8f0", width: "100%" }} />

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
            {msgs.map((msg, i) => (
              <div key={msg.id} className={i === msgs.length - 1 && msg.from === "bot" ? "msg-in" : ""} style={{ display: "flex", flexDirection: msg.from === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
                {msg.from === "bot" && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${BRAND.NAVY}22`, overflow: "hidden" }}>
                    <img src="/logo-lentera.png" alt="Chatbot Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.9)" }} />
                  </div>
                )}
                <div style={{ maxWidth: "82%" }}>
                  <div style={{
                    background: msg.isError ? "linear-gradient(to bottom right, #fff1f2, #fff)" : (msg.from === "user" ? G : "#fff"),
                    borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "12px 16px", fontSize: 13.5,
                    color: msg.from === "user" ? "#fff" : "#1e293b",
                    lineHeight: 1.6,
                    border: msg.isError ? `1.5px solid ${BRAND.RED}22` : (msg.from === "bot" ? "1px solid #e2e8f0" : "none"),
                    boxShadow: msg.isError ? "0 8px 20px rgba(225,29,72,0.08)" : (msg.from === "bot" ? "0 4px 12px rgba(0,0,0,.03)" : "0 4px 16px rgba(30,58,138,.3)")
                  }}>
                    {msg.isError ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: BRAND.RED }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {msg.isQuotaError ? 'Batas Kuota Tercapai' : msg.isFallbackError ? 'Informasi Tidak Ditemukan' : 'Terjadi Kesalahan'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.6 }}>
                          {msg.isQuotaError
                            ? <><span>{msg.text}</span>{' '}<CountdownTimer resetAt={msg.resetAt} /></>
                            : msg.text}
                        </div>
                        <div style={{ height: 1, background: `${BRAND.RED}15` }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: BRAND.BLUE, fontSize: 12, fontWeight: 700, textDecoration: 'none', background: '#eff6ff', borderRadius: 8, padding: '7px 10px', border: '1px solid #dbeafe' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{ width: 16, height: 16, flexShrink: 0 }} />
                            Bantuan via WhatsApp
                            <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                          </a>
                          <a href={TICKET_LINK} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: BRAND.BLUE, fontSize: 12, fontWeight: 700, textDecoration: 'none', background: '#eff6ff', borderRadius: 8, padding: '7px 10px', border: '1px solid #dbeafe' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" /><path d="M2 15v4a2 2 0 0 1 2 2h16a2 2 0 0 1 2-2v-4" /><path d="M2 9a3 3 0 0 1 0 6" /><path d="M22 9a3 3 0 0 0 0 6" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
                            Bantuan via Ticketing System
                            <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                          </a>
                        </div>
                      </div>
                    ) : (
                      msg.from === "bot" ? <Md text={msg.text} /> : msg.text
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, justifyContent: msg.from === "user" ? "flex-end" : "flex-start", flexWrap: "wrap", padding: "0 4px" }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>{timeStr(msg.time)}</span>
                    {msg.source === "rag" && (
                      <span style={{ fontSize: 9.5, background: "#dbeafe", color: "#2563eb", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
                        Lentera
                      </span>
                    )}
                    {msg.source === "fallback" && SOURCE_BADGE["fallback"] && (
                      <span style={{ fontSize: 9.5, background: SOURCE_BADGE["fallback"].bg, color: SOURCE_BADGE["fallback"].color, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
                        {SOURCE_BADGE["fallback"].label}
                      </span>
                    )}
                    {msg.docNames?.length > 0 && (
                      <span style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic" }}>
                        📄 {msg.docNames[0].length > 20 ? msg.docNames[0].slice(0, 20) + "…" : msg.docNames[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 7, marginBottom: 12, alignItems: "flex-end" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${BRAND.NAVY}22`, overflow: "hidden" }}>
                  <img src="/logo-lentera.png" alt="Chatbot Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.45)" }} />
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick replies */}
          {msgs.length === 1 && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_REPLIES.map(qr => (
                <button key={qr.q} className="qr-btn" onClick={() => send(qr.q)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "5px 11px", fontSize: 11.5, color: "#475569", cursor: "pointer", fontFamily: "inherit", transition: "all .15s", fontWeight: 500 }}>{qr.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 7, alignItems: "center", background: "#f8fafc", borderRadius: 24, border: "1.5px solid #e2e8f0", padding: "4px 4px 4px 14px", transition: "border-color .2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#2563eb"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.length <= 100 && send()} placeholder="Ketik pertanyaan..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: input.length > 100 ? BRAND.RED : "#1e293b", outline: "none", fontFamily: "inherit" }} disabled={typing} />
              <button onClick={() => send()} disabled={!input.trim() || typing || input.length > 100} style={{ width: 34, height: 34, borderRadius: "50%", background: input.trim() && !typing && input.length <= 100 ? G : "#e2e8f0", border: "none", cursor: input.trim() && !typing && input.length <= 100 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s", flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, padding: "0 4px" }}>
              <p style={{ fontSize: 9.5, color: "#cbd5e1" }}>LENTERA - Komdigi - Responsif AI</p>
              <div style={{ fontSize: 10, fontWeight: 700, color: input.length > 100 ? BRAND.RED : input.length > 80 ? BRAND.YELLOW : "#cbd5e1", transition: "color .2s" }}>
                {input.length}/100
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
