from fastapi import APIRouter
from app.api.endpoints import auth, chat_simple as chat, documents_simple as documents, legal_simple as legal

router = APIRouter()

# Include all endpoints
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(legal.router, prefix="/legal", tags=["legal"])
