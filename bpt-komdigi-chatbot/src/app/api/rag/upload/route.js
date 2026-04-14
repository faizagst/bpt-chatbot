import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

export async function POST(req) {
  try {
    // Forward the raw multipart/form-data directly to the backend
    const formData = await req.formData();

    const res = await fetch(`${BACKEND_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type header — fetch will set it with the boundary automatically
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ message: `Backend error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/rag/upload] Error:", error);
    return NextResponse.json(
      { message: "Gagal upload ke backend RAG.", error: error.message },
      { status: 500 }
    );
  }
}
