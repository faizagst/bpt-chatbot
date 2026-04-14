"use client";

// ═══════════════════════════════════════════════════════════════
//  RENDERER MARKDOWN-LITE
// ═══════════════════════════════════════════════════════════════
export default function Md({ text }) {
  const lines = String(text).split("\n");
  const inline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
      if (p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ background: "rgba(0,0,0,.07)", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.88em" }}>{p.slice(1, -1)}</code>;
      if (p.startsWith("[") && p.includes("](")) {
        const m = p.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 700 }}>{m[1]}</a>;
      }
      return p;
    });
  };
  const result = [];
  let inTable = false, tableRows = [], tableCols = [];
  const flushTable = () => {
    if (tableRows.length) {
      result.push(
        <div key={`t${result.length}`} style={{ overflowX: "auto", margin: "8px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
            <thead>
              <tr>{tableCols.map((c, i) => (
                <th key={i} style={{ background: "rgba(37,99,235,.1)", padding: "5px 10px", textAlign: "left", border: "1px solid rgba(37,99,235,.2)", fontWeight: 700, whiteSpace: "nowrap" }}>{inline(c.trim())}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,.03)" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "5px 10px", border: "1px solid rgba(0,0,0,.08)", verticalAlign: "top" }}>{inline(cell.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = []; tableCols = []; inTable = false;
    }
  };
  lines.forEach((line, i) => {
    const tr = line.trim();
    if (tr.startsWith("|") && tr.endsWith("|")) {
      const cells = tr.slice(1, -1).split("|");
      if (/^[\s|\-:]+$/.test(tr)) return;
      if (!inTable) { tableCols = cells; inTable = true; }
      else tableRows.push(cells);
      return;
    }
    if (inTable) flushTable();
    if (/^###\s/.test(tr)) { result.push(<div key={i} style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", margin: "10px 0 3px" }}>{inline(tr.slice(4))}</div>); return; }
    if (/^##\s/.test(tr)) { result.push(<div key={i} style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", margin: "10px 0 4px" }}>{inline(tr.slice(3))}</div>); return; }
    if (/^#\s/.test(tr)) { result.push(<div key={i} style={{ fontWeight: 900, fontSize: 15, color: "#0f172a", margin: "10px 0 4px" }}>{inline(tr.slice(2))}</div>); return; }
    if (/^---+$/.test(tr)) { result.push(<hr key={i} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,.1)", margin: "8px 0" }} />); return; }
    if (tr.startsWith(">")) { result.push(<div key={i} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 10, color: "#475569", fontStyle: "italic", margin: "4px 0", fontSize: 12.5 }}>{inline(tr.slice(1).trim())}</div>); return; }
    if (/^[-•*]\s/.test(tr) || /^\d+[.)\]]\s/.test(tr)) {
      const content = tr.replace(/^[-•*\d]+[.)\]]\s/, "");
      result.push(<div key={i} style={{ display: "flex", gap: 6, marginBottom: 2, paddingLeft: 4 }}>
        <span style={{ color: "#2563eb", flexShrink: 0, marginTop: 1, fontWeight: 700 }}>•</span>
        <span style={{ flex: 1 }}>{inline(content)}</span>
      </div>);
      return;
    }
    if (!tr) { result.push(<div key={i} style={{ height: 5 }} />); return; }
    result.push(<div key={i} style={{ marginBottom: 2, lineHeight: 1.6 }}>{inline(line)}</div>);
  });
  if (inTable) flushTable();
  return <>{result}</>;
}
