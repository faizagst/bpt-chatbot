import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

import connectToDatabase from '@/lib/mongodb';
import Admin from '@/models/Admin';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-only'
);

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Isi username dan password.' }, { status: 400 });
    }

    await connectToDatabase();

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return NextResponse.json({ message: 'Username atau password salah.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Username atau password salah.' }, { status: 401 });
    }

    // 1. Create JWT
    const token = await new SignJWT({
      username: admin.username,
      role: admin.role,
      avatar: admin.avatar,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // 2. Create Response & Set Cookie
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        username: admin.username,
        role: admin.role,
        avatar: admin.avatar,
      }
    }, { status: 200 });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
