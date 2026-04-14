"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPanel from "@/components/chatbot/AdminPanel";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1. Verify session server-side
    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/admin");
          return;
        }
        const data = await res.json();
        setAdmin(data.user);
        setReady(true);
      } catch (err) {
        console.error("Session verification error:", err);
        router.replace("/admin");
      }
    }
    verifySession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      // Fallback
      router.push("/");
    }
  };

  if (!ready || !admin) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <AdminPanel
      admin={{ 
        ...admin, 
        // Add a login timestamp if AdminPanel uses it for some reason
        loginTime: Date.now() 
      }}
      onLogout={handleLogout}
    />
  );
}
