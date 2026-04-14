"use client";
import { useState, useEffect } from "react";
import { BRAND } from "./constants";

// ── Helper ────────────────────────────────────────────────────────────────────
const fmtDate = (ts) =>
  ts
    ? new Date(ts).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#f97316"];

// ── Komponen ──────────────────────────────────────────────────────────────────
export default function AnalyticsSection() {
  const [topQ, setTopQ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    uniqueSessions: 0,
    withSources: 0,
    withoutSources: 0,
  });
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // ── Top Questions (semantic clusters dari backend) ──
      const params = new URLSearchParams({ limit: "20" });
      if (forceRefresh) params.set("force_refresh", "true");

      const resTop = await fetch(`/api/admin/top-questions?${params}`);
      if (!resTop.ok) throw new Error(`HTTP ${resTop.status}`);
      const dataTop = await resTop.json();
      setTopQ(Array.isArray(dataTop) ? dataTop : []);

      // ── Raw logs untuk statistik umum ──
      const resLogs = await fetch("/api/admin/chat-history?limit=500");
      if (!resLogs.ok) throw new Error(`HTTP ${resLogs.status}`);
      const dataLogs = await resLogs.json();
      const logs = Array.isArray(dataLogs) ? dataLogs : [];

      const uniqueSessions = new Set(logs.map((l) => l.session_id).filter(Boolean)).size;
      const withSources = logs.filter(
        (l) => Array.isArray(l.sources) && l.sources.length > 0
      ).length;

      setStats({
        total: logs.length,
        uniqueSessions,
        withSources,
        withoutSources: logs.length - withSources,
      });
    } catch (e) {
      console.error("Fetch stats error:", e);
      setError(
        "Gagal memuat data analitik. Pastikan backend berjalan dan Redis aktif."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        <p style={{ fontSize: 13, fontWeight: 500 }}>Memuat data analitik...</p>
        <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>
          Proses clustering semantik mungkin membutuhkan beberapa detik
        </p>
      </div>
    );

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
            📊 Analitik Pertanyaan
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b" }}>
            Insight dari {stats.total} pertanyaan — dikelompokkan secara semantik oleh AI.
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          style={{
            background: refreshing ? "#f1f5f9" : "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: BRAND.NAVY,
            cursor: refreshing ? "default" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  border: `2px solid ${BRAND.BLUE}44`,
                  borderTopColor: BRAND.BLUE,
                  borderRadius: "50%",
                  animation: "spin .7s linear infinite",
                }}
              />
              Re-clustering...
            </>
          ) : (
            "🔄 Refresh + Re-cluster"
          )}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
            fontSize: 12.5,
            color: "#dc2626",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Total Pertanyaan",
            value: stats.total,
            icon: "❓",
            color: "#6366f1",
            bg: "#eef2ff",
          },
          {
            label: "Sesi Unik",
            value: stats.uniqueSessions,
            icon: "👤",
            color: "#0891b2",
            bg: "#e0f2fe",
          },
          {
            label: "Dijawab Dokumen",
            value: stats.withSources,
            icon: "📄",
            color: "#16a34a",
            bg: "#dcfce7",
          },
          {
            label: "Jawaban AI Saja",
            value: stats.withoutSources,
            icon: "🤖",
            color: "#d97706",
            bg: "#fef9c3",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              borderRadius: 12,
              padding: "14px 16px",
              border: `1px solid ${s.color}20`,
            }}
          >
            <p style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: s.color,
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: 10.5,
                color: "#64748b",
                marginTop: 3,
                fontWeight: 600,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Top Questions Semantic Clusters ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <p style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
            🏆 Top Pertanyaan
          </p>
          <span
            style={{
              background: "#ede9fe",
              color: "#7c3aed",
              fontSize: 10,
              fontWeight: 800,
              borderRadius: 4,
              padding: "2px 7px",
              letterSpacing: ".3px",
            }}
          >
            SEMANTIC AI
          </span>
          {topQ.length > 0 && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              {topQ.length} grup
            </span>
          )}
        </div>

        {topQ.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              color: "#94a3b8",
            }}
          >
            <p style={{ fontSize: 24, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 12.5, fontWeight: 600 }}>
              Belum ada data pertanyaan.
            </p>
            <p style={{ fontSize: 11.5, marginTop: 4 }}>
              Data akan muncul setelah chatbot digunakan.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topQ.map((q, i) => {
              const isExpanded = expandedIdx === i;
              const hasSamples =
                Array.isArray(q.sample_questions) &&
                q.sample_questions.length > 0;

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #f1f5f9",
                    overflow: "hidden",
                    background: i < 3 ? "#fafafa" : "#fff",
                    transition: "border-color .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#f1f5f9")
                  }
                >
                  {/* ── Baris utama ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 13px",
                      cursor: hasSamples ? "pointer" : "default",
                    }}
                    onClick={() =>
                      hasSamples &&
                      setExpandedIdx(isExpanded ? null : i)
                    }
                  >
                    {/* Rank badge */}
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background:
                          i < 3 ? MEDAL_COLORS[i] : "#e2e8f0",
                        color: i < 3 ? "#fff" : "#64748b",
                        fontWeight: 800,
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>

                    {/* Pertanyaan */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12.5,
                          color: "#1e293b",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: 2,
                        }}
                      >
                        {q.canonical_question}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>
                          🕐 {fmtDate(q.last_asked)}
                        </span>
                        {q.cluster_size > 1 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#7c3aed",
                              background: "#ede9fe",
                              borderRadius: 4,
                              padding: "1px 5px",
                              fontWeight: 700,
                            }}
                          >
                            {q.cluster_size} varian
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Count badge */}
                    <span
                      style={{
                        background: `${BRAND.BLUE}15`,
                        color: BRAND.BLUE,
                        borderRadius: 8,
                        padding: "3px 10px",
                        fontSize: 13,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {q.count}×
                    </span>

                    {/* Chevron expand */}
                    {hasSamples && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          flexShrink: 0,
                          transform: isExpanded ? "rotate(180deg)" : "none",
                          transition: "transform .2s",
                          display: "inline-block",
                        }}
                      >
                        ▾
                      </span>
                    )}
                  </div>

                  {/* ── Expanded: sample questions ── */}
                  {isExpanded && hasSamples && (
                    <div
                      style={{
                        borderTop: "1px dashed #e2e8f0",
                        background: "#f8fafc",
                        padding: "10px 14px 12px 50px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                          marginBottom: 6,
                        }}
                      >
                        Variasi pertanyaan serupa:
                      </p>
                      {q.sample_questions.map((sq, si) => (
                        <div
                          key={si}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 7,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ color: "#cbd5e1", fontSize: 10, marginTop: 3 }}>
                            ›
                          </span>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#475569",
                              lineHeight: 1.5,
                            }}
                          >
                            {sq}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Info box semantik ── */}
      <div
        style={{
          background: "#f5f3ff",
          border: "1px solid #ddd6fe",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <p style={{ fontSize: 12, color: "#6d28d9", lineHeight: 1.7 }}>
          💡{" "}
          <strong>Cara Kerja Semantic Clustering:</strong> Backend menggunakan
          model <code>paraphrase-multilingual-MiniLM-L12-v2</code>{" "}
          (HuggingFace — <strong>gratis & lokal</strong>, mendukung Bahasa Indonesia)
          untuk mengubah setiap pertanyaan menjadi vektor. Pertanyaan dengan cosine
          similarity ≥ 0.82 dikelompokkan otomatis menjadi satu baris — misalnya{" "}
          <em>"apa itu BPT?"</em>, <em>"BPT itu apa?"</em>, dan{" "}
          <em>"jelaskan BPT komdigi"</em> akan muncul sebagai satu grup. Klik
          baris untuk melihat variasi pertanyaan serupa. Klik{" "}
          <strong>Refresh + Re-cluster</strong> untuk memperbarui pengelompokan.
        </p>
      </div>
    </div>
  );
}
