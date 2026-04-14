from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[str] = "default_session"

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    session_id: str
    quota: Optional[dict] = None
    is_fallback: bool = False

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    uploaded_at: str
