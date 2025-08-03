from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.api.endpoints.auth import oauth2_scheme
from app.core.security import get_current_user
from app.nlp.legal_processor import LegalProcessor

router = APIRouter()
legal_processor = LegalProcessor()

# Models
class LegalQuery(BaseModel):
    question: str
    jurisdiction: Optional[str] = None

class LegalResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    disclaimer: str
    confidence: Optional[float] = None

class CaseLawQuery(BaseModel):
    keywords: List[str]
    jurisdiction: str
    year_range: Optional[List[int]] = None
    
class CaseLawResult(BaseModel):
    title: str
    court: str
    year: int
    summary: str
    relevance: float
    url: Optional[str] = None

@router.post("/query", response_model=LegalResponse)
async def legal_query(
    query: LegalQuery,
    token: str = Depends(oauth2_scheme)
):
    """
    Ask a legal question and get an answer
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        
        # Process the query with NLP
        response_data = await legal_processor.process_query(
            query.question,
            jurisdiction=query.jurisdiction
        )
        
        # Add standard disclaimer
        disclaimer = (
            "This information is provided for general guidance only and does not constitute "
            "legal advice. For advice specific to your situation, please consult with a "
            "qualified attorney."
        )
        
        return {
            "answer": response_data["answer"],
            "sources": response_data.get("sources"),
            "disclaimer": disclaimer,
            "confidence": response_data.get("confidence")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing legal query: {str(e)}",
        )

@router.post("/case-law", response_model=List[CaseLawResult])
async def search_case_law(
    query: CaseLawQuery,
    limit: int = 10,
    token: str = Depends(oauth2_scheme)
):
    """
    Search for relevant case law based on keywords and jurisdiction
    """
    try:
        # Get current user
        current_user = await get_current_user(token)
        
        # Process the case law search
        results = await legal_processor.search_case_law(
            keywords=query.keywords,
            jurisdiction=query.jurisdiction,
            year_range=query.year_range,
            limit=limit
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error searching case law: {str(e)}",
        )
