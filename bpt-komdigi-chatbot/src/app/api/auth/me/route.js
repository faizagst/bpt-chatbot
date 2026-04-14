import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-only'
);

export async function GET(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      user: {
        username: payload.username,
        role: payload.role,
        avatar: payload.avatar,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json({ message: 'Token tidak valid atau kedaluwarsa.' }, { status: 401 });
  }
}
