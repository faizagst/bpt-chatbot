import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json({ message: "Missing session_id" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_URL}/api/quota?session_id=${session_id}`, {
      cache: "no-store",
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
    console.error("[/api/rag/quota] Error:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi backend.", error: error.message },
      { status: 500 }
    );
  }
}
