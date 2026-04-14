import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, session_id } = body;

    if (!query) {
      return NextResponse.json({ message: "Missing query" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: session_id || "default_session" }),
    });

    if (!res.ok) {
      try {
        const errData = await res.json();
        return NextResponse.json(errData, { status: res.status });
      } catch (e) {
        const errText = await res.text();
        return NextResponse.json({ message: errText }, { status: res.status });
      }
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/rag/chat] Error:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi backend RAG.", error: error.message },
      { status: 500 }
    );
  }
}
