from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.endpoints.auth import oauth2_scheme
from app.core.security import get_current_user
from app.db.supabase import supabase_client, supabase_storage
from app.nlp.document_processor import DocumentProcessor
import uuid

router = APIRouter()
document_processor = DocumentProcessor()

# Models
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    
class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    user_id: str
    file_path: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
class DocumentAnalysisResult(BaseModel):
    summary: str
    key_points: List[str]
    entities: List[dict]
    recommendations: Optional[List[str]] = None

@router.post("/upload", response_model=Document)
async def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme)
):
    """
    Upload a legal document for analysis
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Generate a unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        storage_path = f"documents/{user_id}/{unique_filename}"
        
        # Read file content
        content = await file.read()
        
        # Upload to Supabase Storage
        supabase_storage.from_("documents").upload(storage_path, content)
        
        # Create document record
        document_data = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "file_path": storage_path,
            "created_at": datetime.now().isoformat(),
        }
        
        response = supabase_client.table("documents").insert(document_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error creating document record",
            )
            
        return response.data[0]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error uploading document: {str(e)}",
        )

@router.get("/list", response_model=List[Document])
async def list_documents(token: str = Depends(oauth2_scheme)):
    """
    List all documents for the current user
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Get documents from Supabase
        response = supabase_client.table("documents") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
            
        return response.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching documents: {str(e)}",
        )

@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    token: str = Depends(oauth2_scheme)
):
    """
    Get a specific document by ID
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Get document from Supabase
        response = supabase_client.table("documents") \
            .select("*") \
            .eq("id", document_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
            
        return response.data[0]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching document: {str(e)}",
        )

@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResult)
async def analyze_document(
    document_id: str,
    token: str = Depends(oauth2_scheme)
):
    """
    Analyze a legal document
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        user_id = current_user["id"]
        
        # Get document from Supabase
        response = supabase_client.table("documents") \
            .select("*") \
            .eq("id", document_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
            
        document = response.data[0]
        file_path = document["file_path"]
        
        # Download file from Supabase Storage
        file_data = supabase_storage.from_("documents").download(file_path)
        
        # Process the document with NLP
        analysis_result = await document_processor.process_document(file_data)
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error analyzing document: {str(e)}",
        )
