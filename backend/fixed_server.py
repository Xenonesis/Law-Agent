import http.server
import socketserver
import json
import os
import sys
import time
from http import HTTPStatus
from urllib.parse import parse_qs, urlparse
import logging
from typing import Dict, Any, List, Optional, Union
import uuid

# Try to import requests, but don't fail if it's not available
try:
    import requests
except ImportError:
    print("Warning: requests module not available. Some features may be limited.")
    requests = None

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('multi_llm_server')

# Add the current directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

PORT = int(os.getenv('PORT', 9002))

# In-memory store for chat history
chat_history = {}
mock_users = {
    "user123": {
        "id": "user123",
        "email": "test@example.com",
        "full_name": "Test User"
    }
}

# In-memory store for documents
documents_store = {}
document_counter = 0

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("Loaded environment variables from .env file")
except ImportError:
    logger.warning("python-dotenv not installed, skipping .env loading")

# Check if any LLM API keys are configured
openai_key = os.getenv("OPENAI_API_KEY", "")
gemini_key = os.getenv("GEMINI_API_KEY", "")
mistral_key = os.getenv("MISTRAL_API_KEY", "")

# Initialize available providers list
available_providers = []
if openai_key:
    available_providers.append("openai")
if gemini_key:
    available_providers.append("gemini")
if mistral_key:
    available_providers.append("mistral")

# Initialize API clients
openai_client = None
gemini_model = None
mistral_client = None

# Try to initialize OpenAI client
if openai_key:
    try:
        import openai
        openai_client = openai.OpenAI(api_key=openai_key)
        logger.info("OpenAI client initialized successfully")
    except ImportError:
        logger.warning("OpenAI library not installed. Install with: pip install openai")
        available_providers.remove("openai")

# Try to initialize Gemini client
if gemini_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini client initialized successfully")
    except ImportError:
        logger.warning("Google Generative AI library not installed. Install with: pip install google-generativeai")
        available_providers.remove("gemini")

# Try to initialize Mistral client
if mistral_key:
    try:
        from mistralai.client import MistralClient
        mistral_client = MistralClient(api_key=mistral_key)
        logger.info("Mistral client initialized successfully")
    except ImportError:
        logger.warning("Mistral AI library not installed. Install with: pip install mistralai")
        available_providers.remove("mistral")

# Log available providers
if available_providers:
    logger.info(f"Available LLM providers: {available_providers}")
else:
    logger.warning("No API keys configured or libraries missing. Please configure API keys.")

# No automatic default provider - users must manually select their preferred provider
default_provider = ""

logger.info(f"Available LLM providers: {available_providers}")
if available_providers:
    logger.info("Available providers found. Users can manually select their preferred provider.")
else:
    logger.info("No LLM providers available. Will use rule-based fallback.")

def call_openai_api(message: str, conversation_history: List[Dict], api_key: str = None) -> str:
    """Call OpenAI API with conversation history"""
    # Use provided API key or fall back to environment/global client
    if api_key:
        import openai
        client = openai.OpenAI(api_key=api_key)
    elif openai_client:
        client = openai_client
    else:
        raise Exception("OpenAI API key not provided and no default client available")
    
    messages = [
        {"role": "system", "content": "You are a legal assistant bot that provides information about legal matters. Focus on providing accurate, helpful legal information while making it clear you are not providing legal advice. Include relevant legal concepts, principles, and considerations in your responses. Be informative but cautious."}
    ]
    messages.extend(conversation_history[-10:])  # Last 10 messages for context
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=500,
        temperature=0.7
    )
    return response.choices[0].message.content

def call_gemini_api(message: str, conversation_history: List[Dict], api_key: str = None) -> str:
    """Call Gemini API with conversation history"""
    # Use provided API key or fall back to environment/global model
    if api_key:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
    elif gemini_model:
        model = gemini_model
    else:
        raise Exception("Gemini API key not provided and no default model available")
    
    # Format conversation for Gemini
    context = "You are a legal assistant bot that provides information about legal matters. Focus on providing accurate, helpful legal information while making it clear you are not providing legal advice.\n\n"
    for msg in conversation_history[-10:]:
        context += f"{msg['role']}: {msg['content']}\n"
    
    response = model.generate_content(context)
    return response.text

def call_mistral_api(message: str, conversation_history: List[Dict], api_key: str = None) -> str:
    """Call Mistral API with conversation history"""
    # Use provided API key or fall back to environment/global client
    if api_key:
        from mistralai.client import MistralClient
        client = MistralClient(api_key=api_key)
    elif mistral_client:
        client = mistral_client
    else:
        raise Exception("Mistral API key not provided and no default client available")
    
    from mistralai.models.chat_completion import ChatMessage
    
    messages = [
        ChatMessage(role="system", content="You are a legal assistant bot that provides information about legal matters. Focus on providing accurate, helpful legal information while making it clear you are not providing legal advice. Include relevant legal concepts, principles, and considerations in your responses. Be informative but cautious.")
    ]
    
    for msg in conversation_history[-10:]:
        messages.append(ChatMessage(role=msg['role'], content=msg['content']))
    
    response = client.chat(
        model="mistral-tiny",
        messages=messages,
        max_tokens=500,
        temperature=0.7
    )
    return response.choices[0].message.content

def select_best_provider(message: str, api_keys: Dict[str, str] = None, user_history: List[Dict] = None) -> str:
    """Automatically select the best provider based on message content and context"""
    if api_keys is None:
        api_keys = {}
    
    # Get available providers (from API keys or environment)
    available = []
    for provider in ["openai", "gemini", "mistral"]:
        has_key = (
            (api_keys.get(provider) and api_keys.get(provider).strip()) or
            (provider == "openai" and openai_key) or
            (provider == "gemini" and gemini_key) or
            (provider == "mistral" and mistral_key)
        )
        if has_key:
            available.append(provider)
    
    if not available:
        return None
    
    # If only one provider available, use it
    if len(available) == 1:
        return available[0]
    
    # Score providers based on message characteristics
    scores = {}
    message_lower = message.lower()
    
    for provider in available:
        score = 0
        
        # Base scores for different providers
        if provider == "openai":
            score += 85  # Generally reliable and well-rounded
        elif provider == "gemini":
            score += 80  # Good for complex reasoning
        elif provider == "mistral":
            score += 75  # Fast and efficient
        
        # Adjust scores based on message content
        
        # Legal document analysis - OpenAI tends to be more thorough
        if any(term in message_lower for term in ['contract', 'legal', 'document', 'analyze', 'review', 'clause']):
            if provider == "openai":
                score += 15
            elif provider == "gemini":
                score += 10
        
        # Complex reasoning tasks - Gemini excels here
        if any(term in message_lower for term in ['explain', 'compare', 'analyze', 'reasoning', 'logic', 'complex']):
            if provider == "gemini":
                score += 15
            elif provider == "openai":
                score += 10
        
        # Quick questions - Mistral is faster
        if len(message.split()) < 10 and any(term in message_lower for term in ['what', 'how', 'when', 'where', 'who']):
            if provider == "mistral":
                score += 15
            elif provider == "openai":
                score += 5
        
        # Code-related queries - Gemini handles code well
        if any(term in message_lower for term in ['code', 'programming', 'function', 'algorithm', 'debug']):
            if provider == "gemini":
                score += 12
            elif provider == "openai":
                score += 8
        
        # Long conversations - OpenAI maintains context well
        if user_history and len(user_history) > 10:
            if provider == "openai":
                score += 10
            elif provider == "gemini":
                score += 5
        
        # Multilingual content - Mistral handles multiple languages well
        if any(ord(char) > 127 for char in message):  # Non-ASCII characters
            if provider == "mistral":
                score += 10
            elif provider == "gemini":
                score += 8
        
        scores[provider] = score
    
    # Return the provider with the highest score
    best_provider = max(scores.items(), key=lambda x: x[1])[0]
    logger.info(f"Auto-selected provider: {best_provider} (scores: {scores})")
    return best_provider

def process_message(message: str, user_id: str = "user123", provider: Optional[str] = None, api_keys: Dict[str, str] = None) -> Dict[str, Any]:
    """Process a message using the specified LLM provider"""
    # Initialize conversation history for this user if it doesn't exist
    if user_id not in chat_history:
        chat_history[user_id] = []

    # Add the message to the conversation history
    chat_history[user_id].append({
        "role": "user",
        "content": message
    })
    
    # Initialize api_keys if not provided
    if api_keys is None:
        api_keys = {}
    
    # Determine which provider to use
    if provider and provider != "auto":
        # Check if we have API key for requested provider (either from request or environment)
        has_api_key = (
            (api_keys.get(provider) and api_keys.get(provider).strip()) or 
            (provider == "openai" and openai_key) or
            (provider == "gemini" and gemini_key) or
            (provider == "mistral" and mistral_key)
        )
        if has_api_key:
            provider_used = provider
        else:
            # Requested provider not available, auto-select best available
            provider_used = select_best_provider(message, api_keys, chat_history.get(user_id, []))
    else:
        # Auto-select the best provider based on message content and context
        provider_used = select_best_provider(message, api_keys, chat_history.get(user_id, []))
    
    if not provider_used:
        # No API available - return error message asking user to configure API keys
        error_response = {
            "message": "No API keys are configured. Please configure your API keys in the Settings page or in the .env file:\n\n" +
                      "Available providers: OpenAI, Gemini, Mistral\n\n" +
                      "Go to Settings → API Key Settings to configure your keys.",
            "provider": "none",
            "confidence": 0.0,
            "sources": [],
            "error": "no_api_keys"
        }
        return error_response

    try:
        # Get the API key for the selected provider
        selected_api_key = api_keys.get(provider_used)
        
        # Call the appropriate API
        if provider_used == "openai":
            response = call_openai_api(message, chat_history[user_id], selected_api_key)
            confidence = 0.95
        elif provider_used == "gemini":
            response = call_gemini_api(message, chat_history[user_id], selected_api_key)
            confidence = 0.9
        elif provider_used == "mistral":
            response = call_mistral_api(message, chat_history[user_id], selected_api_key)
            confidence = 0.85
        else:
            raise Exception(f"Unknown provider: {provider_used}")

        # Add disclaimer if not present
        if "disclaimer" not in response.lower():
            response += "\n\nDisclaimer: This information is for general guidance only and does not constitute legal advice."

        # Add the response to conversation history
        chat_history[user_id].append({
            "role": "assistant",
            "content": response,
            "provider": provider_used
        })

        return {
            "message": response,
            "provider": provider_used,
            "confidence": confidence,
            "sources": []
        }

    except Exception as e:
        logger.error(f"Error calling {provider_used} API: {str(e)}")
        
        # Return specific error message asking user to check API configuration
        error_message = f"Failed to get response from {provider_used} API. Please check:\n\n" +\
                       f"1. Your {provider_used} API key is correctly configured in Settings\n" +\
                       f"2. The API key is valid and has sufficient credits\n" +\
                       f"3. Required libraries are installed\n\n" +\
                       f"Error details: {str(e)}"
        
        return {
            "message": error_message,
            "provider": provider_used,
            "confidence": 0.0,
            "sources": [],
            "error": "api_call_failed"
        }

class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        # Allow requests from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        # Allow all methods
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        # Allow all headers
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def _get_request_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(body)
        return {}

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Normalize path - handle both with and without /api prefix
        if path.startswith('/api/'):
            normalized_path = path
        else:
            normalized_path = f'/api{path}'

        # Handle root path
        if path == '/' or path == '':
            self._set_headers()
            response = {
                'status': 'ok',
                'message': 'Multi-LLM Lawyer Bot Backend API is running',
                'version': '0.1.0',
                'endpoints': ['/api/health', '/api/chat/send', '/api/chat/history'],
                'docs': 'Access the frontend at http://localhost:3003'
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        if path == '/api/health' or path == '/health':
            self._set_headers()
            
            # Check API key configuration status
            api_status = {
                'openai': {
                    'configured': bool(openai_key),
                    'client_ready': openai_client is not None
                },
                'gemini': {
                    'configured': bool(gemini_key),
                    'client_ready': gemini_model is not None
                },
                'mistral': {
                    'configured': bool(mistral_key),
                    'client_ready': mistral_client is not None
                }
            }
            
            response = {
                'status': 'ok',
                'message': 'Multi-LLM Lawyer Bot Backend API is running',
                'version': '0.1.0',
                'providers': available_providers,
                'default_provider': default_provider if available_providers else 'none',
                'api_status': api_status,
                'setup_instructions': {
                    'message': 'To use AI responses, configure API keys in .env file',
                    'example_file': '.env.example',
                    'required_packages': 'pip install -r requirements.txt'
                } if not available_providers else None
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # Handle documents list endpoint
        elif normalized_path == '/api/documents/list' or path == '/documents/list':
            self._set_headers()
            # Return list of documents from in-memory store
            documents_list = list(documents_store.values())
            self.wfile.write(json.dumps(documents_list).encode('utf-8'))
            return

        # Handle get specific document endpoint
        elif normalized_path.startswith('/api/documents/') and not normalized_path.endswith('/analyze'):
            document_id = normalized_path.split('/')[-1]
            if document_id in documents_store:
                self._set_headers()
                self.wfile.write(json.dumps(documents_store[document_id]).encode('utf-8'))
                return
            else:
                self._set_headers(status_code=404)
                response = {'error': 'Document not found'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        # Handle dashboard stats endpoint
        elif normalized_path == '/api/dashboard/stats' or path == '/dashboard/stats':
            self._set_headers()
            
            # Calculate real statistics from in-memory data
            total_conversations = len(chat_history)
            total_messages = sum(len(messages) for messages in chat_history.values())
            user_messages = sum(len([msg for msg in messages if msg['role'] == 'user']) for messages in chat_history.values())
            documents_analyzed = len(documents_store)
            
            # Calculate system uptime (mock for now, but could be real)
            uptime_percentage = "99.9%"
            
            # Get provider usage statistics
            provider_usage = {}
            for user_messages in chat_history.values():
                for msg in user_messages:
                    if msg['role'] == 'assistant' and 'provider' in msg:
                        provider = msg['provider']
                        provider_usage[provider] = provider_usage.get(provider, 0) + 1
            
            # Recent activity (last 24 hours simulation)
            recent_chats = min(total_conversations, 5)  # Mock recent activity
            recent_documents = min(documents_analyzed, 3)
            
            stats = {
                'totalConversations': total_conversations,
                'documentsAnalyzed': documents_analyzed,
                'questionsAnswered': user_messages,
                'systemUptime': uptime_percentage,
                'providerUsage': provider_usage,
                'recentActivity': {
                    'chats': recent_chats,
                    'documents': recent_documents,
                    'queries': min(user_messages, 15)
                },
                'systemStatus': {
                    'apiOnline': True,
                    'aiModelsReady': len(available_providers) > 0,
                    'databaseConnected': True
                },
                'availableProviders': available_providers,
                'lastUpdated': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            self.wfile.write(json.dumps(stats).encode('utf-8'))
            return

        # Handle both /api/chat/history and /chat/history endpoints
        elif normalized_path == '/api/chat/history' or path == '/chat/history':
            # No authentication required for testing
            user_id = "user123"  # Default test user

            # Format message history for response
            messages = []
            if user_id in chat_history:
                for msg in chat_history[user_id]:
                    message_id = str(uuid.uuid4())
                    # Include provider in the response if available
                    message_data = {
                        "id": message_id,
                        "user_id": user_id,
                        "content": msg["content"],
                        "role": msg["role"],
                        "timestamp": "2023-01-01T00:00:00"  # Mock timestamp
                    }
                    if "provider" in msg:
                        message_data["provider"] = msg["provider"]
                    messages.append(message_data)

            self._set_headers()
            self.wfile.write(json.dumps(messages).encode('utf-8'))
            return

        # Handle favicon.ico request
        elif path == '/favicon.ico':
            self._set_headers(status_code=204)  # No content
            return

        # Handle 404 for any other path
        self._set_headers(status_code=404)
        response = {'error': 'Not found', 'path': self.path}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Normalize path - handle both with and without /api prefix
        if path.startswith('/api/'):
            normalized_path = path
        else:
            normalized_path = f'/api{path}'

        # Handle document upload endpoint
        if normalized_path == '/api/documents/upload' or path == '/documents/upload':
            try:
                global document_counter
                document_counter += 1
                
                # For simplicity, we'll handle JSON uploads instead of multipart
                body = self._get_request_body()
                title = body.get('title', f'Document {document_counter}')
                description = body.get('description', '')
                
                # Create mock document
                document_id = str(uuid.uuid4())
                document = {
                    'id': document_id,
                    'title': title,
                    'description': description,
                    'filename': f'{title}.pdf',
                    'file_size': 1024,  # Mock file size
                    'upload_date': time.strftime('%Y-%m-%dT%H:%M:%S'),
                    'status': 'uploaded',
                    'user_id': 'user123'
                }
                
                documents_store[document_id] = document
                
                self._set_headers(status_code=201)
                self.wfile.write(json.dumps(document).encode('utf-8'))
                return
                
            except Exception as e:
                logger.error(f"Error uploading document: {str(e)}")
                self._set_headers(status_code=500)
                response = {'error': f'Internal server error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        # Handle document analysis endpoint
        elif normalized_path.endswith('/analyze'):
            try:
                document_id = normalized_path.split('/')[-2]
                
                if document_id not in documents_store:
                    self._set_headers(status_code=404)
                    response = {'error': 'Document not found'}
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                    return
                
                # Mock analysis result
                analysis_result = {
                    'document_id': document_id,
                    'analysis_date': time.strftime('%Y-%m-%dT%H:%M:%S'),
                    'summary': 'This is a mock analysis of the document. In a real implementation, this would contain AI-generated insights about the legal document.',
                    'key_points': [
                        'Contract terms and conditions',
                        'Legal obligations and responsibilities',
                        'Important dates and deadlines'
                    ],
                    'risk_assessment': 'Medium',
                    'recommendations': [
                        'Review clause 3.2 for potential issues',
                        'Consider adding additional protection clauses',
                        'Verify compliance with local regulations'
                    ]
                }
                
                self._set_headers()
                self.wfile.write(json.dumps(analysis_result).encode('utf-8'))
                return
                
            except Exception as e:
                logger.error(f"Error analyzing document: {str(e)}")
                self._set_headers(status_code=500)
                response = {'error': f'Internal server error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        # Handle both /api/chat/send and /chat/send endpoints
        elif normalized_path == '/api/chat/send' or path == '/chat/send':
            try:
                # No authentication required for testing
                user_id = "user123"  # Default test user

                # Get request body
                body = self._get_request_body()
                content = body.get('content', '')
                provider = body.get('provider')
                api_keys = body.get('api_keys', {})

                if not content:
                    self._set_headers(status_code=400)
                    response = {'error': 'Message content is required'}
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                    return

                # Process the message
                response_data = process_message(content, user_id, provider, api_keys)

                self._set_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                return

            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                self._set_headers(status_code=500)
                response = {'error': f'Internal server error: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

        # Handle 404 for any other path
        self._set_headers(status_code=404)
        response = {'error': 'Not found', 'path': self.path}
        self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == '__main__':
    print(f"Starting Multi-LLM Lawyer Bot server on port {PORT}...")
    try:
        with socketserver.TCPServer(("", PORT), HTTPRequestHandler) as httpd:
            print(f"Server running at http://localhost:{PORT}")
            print(f"Health check endpoint: http://localhost:{PORT}/api/health")
            print(f"Available LLM providers: {available_providers}")
            print(f"Default provider: {default_provider if available_providers else 'None (rule-based)'}")

            httpd.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped.")
