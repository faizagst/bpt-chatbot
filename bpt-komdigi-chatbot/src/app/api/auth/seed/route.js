import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import Admin from '@/models/Admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    // Pastikan seeding hanya bisa dilakukan JIKA database masih KOSONG melompong.
    // Ini menjaga keamanan agar orang iseng tidak bisa reset password lewat endpoint ini.
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return NextResponse.json({ 
        message: 'Database sudah berisi akun admin. Proses seeding diabaikan demi keamanan.' 
      }, { status: 403 });
    }

    const admins = [
      { username: "admin", password: "Admin@123", role: "Super Admin", avatar: "👨‍💻" },
      { username: "operator1", password: "Operator@2025", role: "Operator Konten", avatar: "🛠️" }
    ];

    const results = [];

    for (let admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await Admin.create({
        username: admin.username,
        password: hashedPassword,
        role: admin.role,
        avatar: admin.avatar
      });
      results.push(`Created admin: ${admin.username}`);
    }

    return NextResponse.json({
      message: 'Seeding berhasil! Akun default telah dibuat.',
      details: results
    }, { status: 201 });

  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat seeding', error: error.message }, { status: 500 });
  }
}
