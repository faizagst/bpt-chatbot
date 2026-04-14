FROM python:3.11-slim

# ── System dependencies ────────────────────────────────────────────────────
# EasyOCR butuh: libGL (OpenCV rendering), libglib2.0, libgomp (OpenMP untuk torch)
# gcc/g++ butuh untuk compile beberapa wheel Python (scipy, torch extension, dll.)
# curl dipakai untuk Docker healthcheck (opsional tapi berguna)
# CATATAN: tesseract-ocr TIDAK diinstall karena kode memakai EasyOCR, bukan pytesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV / EasyOCR runtime
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # OpenMP (dipakai torch & numpy)
    libgomp1 \
    # Build tools (untuk wheel yang perlu compile)
    gcc \
    g++ \
    # Utility
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements dulu (layer ini di-cache selama requirements.txt tidak berubah)
COPY requirements.txt .

# Install Python deps — torch CPU-only agar image lebih kecil (GPU tidak tersedia di VPS biasa)
# EasyOCR akan otomatis download model saat pertama kali berjalan (disimpan di ~/.EasyOCR/)
RUN pip install --no-cache-dir -r requirements.txt

# Copy semua source code
COPY . .

EXPOSE 8000

# Tambahkan healthcheck agar docker compose tahu backend siap
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
