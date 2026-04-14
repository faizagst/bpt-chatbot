import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

/**
 * GET /api/admin/chat-history
 * Proxy ke backend Python: GET /api/chatlogs
 * Support query params: limit, search
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const search = searchParams.get('search') || '';

    const params = new URLSearchParams({ limit });
    if (search) params.set('search', search);

    const res = await fetch(`${BACKEND_URL}/api/chatlogs?${params}`, {
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
    // data.logs adalah array chat dari backend
    return NextResponse.json(data.logs || [], { status: 200 });

  } catch (error) {
    console.error('[chat-history] GET error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chat-history
 * Proxy ke backend Python: DELETE /api/chatlogs (hapus semua riwayat)
 */
export async function DELETE() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chatlogs`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: err.detail || 'Backend error' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[chat-history] DELETE error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
