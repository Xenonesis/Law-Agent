from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.api.endpoints.auth import oauth2_scheme
from app.core.security import get_current_user
from app.db.supabase import supabase_client
from app.nlp.chat_processor import ChatProcessor

router = APIRouter()
chat_processor = ChatProcessor()

# Models
class Message(BaseModel):
    content: str
    role: str = "user"
    timestamp: datetime = Field(default_factory=datetime.now)

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    content: str
    role: str
    timestamp: datetime
    
class ChatResponse(BaseModel):
    message: str
    sources: Optional[List[str]] = None
    confidence: Optional[float] = None

@router.post("/send", response_model=ChatResponse)
async def send_message(
    message: Message = Body(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Send a message to the lawyer bot and get a response
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Save the user message
        user_message_data = {
            "user_id": user_id,
            "content": message.content,
            "role": "user",
            "timestamp": message.timestamp.isoformat()
        }
        
        response = supabase_client.table("messages").insert(user_message_data).execute()
        
        # Process the message with NLP
        response_data = await chat_processor.process_message(
            message.content,
            user_id=user_id
        )
        
        # Save the bot response
        bot_message_data = {
            "user_id": user_id,
            "content": response_data["message"],
            "role": "assistant",
            "timestamp": datetime.now().isoformat()
        }
        
        supabase_client.table("messages").insert(bot_message_data).execute()
        
        return response_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing message: {str(e)}",
        )

@router.get("/history", response_model=List[ChatMessage])
async def get_chat_history(
    limit: int = 50,
    token: str = Depends(oauth2_scheme)
):
    """
    Get chat history for the current user
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Get messages from Supabase
        response = supabase_client.table("messages") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("timestamp", desc=False) \
            .limit(limit) \
            .execute()
            
        return response.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching chat history: {str(e)}",
        )
