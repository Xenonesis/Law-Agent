# 🚀 API Quick Reference

<div align="center">

![Quick Reference](https://img.shields.io/badge/API-Quick_Reference-ff6b35?style=for-the-badge&logo=lightning&logoColor=white)

**Essential endpoints for rapid development**

</div>

## 🔗 Base URL
```
http://localhost:9002/api
```

## 🔑 Authentication
```http
Authorization: Bearer <your-jwt-token>
```

---

## 💬 Chat Endpoints

### Send Message
```http
POST /chat/send
{
  "content": "Your message here",
  "provider": "auto|openai|gemini|mistral"
}
```

### Get History
```http
GET /chat/history?limit=50
```

---

## 📄 Document Endpoints

### Upload Document
```http
POST /documents/upload
Content-Type: multipart/form-data

file: <binary-data>
title: "Document Title"
description: "Optional description"
```

### List Documents
```http
GET /documents/list
```

### Analyze Document
```http
POST /documents/{id}/analyze
{
  "analysis_type": "full|summary|entities",
  "provider": "openai|gemini|mistral"
}
```

---

## 🔍 Legal Research

### Legal Query
```http
POST /legal/query
{
  "question": "Your legal question",
  "jurisdiction": "US-CA",
  "legal_area": "contract_law"
}
```

### Case Law Search
```http
POST /legal/case-law
{
  "keywords": ["contract", "breach"],
  "jurisdiction": "US-CA",
  "year_range": [2020, 2024]
}
```

---

## 📊 System Endpoints

### Health Check
```http
GET /health
```

### Dashboard Stats
```http
GET /dashboard/stats
```

---

## 🚨 Common Responses

### Success Response
```json
{
  "message": "Response content",
  "provider": "openai",
  "confidence": 0.95
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## 🧪 Quick Test Commands

### Test Health
```bash
curl http://localhost:9002/api/health
```

### Test Chat
```bash
curl -X POST http://localhost:9002/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, what is contract law?"}'
```

### Test with Authentication
```bash
curl -X GET http://localhost:9002/api/chat/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

For complete documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)