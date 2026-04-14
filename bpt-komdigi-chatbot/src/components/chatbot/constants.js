// ═══════════════════════════════════════════════════════════════
//  KONFIGURASI BRAND & WARNA
// ═══════════════════════════════════════════════════════════════
export const SESSION_MS = 24 * 60 * 60 * 1000;
export const BRAND = {
  NAVY: "#22377A",  // Navy Blue BPT
  BLUE: "#1E9CD7",  // Sky Blue BPT
  YELLOW: "#f5b800",  // Golden Yellow BPT
  RED: "#922b21",  // Deep Red BPT
};
export const G = `linear-gradient(135deg, ${BRAND.NAVY} 0%, ${BRAND.BLUE} 100%)`;
export const WA_LINK = "https://wa.me/628111166784?text=Halo%20Asisten%20BPT%20Komdigi%2C%20saya%20membutuhkan%20bantuan%20lebih%20lanjut%20mengenai...";
export const TICKET_LINK = "https://myaspirasi-bpptik.vercel.app/";

// ═══════════════════════════════════════════════════════════════
//  SOURCE BADGE — menunjukkan asal jawaban ke pengguna
// ═══════════════════════════════════════════════════════════════
export const SOURCE_BADGE = {
  fallback: { label: "💬 Bantuan", color: "#d97706", bg: "#fef9c3" },
};

// ═══════════════════════════════════════════════════════════════
//  QUICK REPLIES
// ═══════════════════════════════════════════════════════════════
export const QUICK_REPLIES = [
  { label: "Program pelatihan apa saja?", q: "program pelatihan apa saja" },
  { label: "Cara mendaftar pelatihan", q: "bagaimana cara mendaftar pelatihan" },
  { label: "Syarat pendaftaran", q: "apa saja syarat pendaftaran" },
  { label: "Kontak BPT Komdigi", q: "kontak dan alamat bpt komdigi" },
];

// ═══════════════════════════════════════════════════════════════
//  FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════
export const fmtTime = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
