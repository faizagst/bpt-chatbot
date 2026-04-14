"use client";
import { useState, useRef, useEffect } from "react";
import { BRAND } from "./constants";

// ═══════════════════════════════════════════════════════════════
//  ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════
export default function LoginPage({ onLogin, onBack }) {
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [show, setShow] = useState(false); const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false); const [shake, setShake] = useState(false);
  const uRef = useRef();
  useEffect(() => { uRef.current?.focus(); }, []);

  const submit = async () => {
    if (!u || !p) { setErr("Isi username dan password."); return; }
    setBusy(true); setErr("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u.trim(), password: p })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onLogin({ ...data.user, loginTime: Date.now() });
      } else {
        setBusy(false); setErr(data.message || "Username atau password salah."); setShake(true); setTimeout(() => setShake(false), 500); setP("");
      }
    } catch (e) {
      setBusy(false); setErr("Gagal menghubungi server."); setShake(true); setTimeout(() => setShake(false), 500);
    }
  };

  const inp = {
    background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, color: "#1e293b", outline: "none", width: "100%",
    fontFamily: "inherit", transition: "border-color .2s, box-shadow .2s"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
      
      {/* Decorative background vectors */}
      <svg style={{ position: "absolute", top: -50, left: -50, opacity: .03, width: 400, height: 400, pointerEvents: "none" }} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill={BRAND.NAVY} /></svg>
      <svg style={{ position: "absolute", bottom: -80, right: -40, opacity: .04, width: 400, height: 400, pointerEvents: "none" }} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill={BRAND.BLUE} /></svg>
      
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(30,58,138,.08)", border: "1px solid #e2e8f0" }}>
            <img src="/logo-bpt.png" alt="BPT Komdigi" style={{ width: 42, height: 42, objectFit: "contain" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: BRAND.NAVY, marginBottom: 4, letterSpacing: "-.5px", fontFamily: "inherit" }}>BPT <span style={{ color: BRAND.BLUE }}>Komdigi</span></h2>
          <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, letterSpacing: ".2px" }}>Admin Panel Manajemen Chatbot</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "32px 28px", boxShadow: "0 20px 40px rgba(0,0,0,.04)", animation: shake ? "shake .4s ease" : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: .5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Username</label>
              <input ref={uRef} value={u} onChange={e => { setU(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()} style={inp} placeholder="Masukkan username"
                onFocus={e => { e.target.style.borderColor = BRAND.BLUE; e.target.style.boxShadow = `0 0 0 3px ${BRAND.BLUE}22`; }} 
                onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: .5, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} value={p} onChange={e => { setP(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()} style={{ ...inp, paddingRight: 42 }} placeholder="Masukkan password"
                  onFocus={e => { e.target.style.borderColor = BRAND.BLUE; e.target.style.boxShadow = `0 0 0 3px ${BRAND.BLUE}22`; }} 
                  onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }} />
                <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {show ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
            </div>

            {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", display: "flex", gap: 8, fontWeight: 500, alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {err}
            </div>}

            <button onClick={submit} disabled={busy} style={{ background: busy ? "#e2e8f0" : BRAND.NAVY, border: "none", borderRadius: 10, padding: "14px", fontSize: 14.5, fontWeight: 800, color: busy ? "#94a3b8" : "#fff", cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: busy ? "none" : "0 4px 16px rgba(30,58,138,.3)", transition: "all .2s", marginTop: 4, fontFamily: "inherit" }}
              onMouseEnter={e => { if (!busy) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,138,.4)"; } }}
              onMouseLeave={e => { if (!busy) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,58,138,.3)"; } }}>
              {busy ? <><svg style={{ animation: "spin .7s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Memverifikasi...</> : "Masuk Panel →"}
            </button>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13.5, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", fontWeight: 500, marginTop: 4, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = BRAND.NAVY} onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
              ← Kembali ke Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
