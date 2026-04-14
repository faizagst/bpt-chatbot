"""
analytics.py — Semantic clustering untuk fitur Top Questions.

Menggunakan sentence-transformers (HuggingFace) — GRATIS, lokal, akurat.
Model: paraphrase-multilingual-MiniLM-L12-v2
  - Mendukung 50+ bahasa termasuk Bahasa Indonesia
  - Ukuran model ~420 MB (auto-download pertama kali)
  - Tidak butuh API key / quota

Cara kerja:
1. Ambil semua query unik dari chats_collection MongoDB (via aggregasi)
2. Generate embedding menggunakan sentence-transformers
3. Cluster berdasarkan cosine similarity threshold (default 0.82)
4. Tiap cluster → canonical question = query paling sering muncul
5. Cache result di Redis (TTL 10 menit) agar tidak re-embed setiap request
"""

from __future__ import annotations

import json
import os
import datetime
from typing import Any

import numpy as np
from dotenv import load_dotenv

load_dotenv()

# Timezone konstanta
UTC = datetime.timezone.utc

# ── Config ──────────────────────────────────────────────────────────────────
SIMILARITY_THRESHOLD = float(os.getenv("TOP_Q_SIM_THRESHOLD", "0.82"))
TOP_Q_CACHE_TTL = int(os.getenv("TOP_Q_CACHE_TTL", "600"))   # 10 menit
TOP_Q_CACHE_KEY = "analytics:top_questions:v2"

# Model sentence-transformers — gratis, support bahasa Indonesia
# Alternatif: "all-MiniLM-L6-v2" (lebih kecil, Inggris saja)
#             "distiluse-base-multilingual-cased-v2" (lebih besar, lebih akurat)
SBERT_MODEL_NAME = os.getenv(
    "SBERT_MODEL",
    "paraphrase-multilingual-MiniLM-L12-v2",
)

# Singleton model — di-load sekali, disimpan di memori
_sbert_model = None


def _get_sbert_model():
    """Lazy-load sentence-transformers model (thread-safe singleton)."""
    global _sbert_model
    if _sbert_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _sbert_model = SentenceTransformer(SBERT_MODEL_NAME)
        except ImportError:
            raise RuntimeError(
                "Package 'sentence-transformers' belum terinstall. "
                "Jalankan: pip install sentence-transformers"
            )
    return _sbert_model


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings batch menggunakan sentence-transformers.
    Gratis, lokal, tidak butuh API key.
    """
    model = _get_sbert_model()
    # encode() sudah menangani batching otomatis
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=False)
    return embeddings.tolist()


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Hitung cosine similarity antara dua vektor."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def _cluster_queries(
    query_counts: dict[str, int],
    query_last_asked: dict[str, datetime.datetime],
    threshold: float = SIMILARITY_THRESHOLD,
) -> list[dict[str, Any]]:
    """
    Cluster queries berdasarkan semantic similarity menggunakan sentence-transformers.

    Args:
        query_counts: {query_text: total_count}
        query_last_asked: {query_text: last_timestamp}
        threshold: cosine similarity minimum untuk dianggap 1 cluster

    Returns:
        List of cluster dicts sorted by count desc:
        [{canonical_question, count, last_asked, sample_questions, cluster_size}]
    """
    if not query_counts:
        return []

    unique_queries = list(query_counts.keys())

    # Generate embeddings menggunakan sentence-transformers (gratis & lokal)
    embeddings = _embed_texts(unique_queries)

    # ── Greedy clustering ────────────────────────────────────────────────────
    # Setiap query masuk ke cluster pertama yang punya centroid mirip (≥ threshold)
    clusters: list[dict] = []  # [{centroid: np.array, queries: [str, ...]}]

    for i, query in enumerate(unique_queries):
        emb = np.array(embeddings[i], dtype=np.float32)
        assigned = False

        for cluster in clusters:
            sim = _cosine_similarity(emb.tolist(), cluster["centroid"].tolist())
            if sim >= threshold:
                cluster["queries"].append(query)
                # Update centroid = rata-rata running (lebih stabil dari pertama saja)
                n = len(cluster["queries"])
                cluster["centroid"] = (cluster["centroid"] * (n - 1) + emb) / n
                assigned = True
                break

        if not assigned:
            clusters.append({"centroid": emb, "queries": [query]})

    # ── Build result ─────────────────────────────────────────────────────────
    results = []
    for cluster in clusters:
        member_queries = cluster["queries"]

        # Hitung total count cluster
        total_count = sum(query_counts.get(q, 0) for q in member_queries)

        # Canonical = yang paling banyak ditanyakan dalam cluster
        canonical = max(member_queries, key=lambda q: query_counts.get(q, 0))

        # Last asked terbaru dari semua anggota cluster
        last_asked_raw = max(
            (query_last_asked[q] for q in member_queries if q in query_last_asked),
            default=None,
        )

        # Pastikan datetime ber-UTC marker (+00:00) agar JavaScript bisa parse
        # dengan benar dan toLocaleString timeZone 'Asia/Jakarta' tampil WIB.
        if last_asked_raw is not None and last_asked_raw.tzinfo is None:
            last_asked_raw = last_asked_raw.replace(tzinfo=UTC)
        last_asked_iso = last_asked_raw.isoformat() if last_asked_raw else None

        # Sample questions = variasi lain (exclude canonical)
        sample_questions = [q for q in member_queries if q != canonical]

        results.append(
            {
                "canonical_question": canonical,
                "count": total_count,
                "last_asked": last_asked_iso,
                "sample_questions": sample_questions[:5],  # max 5 contoh
                "cluster_size": len(member_queries),
            }
        )


    # Sort by count desc
    results.sort(key=lambda x: x["count"], reverse=True)
    return results


def get_top_questions(
    chats_collection,
    redis_client=None,
    limit: int = 20,
    force_refresh: bool = False,
) -> list[dict[str, Any]]:
    """
    Public function: ambil top questions dengan semantic clustering.
    Result di-cache di Redis (TTL 10 menit) menggunakan sentence-transformers.

    Args:
        chats_collection: MongoDB collection object
        redis_client: Redis client (opsional — jika None, tidak cache)
        limit: jumlah top clusters yang dikembalikan
        force_refresh: paksa re-compute meskipun ada cache

    Returns:
        List of top question clusters
    """
    cache_key = TOP_Q_CACHE_KEY

    # ── Check Redis cache ────────────────────────────────────────────────────
    if redis_client and not force_refresh:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)[:limit]
        except Exception:
            pass  # Redis error → lanjut compute

    # ── Ambil semua queries dari MongoDB via aggregasi ───────────────────────
    pipeline = [
        {
            "$group": {
                "_id": "$query",
                "count": {"$sum": 1},
                "last_asked": {"$max": "$timestamp"},
            }
        },
        {"$match": {"_id": {"$ne": None, "$ne": ""}}},
        {"$sort": {"count": -1}},
        {"$limit": 500},  # max 500 unique queries untuk clustering
    ]

    try:
        agg_results = list(chats_collection.aggregate(pipeline))
    except Exception as e:
        raise RuntimeError(f"Gagal ambil data dari MongoDB: {e}")

    if not agg_results:
        return []

    query_counts: dict[str, int] = {}
    query_last_asked: dict[str, datetime.datetime] = {}

    for doc in agg_results:
        q = (doc["_id"] or "").strip()
        if not q:
            continue
        query_counts[q] = doc.get("count", 1)
        ts = doc.get("last_asked")
        if isinstance(ts, datetime.datetime):
            query_last_asked[q] = ts

    # ── Semantic clustering menggunakan sentence-transformers ────────────────
    clusters = _cluster_queries(query_counts, query_last_asked)
    result = clusters[:limit]

    # ── Store ke Redis cache ─────────────────────────────────────────────────
    if redis_client and result:
        try:
            redis_client.setex(
                cache_key,
                TOP_Q_CACHE_TTL,
                json.dumps(result, default=str),
            )
        except Exception:
            pass  # Redis error diabaikan

    return result


def invalidate_top_questions_cache(redis_client=None):
    """Hapus cache top questions (dipanggil saat ada chat baru masuk)."""
    if redis_client:
        try:
            redis_client.delete(TOP_Q_CACHE_KEY)
        except Exception:
            pass
