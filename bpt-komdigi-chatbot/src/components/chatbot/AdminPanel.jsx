"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { G, BRAND, SESSION_MS, fmtSz, fmtTime } from "./constants";
import AnalyticsSection from "./AnalyticsSection";
import HistorySection from "./HistorySection";

// ═══════════════════════════════════════════════════════════════
//  ADMIN PANEL — v9: Upload & dokumen dikelola backend RAG
//  - Hapus client-side extractText / chunkDoc
//  - Upload ke /api/rag/upload (proxy ke Python FastAPI)
//  - Daftar dokumen dari /api/rag/documents (proxy ke Python FastAPI)
// ═══════════════════════════════════════════════════════════════
export default function AdminPanel({ admin, onLogout }) {
  const [section, setSection] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { status, filename, error }
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sessLeft, setSessLeft] = useState(SESSION_MS - (Date.now() - admin.loginTime));
  const fileRef = useRef();

  useEffect(() => {
    const t = setInterval(() => {
      const left = SESSION_MS - (Date.now() - admin.loginTime);
      if (left <= 0) { onLogout(); clearInterval(t); } else setSessLeft(left);
    }, 1000);
    return () => clearInterval(t);
  }, [admin.loginTime, onLogout]);

  // ── Ambil daftar dokumen dari backend RAG ──
  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/rag/documents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (e) {
      console.error("Fetch docs error:", e);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === "manage") fetchDocs();
  }, [section, fetchDocs]);

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini? AI tidak akan bisa menjawab pertanyaan dari dokumen ini lagi.")) return;

    setDeletingId(docId);
    try {
      const res = await fetch(`/api/rag/documents?id=${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      // Refresh list
      fetchDocs();
    } catch (e) {
      console.error("Delete doc error:", e);
      alert("Gagal menghapus dokumen: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Upload file ke backend RAG ──
  const handleFiles = useCallback(async (files) => {
    const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".csv", ".xlsx", ".png", ".jpg", ".jpeg", ".txt"];
    for (const file of Array.from(files)) {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        alert(`Format "${ext}" tidak didukung. Gunakan PDF, DOC, DOCX, CSV, XLSX, PNG, JPG, atau TXT.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert("File terlalu besar (maks 15MB)");
        continue;
      }

      setUploading(true);
      setUploadResult(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/rag/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setUploadResult({ status: "success", filename: data.filename, docId: data.doc_id });
        // Beralih ke tab Kelola Dokumen untuk melihat hasilnya
        setTimeout(() => setSection("manage"), 1000);

      } catch (e) {
        console.error("Upload error:", e);
        setUploadResult({ status: "error", error: e.message });
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const warn = sessLeft < 5 * 60 * 1000;

  const Btn = ({ id, icon, label, badge }) => (
    <button onClick={() => setSection(id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", background: section === id ? "#eff6ff" : "transparent", color: section === id ? "#2563eb" : "#64748b", fontWeight: section === id ? 700 : 500, fontSize: 12.5, marginBottom: 2, transition: "all .15s" }}>
      <span>{icon}</span>{label}
      {badge != null && badge > 0 && <span style={{ marginLeft: "auto", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 9.5, padding: "1px 6px", fontWeight: 700 }}>{badge}</span>}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Topbar */}
      <div style={{ background: "#fff", padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 60, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,.03)", borderBottom: "1px solid #e2e8f0" }}>
        <img src="/logo-bpt.png" alt="BPT Logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 900, color: BRAND.NAVY, lineHeight: 1, letterSpacing: "-.3px", fontFamily: "inherit" }}>BPT <span style={{ color: BRAND.BLUE }}>Komdigi</span></p>
          <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, marginTop: 2, letterSpacing: ".2px" }}>Admin Panel</p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: warn ? "#fef2f2" : "#f8fafc", border: `1px solid ${warn ? "#fecaca" : "#e2e8f0"}`, borderRadius: 8, padding: "4px 10px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={warn ? "#ef4444" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: warn ? "#ef4444" : "#64748b" }}>{fmtTime(sessLeft)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <span style={{ fontSize: 13 }}>{admin.avatar}</span>
          <div><p style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.NAVY }}>{admin.username}</p><p style={{ fontSize: 9.5, color: "#64748b" }}>{admin.role}</p></div>
        </div>
        <button onClick={onLogout} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#ef4444", cursor: "pointer", fontFamily: "inherit", transition: "background .2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"} onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}>
          Keluar
        </button>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", padding: "16px 14px", flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 10 }}>Menu</p>
          <Btn id="upload" icon="📤" label="Upload Dokumen" />
          <Btn id="manage" icon="📋" label="Kelola Dokumen" badge={docs.length} />
          <Btn id="analytics" icon="📊" label="Analitik Pertanyaan" />
          <Btn id="history" icon="💬" label="Riwayat Pesan" />

          <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />

          <p style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 10 }}>Info Backend</p>
          {[
            { l: "Total Dokumen", v: docs.length, c: BRAND.NAVY },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 2, background: "#f8fafc" }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{s.l}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: s.c }}>{s.v}</span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 11, color: "#0369a1", lineHeight: 1.4, fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
              🤖 Mode AI RAG
            </p>
            <p style={{ fontSize: 10, color: "#0369a1", lineHeight: 1.5, marginTop: 4, fontWeight: 500 }}>
              Semua dokumen aktif di Qdrant
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px", background: "#f8fafc" }}>

          {/* ── UPLOAD ── */}
          {section === "upload" && (
            <div style={{ maxWidth: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>📤</span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: BRAND.NAVY, letterSpacing: "-.3px", position: "relative" }}>
                  Upload Dokumen
                  <span style={{ position: "absolute", bottom: -4, left: 0, width: 32, height: 3, background: BRAND.RED, borderRadius: 2 }} />
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.7, marginTop: 8 }}>
                Dokumen yang diupload akan diproses oleh backend AI RAG (LangChain + Qdrant + Gemini) dan langsung tersedia sebagai sumber jawaban chatbot.
              </p>

              {/* Drop zone */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? BRAND.BLUE : "#e2e8f0"}`, borderRadius: 16, padding: "50px 20px", textAlign: "center", cursor: uploading ? "default" : "pointer", background: dragOver ? "#eff6ff" : "#fff", transition: "all .2s", marginBottom: 20 }}>
                <input ref={fileRef} type="file" multiple hidden
                  accept=".txt,.pdf,.doc,.docx,.csv,.xlsx,.png,.jpg,.jpeg"
                  onChange={e => handleFiles(e.target.files)} />
                <div style={{ width: 64, height: 64, borderRadius: 16, background: dragOver ? G : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", transition: "background .2s" }}>
                  {uploading
                    ? <svg style={{ animation: "spin .7s linear infinite" }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.BLUE} strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "#fff" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  }
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: BRAND.NAVY, marginBottom: 6 }}>
                  {uploading ? "Mengupload & memproses dokumen..." : "Drag & Drop atau klik untuk upload"}
                </p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>PDF · DOC · DOCX · CSV · XLSX · PNG · JPG · TXT · Maks 15MB</p>
                {!uploading && <span style={{ background: G, color: "#fff", borderRadius: 10, padding: "10px 24px", fontSize: 13.5, fontWeight: 800, display: "inline-block", boxShadow: "0 4px 12px rgba(30,58,138,.3)" }}>Pilih File</span>}
              </div>

              {/* Upload result */}
              {uploadResult && (
                <div style={{ background: uploadResult.status === "success" ? "#dcfce7" : "#fef2f2", border: `1px solid ${uploadResult.status === "success" ? "#86efac" : "#fecaca"}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>{uploadResult.status === "success" ? "✅" : "❌"}</span>
                  <div>
                    {uploadResult.status === "success" ? (
                      <>
                        <p style={{ fontSize: 13.5, fontWeight: 800, color: "#15803d" }}>Upload berhasil! Dokumen sedang diproses RAG.</p>
                        <p style={{ fontSize: 12, color: "#166534", marginTop: 3 }}>📄 {uploadResult.filename}</p>
                        {uploadResult.docId && <p style={{ fontSize: 10.5, color: "#4ade80", marginTop: 2, fontFamily: "monospace" }}>ID: {uploadResult.docId}</p>}
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 13.5, fontWeight: 800, color: "#dc2626" }}>Upload gagal</p>
                        <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 3 }}>{uploadResult.error}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background: "#fffbeb", border: `1px solid ${BRAND.YELLOW}`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, marginTop: 2 }}>
                  <strong>Tips:</strong> Upload SK, Juknis, FAQ internal, atau Panduan resmi BPT Komdigi. Dokumen akan diindeks melalui Qdrant Vector DB dan dijawab oleh AI Gemini secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* ── MANAGE ── */}
          {section === "manage" && (
            <div style={{ maxWidth: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>📋</span>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: BRAND.NAVY, letterSpacing: "-.3px", position: "relative" }}>
                      Kelola Dokumen
                      <span style={{ position: "absolute", bottom: -4, left: 0, width: 32, height: 3, background: BRAND.BLUE, borderRadius: 2 }} />
                    </h2>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>Dokumen yang sudah diupload dan diindeks oleh backend RAG.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={fetchDocs} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: BRAND.NAVY, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                    {docsLoading ? <svg style={{ animation: "spin .7s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> : "🔄"} Refresh
                  </button>
                  <button onClick={() => setSection("upload")} style={{ background: G, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(30,58,138,.3)" }}>+ Upload Baru</button>
                </div>
              </div>

              {docsLoading ? (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "44px 20px", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${BRAND.BLUE}22`, borderTopColor: BRAND.BLUE, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Memuat daftar dokumen dari backend...</p>
                </div>
              ) : docs.length === 0 ? (
                <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 12, padding: "44px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 36, marginBottom: 8 }}>📂</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#94a3b8", marginBottom: 14 }}>Belum ada dokumen di backend RAG</p>
                  <button onClick={() => setSection("upload")} style={{ background: G, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Upload Sekarang</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#0369a1" }}><strong>{docs.length} dokumen</strong> terindeks di Qdrant — digunakan oleh AI RAG untuk semua pertanyaan.</p>
                  </div>

                  {docs.map((doc, i) => {
                    const extRaw = doc.filename?.split(".").pop()?.toUpperCase() || "FILE";
                    const extColors = { PDF: "#dc2626", DOCX: "#2563eb", DOC: "#2563eb", CSV: "#0891b2", XLSX: "#16a34a", TXT: "#16a34a", PNG: "#9333ea", JPG: "#9333ea", JPEG: "#9333ea" };
                    const extCol = extColors[extRaw] || "#64748b";
                    const extIcons = { PDF: "📕", DOCX: "📘", DOC: "📘", CSV: "📊", XLSX: "📊", TXT: "📄", PNG: "🖼️", JPG: "🖼️", JPEG: "🖼️" };
                    const icon = extIcons[extRaw] || "📄";

                    return (
                      <div key={doc.doc_id || i} style={{ background: "#fff", borderRadius: 11, border: "1.5px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px" }}>
                          <div style={{ width: 38, height: 38, borderRadius: 9, background: `${extCol}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.filename}</p>
                              <span style={{ background: `${extCol}15`, color: extCol, borderRadius: 4, padding: "1px 5px", fontWeight: 800, fontSize: 9.5, flexShrink: 0 }}>{extRaw}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10.5, color: "#10b981", fontWeight: 600 }}>✓ Terindeks</span>
                              {doc.uploaded_at && <span style={{ fontSize: 10.5, color: "#94a3b8" }}>🕐 {new Date(doc.uploaded_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                              {doc.uploader && <span style={{ fontSize: 10, color: "#a5b4fc" }}>👤 {doc.uploader}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
                              {doc.status || "ready"}
                            </span>
                            <button
                              onClick={() => handleDeleteDoc(doc.doc_id)}
                              disabled={deletingId === doc.doc_id}
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: 8,
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: deletingId === doc.doc_id ? "default" : "pointer",
                                color: "#ef4444",
                                transition: "all .2s"
                              }}
                              title="Hapus Dokumen"
                              onMouseEnter={e => !deletingId && (e.currentTarget.style.background = "#fee2e2")}
                              onMouseLeave={e => !deletingId && (e.currentTarget.style.background = "#fef2f2")}
                            >
                              {deletingId === doc.doc_id ? (
                                <svg style={{ animation: "spin .7s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ background: "#fffbeb", border: `1px solid ${BRAND.YELLOW}`, borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: "#92400e" }}>
                      ⚠️ <strong>Catatan:</strong> Penghapusan dokumen akan menghapus index di Qdrant dan metadata di database. Dokumen tidak akan lagi digunakan oleh AI untuk menjawab pertanyaan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALITIK ── */}
          {section === "analytics" && (
            <AnalyticsSection />
          )}

          {/* ── RIWAYAT PESAN ── */}
          {section === "history" && (
            <HistorySection />
          )}

        </div>
      </div>
    </div>
  );
}
