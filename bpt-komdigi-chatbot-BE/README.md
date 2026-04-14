# 🧠 Backend LENTERA: FastAPI Processing Engine & AI RAG

Repositori ini menyimpan inti "otak" pemrosesan sistem LENTERA. Semuanya berbasis Python, berarsitektur REST API menggunakan FastAPI, dan mengimplementasikan seluruh proses Retrieval-Augmented Generation (RAG) untuk melayani tanya jawab otomatis secara akurat berdasarkan dokumen.

## 🛠️ Stack Teknologi Backend
1. **Framework API:** `FastAPI` + `uvicorn` (kecepatan respon tinggi dan dokumentasi Swagger auto-generate).
2. **AI / RAG Framework:** `LangChain` (Orkestrasi LLM dan Prompt Engineering).
3. **Database Vector (Knowledge Base):** `Qdrant` (mencari kesamaan kemiripan kalimat (Similarity Search)).
4. **Caching & Rate Limit:** `Redis` (Mencatat kuota user dan cache pertanyaan *exact match*).
5. **AI Inference (Cloud):** Google Vertex AI (`gemini-2.5-flash` untuk text generator, `text-embedding-005` untuk konversi kalimat menjadi deretan angka vector).
6. **Local ML Models:** 
   - `SentenceTransformers`: Mengelompokkan / mengkluster pertanyaan log secara *Semantic* menjadi *Top Questions*.
   - `EasyOCR`: Deep Learning untuk membaca text didalam File Gambar (.PNG/.JPG) atau memproses dokumen yg di scan. (Jauh lebih presisi dari `Tesseract OCR` untuk Bahasa Indonesia).
7. **Document Parser:** Apache Tika (`tika-python`), PyMuPDF, Pandas (untuk Excel), python-docx.

## 📂 Pemetaan Struktur Kode (`/app`)
- `main.py` - Titik masuk (Entry point). Memuat Endpoint API (`/api/chat`, `/api/documents`, `/api/admin/...`), mengatur CORS Middleware, Setup Rate Limit.
- `db.py` - Manajer Koneksi (Dependencies Injection) untuk terhubung ke Qdrant Server, MongoDB, dan Redis Server.
- `rag_impl/` - Jantung utama sistem Natural Language Processing (NLP):
  - `service.py`: Dirigen utama. Proses *embed* query user, pencarian konteks di qdrant, pemanggilan API Vertex Chat, dan penanganan Cache (Semantic dan Exact).
  - `loaders.py`: Berisi fungsionalitas memecah dan membaca isian berbagai format *binary file* (Word, Excell, PDF, TXT, Image PNG/JPG). Disinilah letak eksekusi engine **EasyOCR** bernaung.
  - `cache.py`: Algoritma sistem yang memeriksa apakah pertanyaan yang masuk itu mirip dengan pertanyaan 5 menit sebelumnya yang ada direcord redis? Jika ya, tak perlu bayar vertex AI, langsung kembalikan cache dari Memori Redis/Qdrant. Disini juga tempat *Rate Limiter* kuota `X question per X jam`.
  - `analytics.py`: Fungsi klasterisasi DB Mongo (Chat Log) khusus untuk halaman Analitik Top 10 Pertanyaan Admin menggunakan model ML lokal `all-MiniLM-L6-v2`.

## ⚙️ Persyaratan Server & Local Development (Non-Docker)
Jika Anda hanya ingin merubah/mengutak-atik kode Python langsung di laptop/Server tanpa masuk ke container:

**Sistem:** Membutuhkan **Python 3.10+**.
Karena ada `EasyOCR` dan PyTorch, mesin (Windows/Linux) wajib sudah memiliki dependensi sistem `libgl1` agar OpenCV (komponen ocr) dapat membaca buffer gambar.

```bash
# Set up Virtual Environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Menjalankan spesifik file secara individu/dev
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔐 Variabel Lingkungan & Environment (.env.production)

Bagian krusial pada konfigurasi Backend:
- `GOOGLE_CLOUD_PROJECT` & `GOOGLE_CLOUD_REGION`: Identitas untuk penagihan/koneksi vertex AI GCP. Wajib berjalan sekalian dengan file `credentials/gcp-key.json` yang terexport di variable (sudah diatur oleh `docker-compose.yml`).
- `QDRANT_URL`, `MONGODB_URI`, `REDIS_URL`: Di production docker, pastikan valuenya adalah NAMA SERVICE container-nya, BUKAN localhost! (misal: `http://qdrant:6333`).
- `ALLOWED_ORIGINS`: String/url frontend dipisahkan koma. Wajib dicocokkan! Kalau tidak, endpoint hanya dibanned browser `(Cross-Origin Request Blocked)`.

## 📦 Penjelasan Docker Image
Pada file `Dockerfile` kita menggunakan mekanisme *healthcheck* khusus. Gambar docker ini lumayan berat secara size (1-2GB) karena PyTorch dan EasyOCR dependencies yang harus ditanam didalam image supaya OS linux tidak error saat membaca gambar. Kita juga menggunakan mount volumes pada `.cache` agar model AI yang tersimpan tidak memakan kuota ulang internet setiap API di restart.
