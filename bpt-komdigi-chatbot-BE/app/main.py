from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import datetime
import os
import tempfile
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional

from app.schemas import ChatRequest, ChatResponse
from app.rag import process_document, ask_chatbot
from app.db import docs_collection, chats_collection, get_redis_client

load_dotenv()

app = FastAPI(title="BPT Komdigi RAG API")

# Di production, batasi CORS hanya ke domain frontend.
# Set env var ALLOWED_ORIGINS="https://domain-kamu.com,https://www.domain-kamu.com"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "BPT Komdigi Backend API is running."}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    temp_path = None
    try:
        ext = Path(file.filename).suffix.lower()
        allowed_exts = {".pdf", ".doc", ".docx", ".csv", ".xlsx", ".png", ".jpg", ".jpeg", ".txt"}
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail="Format tidak didukung. Gunakan PDF/DOC/DOCX/CSV/XLSX/PNG/JPG/TXT.",
            )

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        doc_id = process_document(temp_path, safe_filename)

        return {"status": "success", "doc_id": doc_id, "filename": safe_filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal upload/proses file: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.get("/api/quota")
def quota_endpoint(session_id: str):
    from app.rag_impl.cache import get_quota_info
    return get_quota_info(session_id)


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        # 1. Rate Limit Check
        from app.rag_impl.cache import check_rate_limit, get_quota_info
        is_allowed, ttl, used = check_rate_limit(request.session_id)
        
        limit = 10
        quota = {
            "limit": limit,
            "used": used,
            "remaining": max(0, limit - used),
            "ttl": ttl
        }

        if not is_allowed:
            # Kirim ttl_seconds agar frontend bisa menghitung countdown realtime.
            # Gunakan JSONResponse agar bisa sertakan field tambahan selain "detail".
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Batas penggunaan tercapai (10 pertanyaan / 3 jam).",
                    "ttl_seconds": max(0, ttl),
                    "quota": quota,
                }
            )

        # 2. RAG Process
        result = ask_chatbot(request.query)

        chats_collection.insert_one(
            {
                "session_id": request.session_id,
                "query": request.query,
                "answer": result.get("answer"),
                "sources": result.get("sources", []),
                "timestamp": datetime.datetime.now(ZoneInfo("Asia/Jakarta")),
            }
        )

        # Invalidate top-questions cache agar hasil clustering fresh
        from app.rag_impl.analytics import invalidate_top_questions_cache
        invalidate_top_questions_cache(get_redis_client())

        return ChatResponse(
            answer=result.get("answer"),
            sources=result.get("sources", []),
            session_id=request.session_id,
            quota=quota,
            is_fallback=result.get("is_fallback", False)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.get("/api/documents")
def get_documents():
    try:
        docs = list(docs_collection.find({}, {"_id": 0}))
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal ambil dokumen: {str(e)}")


@app.delete("/api/documents/{doc_id}")
def delete_document_endpoint(doc_id: str):
    try:
        from app.rag import delete_document
        delete_document(doc_id)
        return {"status": "success", "message": f"Dokumen {doc_id} berhasil dihapus."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal hapus dokumen: {str(e)}")


# ═══════════════════════════════════════════════════════════════
#  ANALYTICS — Chat Logs & Top Questions
# ═══════════════════════════════════════════════════════════════

@app.get("/api/chatlogs")
def get_chatlogs(
    limit: int = Query(default=100, ge=1, le=500),
    search: Optional[str] = Query(default=None),
):
    """
    Ambil riwayat chat dari database, sort terbaru dulu.
    Optional: filter pertanyaan berdasarkan `search` keyword.
    """
    try:
        query_filter = {}
        if search:
            query_filter["query"] = {"$regex": search, "$options": "i"}

        logs = list(
            chats_collection.find(query_filter, {"_id": 0})
            .sort("timestamp", -1)
            .limit(limit)
        )

        # Serialize datetime ke ISO string dengan UTC marker (+00:00)
        # MongoDB mengembalikan naive datetime (tanpa tzinfo) yang selalu UTC.
        # Tanpa suffix, JavaScript menginterpretasikannya sebagai local time
        # sehingga konversi ke WIB di frontend menjadi salah.
        UTC = datetime.timezone.utc
        for log in logs:
            ts = log.get("timestamp")
            if isinstance(ts, datetime.datetime):
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=UTC)  # naive UTC → aware UTC
                log["timestamp"] = ts.isoformat()  # → "2026-04-06T04:24:00+00:00"

        return {"logs": logs, "total": len(logs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal ambil riwayat chat: {str(e)}")


@app.delete("/api/chatlogs")
def clear_chatlogs():
    """Hapus semua riwayat chat dari database."""
    try:
        result = chats_collection.delete_many({})
        # Juga hapus cache top-questions
        from app.rag_impl.analytics import invalidate_top_questions_cache
        invalidate_top_questions_cache(get_redis_client())
        return {
            "status": "success",
            "message": f"{result.deleted_count} riwayat chat berhasil dihapus.",
            "deleted_count": result.deleted_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal hapus riwayat chat: {str(e)}")


@app.get("/api/top-questions")
def get_top_questions(
    limit: int = Query(default=20, ge=1, le=50),
    force_refresh: bool = Query(default=False),
):
    """
    Ambil top pertanyaan dengan semantic clustering.
    Pertanyaan yang bermaksud sama dikelompokkan menjadi satu entry.
    Result di-cache di Redis (TTL 10 menit).
    """
    try:
        from app.rag_impl.analytics import get_top_questions as compute_top_questions
        result = compute_top_questions(
            chats_collection=chats_collection,
            redis_client=get_redis_client(),
            limit=limit,
            force_refresh=force_refresh,
        )
        return {"top_questions": result, "total_clusters": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal compute top questions: {str(e)}")
