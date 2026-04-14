"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/chatbot/LoginPage";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check for valid session via server-side verification
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          router.replace("/admin/dashboard");
        }
      } catch (err) {
        console.error("Check session error:", err);
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = (adminData) => {
    // Cookies are set by the server on login, so we just redirect
    router.push("/admin/dashboard");
  };

  return <LoginPage onLogin={handleLogin} onBack={() => router.push("/")} />;
}
