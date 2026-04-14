# 🌟 LENTERA - Layanan Edukasi & Navigasi Terpadu Era Digital
**BPT Komdigi AI Responder System**

Selamat datang di repositori utama sistem Chatbot LENTERA. Repositori ini adalah sebuah monorepo (berisi seluruh kode frontend, backend, dan konfigurasi infrastruktur docker) untuk Chatbot berbasis RAG (Retrieval-Augmented Generation) yang dibangun khusus untuk BPT Komdigi.

---

## 🏛️ Arsitektur Sistem Utama

Proyek ini dibangun berdasarkan arsitektur Microservices yang diorkestrasi menggunakan Docker Compose. Secara garis besar, sistem dibagi menjadi 2 komputasi (Frontend & Backend) dan 3 penyimpan data terisolasi.

### Teknologi Infrastruktur:
- **Environment:** Docker & Docker Compose (`docker-compose.yml`)
- **Isolation:** Internal Bridge Network (`bpt_network`)
- **Volumes:** Persistent storage untuk Database dan Caching ML Model (terlokalisasi di host).

### Struktur Repositori:
```text
📦 bpt-chatbot (Root)
 ┣ 📂 bpt-komdigi-chatbot         # [Frontend] Next.js (Chat Widget & Admin CMS)
 ┣ 📂 bpt-komdigi-chatbot-BE      # [Backend] FastAPI (RAG Pipeline, Embedding, Deep Learning)
 ┣ 📂 credentials                 # [Secrets] Berisi akses GCP Vertex AI (gcp-key.json)
 ┣ 📜 docker-compose.yml          # [Orchestration] File utama penentu jalannya system
 ┗ 📜 .env                        # [Root Env] Password root database (Mongo, Redis)
```

---

## 🚀 Panduan Eksekusi (Docker Compose)

Di level root (folder ini), segalanya dikontrol via `docker-compose.yml`. Anda **tidak perlu** menginstall Python atau Node.js secara manual di Server VPS/Host lokal Anda, cukup install Docker Desktop (Windows/Mac) atau Docker Engine (Linux).

### Langkah Menjalankan:
1. Pastikan port `3000` (Frontend) dan `8000` (Backend) tidak sedang dipakai.
2. Siapkan file `.env` di level root:
   ```env
   MONGO_ROOT_PASSWORD=Password_Super_Kuat_123
   REDIS_PASSWORD=Rahasia_Redis_Cahce_456
   ```
3. Siapkan file konfirgurasi di environment masing-masing:
   - `bpt-komdigi-chatbot/.env.production`
   - `bpt-komdigi-chatbot-BE/.env.production`
4. Jalankan perintah di terminal root:
   ```bash
   docker compose up -d --build
   ```
5. *(Untuk Pertama Kali Saja)* - Buat akun admin default:
   ```bash
   docker exec -it bpt_frontend sh -c "node scripts/seedAdmin.mjs"
   ```

### Command Manajemen Docker:
- Melihat Log Keseluruhan Sistem: `docker compose logs -f`
- Melihat Log Backend AI RAG: `docker compose logs -f backend`
- Mematikan Sistem: `docker compose down`

---

## 🛡️ Topologi & Manajemen Keamanan (Service Dependencies)

File `docker-compose.yml` telah diprogram dengan `depends_on: condition: service_healthy`. Artinya:
1. Backend **TIDAK AKAN** menyala dan menerima request API sebelum Mongo, Redis, dan Qdrant benar-benar siap dan menjawab PING hijau.
2. Frontend **TIDAK AKAN** menyala dan me-render web sebelum API Backend menyatakan dirinya siap merespon. 
3. **Database tertutup penuh**: Port 27017 (Mongo), 6333 (Qdrant), dan 6379 (Redis) tidak diekspos ke port mesin utama (Host OS). Data hanya bisa diakses dan berkomunikasi secara internal antar container API menggunakan nama docker (misal: `http://qdrant:6333`).

---

## 📚 Dokumen Pendukung
Untuk panduan spesifik yang sangat mendalam:
1. **[Dokumentasi Frontend](./bpt-komdigi-chatbot/README.md):** Konfigurasi fitur Iframe UI, API Proxy, Middleware, Auth Admin.
2. **[Dokumentasi Backend](./bpt-komdigi-chatbot-BE/README.md):** Pengelolaan LangChain, Vertex AI, OCR Gambar, Cache Redis, Clustering Data.
3. Untuk end-client dan panduan serah terima, buka fail HTML: `dokumen_serah_terima_lentera.html` dan `dokumen_teknis_lentera.html` di browser Anda.
