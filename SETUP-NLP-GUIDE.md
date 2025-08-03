# NLP Dependencies Setup Guide

## Quick Setup (Recommended)

Run the automated installer:
```bash
install-nlp-deps.bat
```

## Manual Setup

### 1. Install Core Dependencies
```bash
cd backend
venv\Scripts\activate
pip install -r nlp_requirements.txt
```

### 2. Download spaCy Model
```bash
python -m spacy download en_core_web_sm
```

### 3. Download NLTK Data
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('vader_lexicon')"
```

## Features Enabled by NLP Dependencies

### Without NLP Dependencies (Current State)
- ✅ Basic document upload and storage
- ✅ Simple rule-based chat responses
- ✅ Basic legal query handling
- ❌ Advanced document analysis
- ❌ Entity extraction
- ❌ Intelligent summarization

### With NLP Dependencies
- ✅ All basic features
- ✅ **Advanced document analysis** with entity extraction
- ✅ **Intelligent summarization** using LLMs
- ✅ **Named entity recognition** (people, organizations, dates, etc.)
- ✅ **PDF text extraction** and processing
- ✅ **Enhanced chat responses** with sentiment analysis
- ✅ **Legal entity detection** in documents

## API Key Configuration

Add these to your `.env` file for enhanced AI features:

```env
# OpenAI (recommended for best results)
OPENAI_API_KEY=your_openai_api_key_here

# Alternative providers
GEMINI_API_KEY=your_gemini_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here

# Set default provider
DEFAULT_LLM_PROVIDER=openai
```

## Troubleshooting

### spaCy Model Issues
If you get "Can't find model 'en_core_web_sm'":
```bash
python -m spacy download en_core_web_sm --user
```

### Memory Issues
For large documents, the system automatically:
- Limits text processing to 100,000 characters
- Chunks documents for LLM processing
- Uses efficient text extraction methods

### Dependency Conflicts
If you encounter conflicts:
1. Create a fresh virtual environment
2. Install dependencies in order: core → NLP → AI providers
3. Use the provided requirements files

## Testing NLP Features

After installation, test with:
```python
# Test document processor
from app.nlp.document_processor import DocumentProcessor
dp = DocumentProcessor()
result = await dp.process_document(b"Test document content")

# Test legal processor  
from app.nlp.legal_processor import LegalProcessor
lp = LegalProcessor()
result = await lp.process_query("What is contract law?")
```