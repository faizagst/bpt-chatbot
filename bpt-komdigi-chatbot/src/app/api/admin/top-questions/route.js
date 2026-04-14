import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

/**
 * GET /api/admin/top-questions
 * Proxy ke backend Python: GET /api/top-questions
 * Semantic clustering — pertanyaan bermaksud sama dikelompokkan.
 * Support query params: limit, force_refresh
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const forceRefresh = searchParams.get('force_refresh') || 'false';

    const params = new URLSearchParams({ limit, force_refresh: forceRefresh });

    const res = await fetch(`${BACKEND_URL}/api/top-questions?${params}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: err.detail || 'Backend error', error: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    // data.top_questions adalah array clusters dari backend
    return NextResponse.json(data.top_questions || [], { status: 200 });

  } catch (error) {
    console.error('[top-questions] GET error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
