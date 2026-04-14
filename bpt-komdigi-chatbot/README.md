# 🖥️ Frontend LENTERA: Next.js App Router & Server Proxy

Modul ini berisi antarmuka pengguna publik (Chat Widget) dan halaman administrator (CMS) berbasis Next.js 14. Frontend ini tidak menyimpan logika kecerdasan buatan (AI) di dalamnya; tanggung jawabnya hanya sekedar merender UI, proksi request ke Backend, mengatur cookie otentikasi (JWT) untuk Admin, dan membaca log Database secara langsung.

## 🛠️ Stack Teknologi Frontend
1. **Framework:** Next.js 14 (App Router)
2. **Styling:** Vanilla CSS, Tailwind CSS (Utilitas styling), dan Tailwind-Merge.
3. **Animasi & Icon:** Framer Motion (Transisi mulus), Lucide React.
4. **Auth & Eksekusi:** `bcrypt`, `jose` (JWT parsing di Edge Middleware).
5. **Database (Langsung):** Mongoose (Hanya digunakan untuk baca/tulis tabel Admin Auth).

## 🚀 Instalasi & Development Lokal (Non-Docker)
Jika Anda hanya ingin merubah UI menggunakan Node.js di laptop (tanpa menjalankan Docker utuh):
```bash
# Masuk ke direktori
cd bpt-komdigi-chatbot

# Instal dependensi
npm install

# Buat file env (sesuaikan dengan lokal Anda)
cp .env.production .env.local

# Jalankan server development
npm run dev
```

## 📂 Peta Direktori Utama
- `src/app/` (Next.js App Router):
  - `(user)/page.js` - Halaman index utama (tempat render Chat Widget public embed).
  - `admin/` - Halaman khusus Admin dengan layout tersendiri.
  - `api/` - Next.js Route Handlers. Terdapat proxy untuk menyembunyikan API Backend dari browser (agar terhindar dari error CORS) dan mengatur autentikasi berbasis HttpOnly Cookies.
- `src/components/` - Pecahan React Components:
  - `chatbot/` - Monolitik komponen chat UI (Bubble, Header, Markdown render, logic Chat). Disini UI Chatbot dikonfigurasi.
  - `AdminPanel.jsx` - Komponen khusus UI Dashboard Admin LENTERA.
- `src/middleware.js` - Pelindung URL. Memproteksi path `/admin/*` agar wajib memiliki JWT Token di HTTP Cookie. Jika hilang, paksa redirect ke halaman `/admin/login`.
- `scripts/seedAdmin.mjs` - Script *one-off* penting untuk mendaftarkan kredensial admin default di MongoDB sebelum aplikasi bisa mulai dipakai secara administratif.

## 🔐 Variabel Lingkungan (.env.production / .env.local)

| Variable | Fungsi | Penempatan |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_API_URL` | URL Publik Backend (digunakan client browser jika me-manggil BE langsung, atau sebagai origin). | Boleh terbuka ke browser |
| `BACKEND_API_URL` | URL internal Docker (digunakan Next.js Server Side untuk Proxy ke API backend). Contoh: `http://backend:8000` | Rahasia Server |
| `MONGODB_URI` | Koneksi MongoDB. **Penting:** Frontend membaca data User Admin langsung dari database ini, tidak via API backend. | Rahasia Server |
| `JWT_SECRET` | Kunci enkripsi token login Admin (Minimal 32 karakter). | Rahasia Server |

## 🧩 Implementasi Fitur Widget Embed (Iframe)
Chatbot dirancang agar aplikasinya bisa "ditanamkan" pada website lain (Milik Komdigi/Pusdiklat).
1. Background `body` sengaja dibuat transparan di CSS.
2. Pengguna eksternal meng-copy kode iframe HTML yang lebarnya mengikuti layar (100% tinggi dan lebar, namun komponen Button/Window melayang di pojok kanan bawah dengan `position: fixed`).
3. Ini memungkinkan LENTERA digunakan tak sekedar di domain utama layanannya sendiri.

## 🔧 Optimasi Build Production (Docker Standalone)
Pada file `next.config.mjs`, disematkan baris `output: "standalone"`. Ini berguna agar pada saat Docker melakukan proses `npm run build`, Next.js menyaring library `node_modules` sehingga hanya library yang benar-benar dipakai yang akan disalin ke target Final Image, menekan ratusan megabytes jadi puluhan megabytes saja.
