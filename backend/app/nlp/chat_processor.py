from typing import Dict, List, Optional, Any

class ChatProcessor:
    """
    Processor for handling chat interactions using NLP
    """
    
    def __init__(self):
        # Store conversation history as a simple dictionary
        self.conversations = {}
        
    async def process_message(self, message: str, user_id: str) -> Dict[str, Any]:
        """
        Process a user message and generate a response
        
        Args:
            message: User message text
            user_id: User ID for maintaining conversation context
            
        Returns:
            Dictionary with the bot response and additional metadata
        """
        # Initialize conversation history for this user if it doesn't exist
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        # Add the message to the conversation history
        self.conversations[user_id].append({
            "role": "user",
            "content": message
        })
        
        # Simple rule-based response
        if "help" in message.lower():
            response = "I'm here to help with your legal questions. What specific legal matter can I assist you with?"
        elif any(term in message.lower() for term in ["contract", "agreement"]):
            response = "Contracts are legally binding agreements between parties. Would you like me to explain a specific aspect of contract law?"
        elif any(term in message.lower() for term in ["sue", "lawsuit"]):
            response = "Legal proceedings vary by jurisdiction. Please provide more details about your situation for me to give relevant information."
        elif any(term in message.lower() for term in ["divorce", "family law"]):
            response = "Family law covers divorce, child custody, and related matters. Each jurisdiction has its own family law procedures."
        elif any(term in message.lower() for term in ["copyright", "patent", "trademark", "intellectual"]):
            response = "Intellectual property law protects creations of the mind, like inventions, literary works, and symbols used in commerce."
        else:
            response = "I understand you're asking about a legal matter. Could you provide more specific details so I can assist better?"
            
        # Add disclaimer
        response += "\n\nDisclaimer: This information is for general guidance only and does not constitute legal advice."
        
        # Add the response to conversation history
        self.conversations[user_id].append({
            "role": "assistant",
            "content": response
        })
        
        return {
            "message": response,
            "sources": None,
            "confidence": 0.8  # Default confidence for rule-based responses
        }
