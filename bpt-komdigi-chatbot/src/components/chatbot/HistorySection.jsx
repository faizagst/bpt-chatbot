"use client";
import { useState, useEffect } from "react";
import { BRAND } from "./constants";

// ── Helper ────────────────────────────────────────────────────────────────────
const fmtDate = (ts) =>
  ts
    ? new Date(ts).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const shortSession = (id) =>
  id ? `…${String(id).slice(-6)}` : "—";

// Ikon berdasarkan ketersediaan sources (dokumen)
const getSourceIcon = (sources) =>
  Array.isArray(sources) && sources.length > 0 ? "📄" : "🤖";

const getSourceLabel = (sources) => {
  if (!Array.isArray(sources) || sources.length === 0) return "AI (Tanpa Dokumen)";
  return sources[0].replace(/^\d{14}_/, ""); // hapus timestamp prefix jika ada
};

const getSourceBadgeStyle = (sources) =>
  Array.isArray(sources) && sources.length > 0
    ? { color: "#16a34a", bg: "#dcfce7" }
    : { color: "#6366f1", bg: "#eef2ff" };

// ── Komponen ──────────────────────────────────────────────────────────────────
export default function HistorySection() {
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("all"); // "all" | "doc" | "ai"
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch ──
  const fetchHistory = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/chat-history?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChatLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch history error:", e);
      setError("Gagal memuat riwayat. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ── Filter ──
  const filtered = chatLogs.filter((l) => {
    if (histFilter === "doc")
      return Array.isArray(l.sources) && l.sources.length > 0;
    if (histFilter === "ai")
      return !Array.isArray(l.sources) || l.sources.length === 0;
    return true;
  });

  // ── Live search (debounce ringan) ──
  const handleSearchChange = (val) => {
    setHistSearch(val);
  };

  const handleSearchSubmit = () => {
    fetchHistory(histSearch.trim());
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const rows = [
      ["Timestamp", "Session ID", "Pertanyaan", "Jawaban", "Sumber Dokumen"],
      ...chatLogs.map((l) => [
        l.timestamp || "",
        l.session_id || "",
        `"${(l.query || "").replace(/"/g, '""')}"`,
        `"${(l.answer || "").replace(/"/g, '""')}"`,
        `"${(l.sources || []).join("; ")}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bpt_chat_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Clear history ──
  const handleClear = async () => {
    if (
      !confirm(
        "Hapus semua riwayat chat? Tindakan ini tidak dapat dibatalkan."
      )
    )
      return;
    setClearing(true);
    try {
      const res = await fetch("/api/admin/chat-history", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChatLogs([]);
    } catch (e) {
      alert("Gagal menghapus riwayat: " + e.message);
    } finally {
      setClearing(false);
    }
  };

  // ── UI ──
  if (loading)
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        <div
          style={{
            width: 24,
            height: 24,
            border: `3px solid ${BRAND.BLUE}22`,
            borderTopColor: BRAND.BLUE,
            borderRadius: "50%",
            animation: "spin .8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: 13, fontWeight: 500 }}>Memuat riwayat pesan...</p>
      </div>
    );

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
            💬 Riwayat Pesan
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b" }}>
            {chatLogs.length > 0
              ? `Menampilkan ${filtered.length} dari ${chatLogs.length} pesan terakhir dari backend.`
              : "Belum ada data riwayat pesan."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => fetchHistory(histSearch.trim())}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              color: BRAND.NAVY,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔄 Refresh
          </button>
          {chatLogs.length > 0 && (
            <>
              <button
                onClick={exportCSV}
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#16a34a",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ⬇ Export CSV
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ef4444",
                  cursor: clearing ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: clearing ? 0.6 : 1,
                }}
              >
                {clearing ? "⏳ Menghapus..." : "🗑 Clear Semua"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 14,
            fontSize: 12.5,
            color: "#dc2626",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Search & Filter ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", gap: 6 }}>
          <input
            value={histSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder="🔍 Cari pertanyaan... (Enter untuk cari)"
            style={{
              flex: 1,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12.5,
              fontFamily: "inherit",
              outline: "none",
              color: "#1e293b",
            }}
          />
          <button
            onClick={handleSearchSubmit}
            style={{
              background: BRAND.BLUE,
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cari
          </button>
        </div>

        {/* Filter tabs */}
        {[
          { id: "all", label: "Semua" },
          { id: "doc", label: "📄 Ada Dokumen" },
          { id: "ai", label: "🤖 Tanpa Dokumen" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setHistFilter(f.id)}
            style={{
              background: histFilter === f.id ? BRAND.NAVY : "#f8fafc",
              color: histFilter === f.id ? "#fff" : "#64748b",
              border: `1px solid ${histFilter === f.id ? "transparent" : "#e2e8f0"}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Log list ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            {chatLogs.length === 0
              ? "Belum ada riwayat pesan tersimpan di backend."
              : "Tidak ada pesan sesuai filter."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: "calc(100vh - 310px)",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {filtered.map((l, i) => {
            const badgeStyle = getSourceBadgeStyle(l.sources);
            return (
              <div
                key={l._id || `log-${i}`}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  transition: "border-color .2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = BRAND.BLUE + "55")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e2e8f0")
                }
              >
                {/* Icon */}
                <div
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: badgeStyle.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {getSourceIcon(l.sources)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Pertanyaan */}
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "#1e293b",
                      fontWeight: 700,
                      lineHeight: 1.5,
                      marginBottom: 4,
                    }}
                  >
                    {l.query || "(Pertanyaan tidak tersedia)"}
                  </p>

                  {/* Jawaban */}
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#64748b",
                      marginBottom: 8,
                      background: "#f8fafc",
                      padding: "8px 10px",
                      borderRadius: 8,
                      borderLeft: `3px solid ${BRAND.BLUE}88`,
                      lineHeight: 1.55,
                    }}
                  >
                    {l.answer
                      ? l.answer.slice(0, 200) + (l.answer.length > 200 ? "…" : "")
                      : "(Tanpa jawaban)"}
                  </p>

                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {/* Badge sumber */}
                    <span
                      style={{
                        fontSize: 10,
                        color: badgeStyle.color,
                        background: badgeStyle.bg,
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontWeight: 700,
                      }}
                    >
                      {getSourceLabel(l.sources)}
                    </span>

                    {/* Sources tambahan */}
                    {Array.isArray(l.sources) && l.sources.length > 1 && (
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        +{l.sources.length - 1} dok
                      </span>
                    )}

                    {/* Session ID */}
                    <span
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        background: "#f1f5f9",
                        borderRadius: 4,
                        padding: "1px 5px",
                      }}
                    >
                      sesi {shortSession(l.session_id)}
                    </span>

                    {/* Timestamp */}
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "#94a3b8",
                        marginLeft: "auto",
                      }}
                    >
                      🕐 {fmtDate(l.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
