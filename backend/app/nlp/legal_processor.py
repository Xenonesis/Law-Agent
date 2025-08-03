from typing import Dict, List, Any, Optional
from app.core.config import settings

class LegalProcessor:
    """
    Processor for handling legal queries and case law searches
    """
    
    def __init__(self):
        # Initialize optional dependencies
        self.nlp = None
        self.llm = None
        
        # Try to load spaCy model
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
        except (ImportError, OSError):
            # spaCy not available or model not installed
            pass
        
        # Initialize LLM if API key is available
        try:
            if settings.OPENAI_API_KEY:
                from langchain.llms import OpenAI
                self.llm = OpenAI(temperature=0.3, openai_api_key=settings.OPENAI_API_KEY)
        except ImportError:
            # LangChain not available
            pass
            
        # Initialize a mock case law database (would be replaced with a real database/API)
        self.case_law_db = [
            {
                "title": "Smith v. Jones",
                "court": "Supreme Court",
                "year": 2020,
                "summary": "Landmark decision establishing precedent for digital privacy rights.",
                "keywords": ["privacy", "digital", "rights", "data protection"],
                "jurisdiction": "Federal",
                "url": "https://example.com/case/smith-v-jones"
            },
            {
                "title": "Johnson Inc. v. Tech Corp",
                "court": "Circuit Court of Appeals",
                "year": 2018,
                "summary": "Major corporate litigation regarding intellectual property infringement.",
                "keywords": ["intellectual property", "patent", "infringement", "corporate"],
                "jurisdiction": "Federal",
                "url": "https://example.com/case/johnson-v-tech"
            },
            {
                "title": "State v. Williams",
                "court": "State Supreme Court",
                "year": 2021,
                "summary": "Criminal case establishing new standards for evidence admissibility.",
                "keywords": ["criminal", "evidence", "admissibility", "standards"],
                "jurisdiction": "California",
                "url": "https://example.com/case/state-v-williams"
            }
        ]
    
    async def process_query(self, question: str, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a legal query and provide an answer
        
        Args:
            question: Legal question from the user
            jurisdiction: Optional jurisdiction specification
            
        Returns:
            Dictionary with answer and metadata
        """
        # Parse question with spaCy if available
        entities = []
        if self.nlp:
            try:
                doc = self.nlp(question)
                entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
            except Exception as e:
                print(f"Error processing with spaCy: {e}")
        
        # Process with LLM if available
        if self.llm:
            # Create a prompt template
            template = """
            You are a legal AI assistant providing information about legal matters.
            
            Question: {question}
            {jurisdiction_context}
            
            Important guidelines:
            1. Provide accurate legal information based on general legal principles.
            2. Cite relevant legal concepts, statutes or cases if applicable.
            3. Do not provide specific legal advice for individual situations.
            4. Clearly indicate any jurisdictional limitations.
            5. Use clear, concise language appropriate for legal communication.
            
            Answer:
            """
            
            jurisdiction_context = f"Jurisdiction: {jurisdiction}" if jurisdiction else "Jurisdiction: Not specified, provide general information."
            
            prompt = PromptTemplate(
                input_variables=["question", "jurisdiction_context"],
                template=template
            )
            
            # Create LLM chain
            try:
                from langchain.chains import LLMChain
                from langchain.prompts import PromptTemplate
                chain = LLMChain(llm=self.llm, prompt=prompt)
            except ImportError:
                # Fallback if LangChain not available
                return {
                    "answer": "I need LangChain to provide detailed legal analysis. Please install the required dependencies.",
                    "sources": [],
                    "confidence": 0.0
                }
            
            # Run the chain
            answer = chain.run({
                "question": question,
                "jurisdiction_context": jurisdiction_context
            })
            
            # Find relevant sources
            sources = ["Legal Encyclopedia", "General Legal Principles"]
            
            if jurisdiction:
                sources.append(f"{jurisdiction} Legal Code")
            
            # Extract confidence based on the quality of answer
            confidence = 0.85  # Placeholder - would be properly calculated
            
            return {
                "answer": answer,
                "sources": sources,
                "confidence": confidence
            }
        else:
            # Simple rule-based response if no LLM is available
            topics = self._extract_legal_topics(doc)
            
            if "contract" in topics:
                answer = "Contract law involves legally binding agreements between parties. Key elements include offer, acceptance, consideration, and intention to create legal relations."
            elif "tort" in topics:
                answer = "Tort law deals with civil wrongs that cause harm or injury to another person. Common torts include negligence, defamation, and trespass."
            elif "criminal" in topics:
                answer = "Criminal law addresses behaviors considered harmful to society as a whole. Crimes are typically prosecuted by the state rather than individuals."
            else:
                answer = "Your legal question involves general legal principles. For specific advice, please consult an attorney in your jurisdiction."
                
            # Add jurisdiction context if provided
            if jurisdiction:
                answer += f"\n\nNote that legal systems may vary by jurisdiction. The information above may not fully apply to {jurisdiction}."
                
            return {
                "answer": answer,
                "sources": ["Legal Knowledge Base"],
                "confidence": 0.6
            }
    
    async def search_case_law(
        self, 
        keywords: List[str], 
        jurisdiction: str,
        year_range: Optional[List[int]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant case law based on keywords
        
        Args:
            keywords: List of keywords to search for
            jurisdiction: Legal jurisdiction for the search
            year_range: Optional range of years to filter by [start_year, end_year]
            limit: Maximum number of results to return
            
        Returns:
            List of case law results with relevance scores
        """
        # In a real implementation, this would query a legal database or API
        # Here we're using our simple mock database for demonstration
        
        results = []
        
        for case in self.case_law_db:
            # Check jurisdiction
            if jurisdiction.lower() != "any" and case["jurisdiction"].lower() != jurisdiction.lower():
                continue
                
            # Check year range if provided
            if year_range:
                if len(year_range) == 2 and (case["year"] < year_range[0] or case["year"] > year_range[1]):
                    continue
            
            # Calculate relevance score based on keyword matches
            relevance = 0.0
            for keyword in keywords:
                # Check title
                if keyword.lower() in case["title"].lower():
                    relevance += 0.3
                    
                # Check summary
                if keyword.lower() in case["summary"].lower():
                    relevance += 0.2
                    
                # Check case keywords
                if any(keyword.lower() in k.lower() for k in case["keywords"]):
                    relevance += 0.5
            
            # Normalize relevance score
            relevance = min(relevance, 1.0)
            
            # Add to results if relevant
            if relevance > 0:
                results.append({
                    "title": case["title"],
                    "court": case["court"],
                    "year": case["year"],
                    "summary": case["summary"],
                    "relevance": relevance,
                    "url": case["url"]
                })
        
        # Sort by relevance and limit results
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:limit]
    
    def _extract_legal_topics(self, doc) -> List[str]:
        """
        Extract legal topics from spaCy document
        
        Args:
            doc: spaCy document
            
        Returns:
            List of legal topics
        """
        # List of common legal topics to check for
        legal_topics = [
            "contract", "tort", "criminal", "property", "constitutional", 
            "administrative", "family", "corporate", "intellectual property",
            "tax", "employment", "immigration", "environmental", "bankruptcy"
        ]
        
        found_topics = []
        text_lower = doc.text.lower()
        
        for topic in legal_topics:
            if topic in text_lower:
                found_topics.append(topic)
                
        return found_topics
