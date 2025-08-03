from typing import Dict, List, Any, Optional
import io
from app.core.config import settings

class DocumentProcessor:
    """
    Simplified document processor without NLP dependencies
    """
    
    def __init__(self):
        # Store a dictionary to hold document data
        self.documents = {}
        # Initialize optional dependencies as None
        self.nlp = None
        self.llm = None
        self.text_splitter = None
        
        # Try to initialize spaCy if available
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
        except (ImportError, OSError):
            # spaCy not available or model not installed
            pass
    
    async def process_document(self, file_data: bytes) -> Dict[str, Any]:
        """
        Process a legal document and extract key information
        
        Args:
            file_data: Binary data of the uploaded file
            
        Returns:
            Dictionary with analysis results
        """
        # Extract text from PDF
        text = self._extract_text_from_pdf(file_data)
        
        if not text:
            # Fallback for non-PDF documents or if extraction failed
            text = file_data.decode("utf-8", errors="ignore")
        
        # Parse document with spaCy for basic NLP if available
        entities = []
        legal_entities = []
        
        if self.nlp:
            try:
                doc = self.nlp(text[:100000])  # Limit for very large documents
                
                # Extract entities
                entities = [
                    {"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char}
                    for ent in doc.ents
                ]
                
                # Filter for legal entities
                legal_entity_types = ["ORG", "PERSON", "GPE", "LAW", "DATE", "MONEY"]
                legal_entities = [e for e in entities if e["label"] in legal_entity_types]
            except Exception as e:
                print(f"Error processing with spaCy: {e}")
                # Continue without NLP processing
        
        # Process with LLM if available
        if self.llm:
            # Split text into chunks for processing
            text_chunks = self.text_splitter.split_text(text)
            
            # Convert to LangChain documents
            docs = [LangchainDocument(page_content=chunk) for chunk in text_chunks]
            
            # Generate summary
            summary_chain = load_summarize_chain(
                self.llm, 
                chain_type="map_reduce", 
                verbose=True
            )
            summary = summary_chain.run(docs)
            
            # Extract key points (using a custom prompt)
            key_points_prompt = (
                "Extract and list the 5-7 most important points from this legal document:\n\n{text}\n\n"
                "Key points (numbered list):"
            )
            
            # Process the first chunk only for key points to avoid token limits
            key_points_text = self.llm(key_points_prompt.format(text=text_chunks[0]))
            key_points = [
                point.strip() for point in key_points_text.split("\n")
                if point.strip() and (
                    point.strip()[0].isdigit() or 
                    point.strip()[0] == "-" or 
                    point.strip()[0] == "*"
                )
            ]
            
            # Generate recommendations
            recommendations_prompt = (
                "Based on this legal document, provide 3-5 practical recommendations:\n\n{summary}\n\n"
                "Recommendations:"
            )
            recommendations_text = self.llm(recommendations_prompt.format(summary=summary))
            recommendations = [
                rec.strip() for rec in recommendations_text.split("\n")
                if rec.strip() and (
                    rec.strip()[0].isdigit() or 
                    rec.strip()[0] == "-" or 
                    rec.strip()[0] == "*"
                )
            ]
            
            return {
                "summary": summary,
                "key_points": key_points,
                "entities": legal_entities[:20],  # Limit to top 20 entities
                "recommendations": recommendations
            }
            
        else:
            # Simple rule-based summary if no LLM is available
            if self.nlp:
                try:
                    doc = self.nlp(text[:10000])  # Smaller limit for summary
                    sentences = [sent.text for sent in doc.sents]
                    simple_summary = " ".join(sentences[:3])  # First 3 sentences as summary
                except:
                    simple_summary = text[:500] + "..." if len(text) > 500 else text
            else:
                # Fallback to simple text truncation
                simple_summary = text[:500] + "..." if len(text) > 500 else text
            
            return {
                "summary": simple_summary,
                "key_points": ["Please configure an LLM for more detailed analysis"],
                "entities": legal_entities[:20] if legal_entities else []  # Limit to top 20 entities
            }
    
    def _extract_text_from_pdf(self, file_data: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            file_data: Binary data of the PDF file
            
        Returns:
            Extracted text as string
        """
        try:
            import PyPDF2
            with io.BytesIO(file_data) as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                    
                return text
        except ImportError:
            print("PyPDF2 not available for PDF text extraction")
            return ""
        except Exception as e:
            # Return empty string on error
            print(f"Error extracting text from PDF: {str(e)}")
            return ""
