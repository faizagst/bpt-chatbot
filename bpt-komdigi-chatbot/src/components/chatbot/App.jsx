"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { G, BRAND } from "./constants";
import ChatWidget from "./ChatWidget";

// ═══════════════════════════════════════════════════════════════
//  ROOT APP — v9: docs & docOnlyMode dihapus (dikelola backend)
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Navbar */}
      <nav style={{ 
        background: "linear-gradient(90deg, #ffffff 0%, #f4f8fb 60%, #e6f4fa 100%)", 
        borderBottom: `2px solid ${BRAND.BLUE}33`, 
        padding: "0 24px", display: "flex", alignItems: "center", height: 66, gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(30,156,215,0.06)", overflow: "hidden" 
      }}>
        <div style={{ position: "absolute", top: -40, right: "15%", width: 300, height: 300, background: `radial-gradient(circle, ${BRAND.BLUE}08 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: "20%", width: 200, height: 200, background: `radial-gradient(circle, ${BRAND.NAVY}05 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
          <img src="/logo-bpt.png" alt="BPT Komdigi" style={{ height: 38, objectFit: "contain", marginTop: 4 }} />
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: BRAND.NAVY, lineHeight: 1, letterSpacing: "-.5px", fontFamily: "inherit" }}>BPT <span style={{ color: BRAND.BLUE }}>Komdigi</span></p>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginTop: 3, letterSpacing: ".2px" }}>Kementerian Komunikasi dan Digital RI</p>
          </div>
          <div style={{ flex: 1 }} />
          <a href="https://bpt.komdigi.go.id" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", fontWeight: 600, display: "none", "@media(minWidth:600px)": { display: "block" } }}>Website Resmi ↗</a>
          <button onClick={() => router.push("/admin")} style={{ background: BRAND.NAVY, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(30,58,138,.3)", transition: "transform .15s,box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(30,58,138,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,58,138,.3)"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Admin
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: G, padding: "64px 24px", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", top: -50, left: -50, opacity: .06, width: 300, height: 300 }} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#fff" /></svg>
        <svg style={{ position: "absolute", bottom: -80, right: -40, opacity: .08, width: 400, height: 400 }} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill={BRAND.YELLOW} /></svg>
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 30, padding: "6px 16px", marginBottom: 20, fontSize: 12.5, fontWeight: 700, backdropFilter: "blur(4px)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80aa" }} />
            Chatbot Resmi BPT Komdigi
          </div>
          <h1 style={{ fontSize: "clamp(26px,6vw,44px)", fontWeight: 900, marginBottom: 12, lineHeight: 1.15, letterSpacing: "-1px" }}>Selamat Datang di<br />BPT Komdigi</h1>
          <p style={{ fontSize: "clamp(14px,3vw,17px)", opacity: .9, maxWidth: 580, margin: "0 auto 32px", lineHeight: 1.6, fontWeight: 500 }}>Balai Pelatihan Talenta Komunikasi dan Digital — Unit Pelaksana Teknis Kementerian Komunikasi dan Digital RI</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://bpt.komdigi.go.id/fpelatihan/kategori" target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: BRAND.NAVY, borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(0,0,0,.15)", transition: "transform .2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              Lihat Program
            </a>
            <a href="https://digitalent.komdigi.go.id" target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(4px)", transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}>
              🎓 DTS Gratis
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "#fff", padding: "24px 24px", display: "flex", justifyContent: "center", gap: 0, borderBottom: "1px solid #e2e8f0", position: "relative", zIndex: 2, boxShadow: "0 4px 20px rgba(0,0,0,.04)" }}>
        {[["70+", "Program Pelatihan", BRAND.NAVY], ["16+", "Pengajar", BRAND.BLUE], ["120+", "Materi", BRAND.YELLOW], ["38.000+", "Alumni", BRAND.RED]].map(([v, l, c]) => (
          <div key={l} style={{ textAlign: "center", padding: "10px 32px", borderRight: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: "clamp(18px,4vw,28px)", fontWeight: 900, color: c, lineHeight: 1, textShadow: c === BRAND.YELLOW ? "0 2px 4px rgba(245,184,0,.2)" : "none" }}>{v}</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{l}</p>
          </div>
        ))}
      </div>

      <section style={{ padding: "80px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,32px)", fontWeight: 900, color: BRAND.NAVY, marginBottom: 12, letterSpacing: "-.5px" }}>Program Unggulan</h2>
            <p style={{ fontSize: 14.5, color: "#64748b", maxWidth: 600, margin: "0 auto" }}>Klik tombol chat di pojok kanan bawah untuk bertanya lebih lanjut kepada Asisten AI kami</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { i: "🏫", t: "Pelatihan PNBP", d: "Pelatihan berbayar bersertifikat SKKNI/BNSP untuk masyarakat umum.", color: "#e0f2fe", iconBg: "#f0f9ff", iconB: "#bae6fd" },
              { i: "🏛️", t: "Pelatihan ASN", d: "Program GTA khusus Aparatur Sipil Negara — transformasi digital birokrasi.", color: "#f1f5f9", iconBg: "#f8fafc", iconB: "#e2e8f0" },
              { i: "🎓", t: "DTS Gratis", d: "Digital Talent Scholarship — beasiswa pelatihan 100% gratis dari pemerintah.", color: "#dcfce7", iconBg: "#f0fdf4", iconB: "#bbf7d0" },
              { i: "♿", t: "Inklusif", d: "Program pelatihan khusus penyandang disabilitas dengan fasilitas ramah difabel.", color: "#fef9c3", iconBg: "#fefce8", iconB: "#fef08a" },
            ].map(x => (
              <div key={x.t} style={{ background: "#fff", padding: "32px 28px", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,.03)", transition: "transform .2s, box-shadow .2s", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.03)"; }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: x.color, opacity: 0.6 }} />
                <div style={{ width: 48, height: 48, borderRadius: 14, background: x.iconBg, border: `1px solid ${x.iconB}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16, position: "relative", zIndex: 1 }}>
                  {x.i}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: BRAND.NAVY, marginBottom: 12, position: "relative", zIndex: 1 }}>{x.t}</h3>
                <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, position: "relative", zIndex: 1, fontWeight: 500 }}>{x.d}</p>
              </div>
            ))}
          </div>

          {/* Contact bar */}
          <div style={{ background: "#fff", border: `1px solid #e2e8f0`, borderTop: `4px solid ${BRAND.BLUE}`, borderRadius: 16, padding: "24px", marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, boxShadow: "0 10px 30px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src="/logo-bpt.png" alt="BPT Logo" style={{ width: 48, height: 48, objectFit: "contain", background: "#f8fafc", borderRadius: 8, padding: 4, border: `1px solid ${BRAND.NAVY}22` }} />
              <div>
                <p style={{ fontSize: 16, fontWeight: 900, color: BRAND.NAVY, marginBottom: 4, letterSpacing: "-.3px" }}>Butuh Bantuan Langsung?</p>
                <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Tim BPT Komdigi siap membantu Anda di jam kerja.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[{ icon: "📞", label: "0811-1166-784", href: "https://wa.me/628111166784" }, { icon: "📧", label: "bpt@komdigi.go.id", href: "mailto:bpt@komdigi.go.id" }, { icon: "🌐", label: "bpt.komdigi.go.id", href: "https://bpt.komdigi.go.id" }].map(c => (
                <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>{c.icon} {c.label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Widget — v9: tidak lagi butuh prop docs / docOnlyMode */}
      <ChatWidget />
    </div>
  );
}
