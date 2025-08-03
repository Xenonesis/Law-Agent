# 📚 Private Lawyer Bot API Documentation

<div align="center">

![API Documentation](https://img.shields.io/badge/API-Documentation-2563eb?style=for-the-badge&logo=swagger&logoColor=white)
![Version](https://img.shields.io/badge/Version-2.0.0-8b5cf6?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)

**Comprehensive REST API Documentation for Private Lawyer Bot**

</div>

---

## 📋 Table of Contents

- [🌐 Base Configuration](#-base-configuration)
- [🔐 Authentication](#-authentication)
- [💬 Chat & AI Endpoints](#-chat--ai-endpoints)
- [📄 Document Management](#-document-management)
- [🔍 Legal Research](#-legal-research)
- [📊 Dashboard & Analytics](#-dashboard--analytics)
- [⚙️ System & Health](#️-system--health)
- [🚨 Error Handling](#-error-handling)
- [📝 Request/Response Examples](#-requestresponse-examples)
- [🧪 Testing Guide](#-testing-guide)

---

## 🌐 Base Configuration

### API Base URL
```
Development: http://localhost:9002/api
Production:  https://your-domain.com/api
```

### Content Type
```
Content-Type: application/json
```

### CORS Policy
- **Allowed Origins**: `*` (development), specific domains (production)
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `*`

---

## 🔐 Authentication

### Overview
The API uses JWT (JSON Web Token) based authentication for secure access to protected endpoints.

### Authentication Flow

#### 1. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "full_name": "Test User",
    "role": "user"
  }
}
```

#### 2. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure-password",
  "full_name": "New User"
}
```

#### 3. Using Authentication Token
Include the token in the Authorization header for all protected endpoints:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### 4. Token Refresh
```http
POST /api/auth/refresh
Authorization: Bearer <current-token>
```

---

## 💬 Chat & AI Endpoints

### Send Message to AI Assistant

#### Endpoint
```http
POST /api/chat/send
```

#### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "content": "What are the key elements of a valid contract?",
  "provider": "auto",
  "api_keys": {
    "openai": "sk-your-openai-key",
    "gemini": "your-gemini-key",
    "mistral": "your-mistral-key"
  },
  "context": {
    "conversation_id": "conv-123",
    "document_ids": ["doc-456"],
    "legal_area": "contract_law"
  }
}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | The message content to send to AI |
| `provider` | string | No | AI provider: `"auto"`, `"openai"`, `"gemini"`, `"mistral"` |
| `api_keys` | object | No | API keys for different providers |
| `context` | object | No | Additional context for the conversation |

#### Response
```json
{
  "message": "A valid contract requires four key elements: offer, acceptance, consideration, and legal capacity...",
  "provider": "openai",
  "confidence": 0.95,
  "sources": [],
  "metadata": {
    "tokens_used": 150,
    "response_time": 1.2,
    "model": "gpt-3.5-turbo"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Chat History

#### Endpoint
```http
GET /api/chat/history
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Maximum number of messages to return |
| `conversation_id` | string | - | Filter by specific conversation |
| `offset` | integer | 0 | Pagination offset |

#### Response
```json
[
  {
    "id": "msg-789",
    "user_id": "user-123",
    "content": "What are the key elements of a valid contract?",
    "role": "user",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "id": "msg-790",
    "user_id": "user-123",
    "content": "A valid contract requires four key elements...",
    "role": "assistant",
    "provider": "openai",
    "timestamp": "2024-01-15T10:30:15Z"
  }
]
```

### Clear Chat History

#### Endpoint
```http
DELETE /api/chat/history
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `conversation_id` | string | Clear specific conversation (optional) |

---

## 📄 Document Management

### Upload Document

#### Endpoint
```http
POST /api/documents/upload
```

#### Headers
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Form Data
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Document file (PDF, DOCX, TXT) |
| `title` | string | Yes | Document title |
| `description` | string | No | Document description |
| `tags` | string[] | No | Document tags for categorization |

#### Response
```json
{
  "id": "doc-456",
  "title": "Employment Contract Review",
  "filename": "contract.pdf",
  "file_size": 2048576,
  "status": "uploaded",
  "upload_date": "2024-01-15T10:30:00Z",
  "user_id": "user-123",
  "tags": ["contract", "employment", "legal-review"]
}
```

### Get All Documents

#### Endpoint
```http
GET /api/documents/list
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Maximum documents to return |
| `offset` | integer | 0 | Pagination offset |
| `status` | string | - | Filter by status: `uploaded`, `processing`, `analyzed` |
| `tags` | string | - | Filter by tags (comma-separated) |

#### Response
```json
[
  {
    "id": "doc-456",
    "title": "Employment Contract Review",
    "filename": "contract.pdf",
    "file_size": 2048576,
    "status": "uploaded",
    "upload_date": "2024-01-15T10:30:00Z",
    "user_id": "user-123",
    "tags": ["contract", "employment"]
  }
]
```

### Get Specific Document

#### Endpoint
```http
GET /api/documents/{document_id}
```

#### Response
```json
{
  "id": "doc-456",
  "title": "Employment Contract Review",
  "filename": "contract.pdf",
  "file_size": 2048576,
  "status": "uploaded",
  "upload_date": "2024-01-15T10:30:00Z",
  "user_id": "user-123",
  "content": "Document text content...",
  "metadata": {
    "pages": 15,
    "word_count": 3500,
    "language": "en"
  }
}
```

### Analyze Document

#### Endpoint
```http
POST /api/documents/{document_id}/analyze
```

#### Request Body
```json
{
  "analysis_type": "full",
  "provider": "openai",
  "options": {
    "extract_entities": true,
    "generate_summary": true,
    "risk_assessment": true
  }
}
```

#### Parameters
| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| `analysis_type` | string | `summary`, `entities`, `full` | Type of analysis |
| `provider` | string | `openai`, `gemini`, `mistral` | AI provider for analysis |

#### Response
```json
{
  "document_id": "doc-456",
  "analysis_date": "2024-01-15T10:30:00Z",
  "summary": "This employment contract outlines the terms and conditions...",
  "entities": [
    {
      "type": "person",
      "text": "John Doe",
      "confidence": 0.95,
      "start_pos": 150,
      "end_pos": 158
    },
    {
      "type": "organization",
      "text": "ABC Corp",
      "confidence": 0.98,
      "start_pos": 200,
      "end_pos": 208
    }
  ],
  "key_points": [
    "Contract duration: 2 years",
    "Salary: $75,000 annually",
    "Benefits package included"
  ],
  "risk_assessment": {
    "level": "medium",
    "score": 0.6,
    "factors": [
      "Termination clause needs clarification",
      "Intellectual property rights undefined"
    ]
  },
  "recommendations": [
    "Review the termination clause for clarity",
    "Consider adding intellectual property provisions",
    "Verify compliance with local labor laws"
  ]
}
```

### Delete Document

#### Endpoint
```http
DELETE /api/documents/{document_id}
```

---

## 🔍 Legal Research

### Legal Query

#### Endpoint
```http
POST /api/legal/query
```

#### Request Body
```json
{
  "question": "What are the requirements for a valid contract in California?",
  "jurisdiction": "US-CA",
  "legal_area": "contract_law",
  "context": {
    "case_type": "commercial",
    "urgency": "normal"
  }
}
```

#### Response
```json
{
  "query_id": "query-789",
  "answer": "In California, a valid contract requires...",
  "sources": [
    {
      "type": "statute",
      "citation": "Cal. Civ. Code § 1550",
      "title": "Essential Elements of Contract",
      "relevance": 0.95
    }
  ],
  "related_cases": [
    {
      "case_name": "Smith v. Jones",
      "citation": "123 Cal.App.4th 456 (2023)",
      "summary": "Court held that...",
      "relevance_score": 0.92
    }
  ],
  "confidence": 0.9,
  "jurisdiction": "US-CA",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Case Law Search

#### Endpoint
```http
POST /api/legal/case-law
```

#### Request Body
```json
{
  "keywords": ["contract", "breach", "damages"],
  "jurisdiction": "US-CA",
  "year_range": [2020, 2024],
  "court_level": "supreme",
  "limit": 10
}
```

#### Response
```json
{
  "results": [
    {
      "case_name": "Smith v. Jones",
      "citation": "123 Cal.App.4th 456 (2023)",
      "court": "California Court of Appeal",
      "date": "2023-05-15",
      "summary": "Court held that breach of contract requires...",
      "key_holdings": [
        "Damages must be foreseeable",
        "Mitigation duty applies"
      ],
      "relevance_score": 0.92,
      "full_text_url": "https://example.com/case/123"
    }
  ],
  "total_results": 15,
  "search_time": 0.8,
  "query_metadata": {
    "keywords_used": ["contract", "breach", "damages"],
    "filters_applied": ["jurisdiction", "year_range"]
  }
}
```

### Statute Search

#### Endpoint
```http
POST /api/legal/statutes
```

#### Request Body
```json
{
  "query": "contract formation requirements",
  "jurisdiction": "US-CA",
  "code_section": "civil"
}
```

---

## 📊 Dashboard & Analytics

### Get Dashboard Statistics

#### Endpoint
```http
GET /api/dashboard/stats
```

#### Response
```json
{
  "totalConversations": 150,
  "documentsAnalyzed": 45,
  "questionsAnswered": 320,
  "systemUptime": "99.9%",
  "providerUsage": {
    "openai": 180,
    "gemini": 95,
    "mistral": 45
  },
  "recentActivity": {
    "chats": 12,
    "documents": 5,
    "queries": 28
  },
  "systemStatus": {
    "apiOnline": true,
    "aiModelsReady": true,
    "databaseConnected": true
  },
  "availableProviders": ["openai", "gemini", "mistral"],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Get Usage Analytics

#### Endpoint
```http
GET /api/analytics/usage
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | Time period: `1d`, `7d`, `30d`, `90d` |
| `metric` | string | `all` | Specific metric to retrieve |

---

## ⚙️ System & Health

### Health Check

#### Endpoint
```http
GET /api/health
```

#### Response
```json
{
  "status": "ok",
  "message": "Multi-LLM Lawyer Bot Backend API is running",
  "version": "2.0.0",
  "providers": ["openai", "gemini", "mistral"],
  "default_provider": "auto",
  "api_status": {
    "openai": {
      "configured": true,
      "client_ready": true
    },
    "gemini": {
      "configured": true,
      "client_ready": true
    },
    "mistral": {
      "configured": false,
      "client_ready": false
    }
  },
  "system_info": {
    "uptime": "2d 14h 32m",
    "memory_usage": "245MB",
    "cpu_usage": "12%"
  }
}
```

### API Configuration

#### Endpoint
```http
GET /api/config
```

#### Response
```json
{
  "version": "2.0.0",
  "features": {
    "chat": true,
    "document_analysis": true,
    "legal_research": true,
    "multi_llm": true
  },
  "limits": {
    "max_file_size": "10MB",
    "max_message_length": 4000,
    "rate_limit": "100/hour"
  },
  "supported_formats": ["pdf", "docx", "txt"],
  "available_providers": ["openai", "gemini", "mistral"]
}
```

---

## 🚨 Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req-123456"
  }
}
```

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |
| `503` | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `INVALID_API_KEY` | API key is missing or invalid | Check API key configuration |
| `PROVIDER_UNAVAILABLE` | AI provider is not available | Verify provider setup and API keys |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit | Reduce file size or compress |
| `UNSUPPORTED_FORMAT` | File format not supported | Use supported formats (PDF, DOCX, TXT) |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before making more requests |
| `INSUFFICIENT_CREDITS` | AI provider credits exhausted | Check provider account balance |

---

## 📝 Request/Response Examples

### Complete Chat Interaction

#### 1. Send Initial Message
```bash
curl -X POST "http://localhost:9002/api/chat/send" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I need help reviewing a lease agreement",
    "provider": "auto"
  }'
```

#### 2. Follow-up with Document Context
```bash
curl -X POST "http://localhost:9002/api/chat/send" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What are the key risks in this lease?",
    "provider": "openai",
    "context": {
      "document_ids": ["doc-456"],
      "conversation_id": "conv-123"
    }
  }'
```

### Document Upload and Analysis Workflow

#### 1. Upload Document
```bash
curl -X POST "http://localhost:9002/api/documents/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@contract.pdf" \
  -F "title=Employment Contract" \
  -F "description=Contract for review"
```

#### 2. Analyze Document
```bash
curl -X POST "http://localhost:9002/api/documents/doc-456/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_type": "full",
    "provider": "openai"
  }'
```

---

## 🧪 Testing Guide

### Using cURL

#### Test Health Endpoint
```bash
curl -X GET "http://localhost:9002/api/health"
```

#### Test Authentication
```bash
# Login
curl -X POST "http://localhost:9002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }'

# Use token
curl -X GET "http://localhost:9002/api/chat/history" \
  -H "Authorization: Bearer <your-token>"
```

### Using HTTPie

#### Send Chat Message
```bash
http POST localhost:9002/api/chat/send \
  Authorization:"Bearer <token>" \
  content="What is contract law?" \
  provider="auto"
```

#### Upload Document
```bash
http --form POST localhost:9002/api/documents/upload \
  Authorization:"Bearer <token>" \
  title="Test Document" \
  file@document.pdf
```

### Using Postman

1. **Import Collection**: Use the OpenAPI specification to generate a Postman collection
2. **Set Environment Variables**:
   - `base_url`: `http://localhost:9002/api`
   - `auth_token`: Your JWT token
3. **Test Endpoints**: Use the pre-configured requests

### Interactive API Documentation

Visit the interactive API documentation at:
- **Swagger UI**: `http://localhost:9002/docs`
- **ReDoc**: `http://localhost:9002/redoc`
- **OpenAPI Spec**: `http://localhost:9002/openapi.json`

---

## 🔧 Rate Limiting

### Default Limits
- **Chat Messages**: 100 requests per hour per user
- **Document Upload**: 20 uploads per hour per user
- **Legal Queries**: 50 requests per hour per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## 🌐 API Versioning

### Current Version
- **Version**: `v1`
- **Base Path**: `/api/v1/` (optional, defaults to `/api/`)

### Version Headers
```http
API-Version: 1.0
Accept-Version: 1.0
```

---

## 📞 Support & Resources

### Documentation Links
- **Setup Guide**: [README.md](README.md)
- **Frontend Integration**: [Frontend Documentation](frontend/README.md)
- **Deployment Guide**: [Deployment Section](README.md#deployment)

### Community & Support
- **GitHub Issues**: [Report Issues](https://github.com/yourusername/private-lawyer-bot/issues)
- **Discussions**: [Community Forum](https://github.com/yourusername/private-lawyer-bot/discussions)
- **Email Support**: support@privatelawyer.bot

---

<div align="center">

**Made with ❤️ for the legal community**

![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)
![API Status](https://img.shields.io/badge/API-Active-10b981?style=for-the-badge)

</div>