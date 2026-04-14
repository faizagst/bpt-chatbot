# 🚀 Panduan Deploy BPT Komdigi Chatbot ke VPS

## Arsitektur Sistem

```mermaid
graph TD
    A[Internet / Browser] --> B[Nginx Reverse Proxy]
    B --> C[Next.js Frontend :3000]
    B --> D[FastAPI Backend :8000]
    C --> D
    D --> E[MongoDB :27017]
    D --> F[Qdrant :6333]
    D --> G[Redis :6379]
    D --> H[Google Vertex AI / Cloud]
```

Semua service dijalankan via **Docker Compose** di satu VPS. Nginx sebagai reverse proxy publik.

---

## 📦 Stack Docker yang Dibutuhkan

| Service | Image | Port |
|---|---|---|
| MongoDB | `mongo:7` | 27017 |
| Qdrant | `qdrant/qdrant` | 6333 |
| Redis | `redis:7-alpine` | 6379 |
| FastAPI Backend | (build dari source) | 8000 |
| Next.js Frontend | (build dari source) | 3000 |

> [!TIP]
> Pakai Docker Compose untuk semua service. Lebih mudah mange, restart otomatis, dan networking antar container sudah diatur otomatis.

---

## 🗑️ File yang Tidak Terpakai (Bisa Dihapus)

### Frontend (`bpt-komdigi-chatbot/`)

| File/Folder | Status | Keterangan |
|---|---|---|
| `tmp/test_iframe.html` | ✅ Hapus | File test sementara, tidak perlu di VPS |
| `public/file.svg` | ✅ Hapus | Asset default Next.js, tidak dipakai |
| `public/globe.svg` | ✅ Hapus | Asset default Next.js, tidak dipakai |
| `public/next.svg` | ✅ Hapus | Asset default Next.js, tidak dipakai |
| `public/vercel.svg` | ✅ Hapus | Asset default Next.js, tidak dipakai |
| `public/window.svg` | ✅ Hapus | Asset default Next.js, tidak dipakai |
| `README.md` | ⚠️ Opsional | Hapus / update sesuai kebutuhan |

> **Yang dipakai di public/**: `logo-bpt.png`, `logo-komdigi-full.png`, `logo-lentera.png`

### Backend (`bpt-komdigi-chatbot-BE/`)

| File/Folder | Status | Keterangan |
|---|---|---|
| `exp.md` | ✅ Hapus | File catatan eksperimen, tidak perlu di production |
| `rag.md` | ✅ Hapus | File catatan dokumentasi internal |
| `app/__pycache__/` | ✅ Hapus | Auto-generated Python cache, jangan di-commit |
| `app/rag_impl/__pycache__/` | ✅ Hapus | Sama seperti atas |

---

## 📁 Struktur File yang Perlu Dibuat

### 1. `docker-compose.yml` (di root `/bpt-chatbot/`)

```yaml
version: "3.9"

services:
  mongodb:
    image: mongo:7
    container_name: bpt_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: bpt_admin
      MONGO_INITDB_ROOT_PASSWORD: GANTI_PASSWORD_KUAT
      MONGO_INITDB_DATABASE: bpt_db
    volumes:
      - mongo_data:/data/db
    networks:
      - bpt_network

  qdrant:
    image: qdrant/qdrant:latest
    container_name: bpt_qdrant
    restart: unless-stopped
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - bpt_network

  redis:
    image: redis:7-alpine
    container_name: bpt_redis
    restart: unless-stopped
    command: redis-server --requirepass GANTI_PASSWORD_REDIS
    volumes:
      - redis_data:/data
    networks:
      - bpt_network

  backend:
    build:
      context: ./bpt-komdigi-chatbot-BE
      dockerfile: Dockerfile
    container_name: bpt_backend
    restart: unless-stopped
    env_file:
      - ./bpt-komdigi-chatbot-BE/.env.production
    depends_on:
      - mongodb
      - qdrant
      - redis
    volumes:
      - ./credentials:/app/credentials:ro  # GCP service account key
    networks:
      - bpt_network

  frontend:
    build:
      context: ./bpt-komdigi-chatbot
      dockerfile: Dockerfile
    container_name: bpt_frontend
    restart: unless-stopped
    env_file:
      - ./bpt-komdigi-chatbot/.env.production
    depends_on:
      - backend
    networks:
      - bpt_network

volumes:
  mongo_data:
  qdrant_data:
  redis_data:

networks:
  bpt_network:
    driver: bridge
```

---

### 2. `bpt-komdigi-chatbot-BE/Dockerfile`

```dockerfile
FROM python:3.11-slim

# System dependencies untuk easyocr / tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ind \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 3. `bpt-komdigi-chatbot/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

> [!IMPORTANT]
> Untuk Next.js standalone output, tambahkan `output: 'standalone'` di `next.config.mjs`.

---

### 4. `.env.production` untuk Backend

Simpan di `bpt-komdigi-chatbot-BE/.env.production` (jangan di-commit ke git):

```env
# Google Vertex AI
GOOGLE_CLOUD_PROJECT=kada-491403
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json
LLM_MODEL=gemini-2.5-flash
LLM_TEMPERATURE=0.2
EMBEDDING_MODEL=text-embedding-005

# MongoDB (pakai Docker internal network, bukan Atlas!)
MONGODB_URI=mongodb://bpt_admin:GANTI_PASSWORD_KUAT@mongodb:27017/bpt_db?authSource=admin
MONGODB_DB_NAME=bpt_db

# Qdrant (nama container sebagai host)
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=bpt_docs

# Redis (nama container sebagai host)
REDIS_URL=redis://:GANTI_PASSWORD_REDIS@redis:6379/0
RAG_CACHE_TTL_SECONDS=3600
RAG_CACHE_ENABLED=1
RAG_CACHE_PREFIX=rag:cache:v1
RAG_DATA_VERSION_KEY=rag:data_version

# Semantic Cache
SEMANTIC_CACHE_ENABLED=1
SEMANTIC_CACHE_COLLECTION=rag_query_cache
SEMANTIC_CACHE_LIMIT=5
SEMANTIC_CACHE_MIN_SCORE=0.92
SEMANTIC_CACHE_MIN_TOKEN_COVERAGE=0.65

# Support
SUPPORT_WHATSAPP=+628111166784
SUPPORT_TICKETING_URL=https://example.com/ticketing
SUPPORT_EMAIL=bpt@komdigi.go.id

# Server
HOST=0.0.0.0
PORT=8000
```

---

### 5. `.env.production` untuk Frontend

Simpan di `bpt-komdigi-chatbot/.env.production`:

```env
# Backend dipanggil dari container ke container (internal network)
BACKEND_API_URL=http://backend:8000

# URL publik untuk client-side (ganti dengan domain VPS kamu)
NEXT_PUBLIC_BACKEND_API_URL=https://api.domain-kamu.com

# MongoDB (pakai Docker internal network)
MONGODB_URI=mongodb://bpt_admin:GANTI_PASSWORD_KUAT@mongodb:27017/bpt_db?authSource=admin

# JWT
JWT_SECRET=GANTI_JWT_SECRET_YANG_SANGAT_PANJANG_DAN_RANDOM
```

---

### 6. Konfigurasi Nginx

Install Nginx langsung di VPS (bukan Docker, lebih gampang manage SSL):

```nginx
# /etc/nginx/sites-available/bpt-chatbot

server {
    listen 80;
    server_name domain-kamu.com www.domain-kamu.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name domain-kamu.com www.domain-kamu.com;

    ssl_certificate /etc/letsencrypt/live/domain-kamu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain-kamu.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}

server {
    listen 443 ssl;
    server_name api.domain-kamu.com;

    ssl_certificate /etc/letsencrypt/live/api.domain-kamu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.domain-kamu.com/privkey.pem;

    # Backend API
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
```

---

## 🔑 Persiapan Khusus: Google Vertex AI

Backend menggunakan GCP Vertex AI. Perlu **Service Account Key** di VPS:

1. Di Google Cloud Console → IAM → Service Accounts
2. Buat key JSON untuk service account yang punya akses Vertex AI
3. Upload key ke VPS: `scp key.json user@vps-ip:/path/to/bpt-chatbot/credentials/gcp-key.json`
4. `GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json` (sudah di .env.production)

> [!WARNING]
> Jangan taruh credentials GCP di dalam image Docker atau commit ke git! Selalu gunakan volume mount.

---

## 📋 Langkah Deploy Step-by-Step

### Di VPS (Ubuntu/Debian)

```bash
# 1. Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Nginx & Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# 3. Clone project
git clone <repo-url> /home/user/bpt-chatbot
cd /home/user/bpt-chatbot

# 4. Buat credentials folder & upload GCP key
mkdir -p credentials
# upload gcp-key.json ke folder ini

# 5. Buat file .env.production untuk backend dan frontend
# (isi sesuai template di atas)

# 6. Tambahkan next.config.mjs output standalone (lihat catatan)

# 7. Build & jalankan semua service
docker compose up -d --build

# 8. Cek status
docker compose ps
docker compose logs backend
docker compose logs frontend

# 9. Setup Nginx & SSL
sudo certbot --nginx -d domain-kamu.com -d api.domain-kamu.com

# 10. Aktifkan Nginx config
sudo ln -s /etc/nginx/sites-available/bpt-chatbot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## ⚙️ Perubahan Kode yang Diperlukan

### `next.config.mjs` — Tambah standalone output

```js
const nextConfig = {
  reactCompiler: true,
  output: 'standalone',  // ← tambahkan ini
};
export default nextConfig;
```

### `app/main.py` — Update CORS untuk production

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://domain-kamu.com",
        "https://www.domain-kamu.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔒 Security Checklist

- [ ] Ganti semua password default (MongoDB, Redis, JWT)
- [ ] CORS backend dibatasi hanya ke domain frontend
- [ ] Port MongoDB/Qdrant/Redis tidak expose ke publik (hanya internal Docker network)
- [ ] GCP key tidak ter-commit ke git
- [ ] SSL aktif dengan Let's Encrypt
- [ ] File `.env.production` masuk ke `.gitignore`

---

## 📊 Ringkasan: Apakah Semua Harus Docker?

| Service | Docker? | Alasan |
|---|---|---|
| MongoDB | ✅ Ya | Data persist via volume, mudah backup |
| Qdrant | ✅ Ya | Vector DB, butuh storage persist |
| Redis | ✅ Ya | Cache, mudah configure password |
| FastAPI Backend | ✅ Ya | Mudah build & deploy ulang |
| Next.js Frontend | ✅ Ya | Build standalone, efisien |
| **Nginx** | ❌ Langsung di VPS | Lebih mudah manage SSL dengan certbot |

> [!NOTE]
> MongoDB Atlas (cloud) bisa tetap dipakai jika koneksi internet VPS stabil dan tidak mau ribet manage storage. Pilihan pakai MongoDB Docker lokal lebih hemat biaya jika data tidak terlalu besar.
