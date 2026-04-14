"use client";
import ChatWidget from "@/components/chatbot/ChatWidget";

export default function WidgetPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <style>{`
        body, html {
          background: transparent !important;
          color-scheme: light; /* Memaksa ke light mode supaya tidak terpengaruh dark mode browser */
        }
      `}</style>
      <ChatWidget isEmbedded={true} />
    </div>
  );
}
