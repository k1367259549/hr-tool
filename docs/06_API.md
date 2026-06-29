# 06_API.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines all backend API endpoints for HR Daily AI V1.

All APIs MUST follow:

- REST principles
- JSON request/response format
- Service layer architecture
- No business logic in route handlers

---

# 2. Global API Rules

## 2.1 Base URL

```text
/api/*
```

---

## 2.2 Response Format

All successful APIs MUST return:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

All failed APIs MUST return:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## 2.3 HTTP Methods

- GET -> read
- POST -> create / trigger actions
- PUT -> update
- DELETE -> remove

---

## 2.4 Rules

- No Prisma calls in API layer
- All logic goes through Service Layer
- AI must NOT be called in API layer directly
- API must be thin
- API routes validate request shape before calling services
- API routes must not expose raw internal errors

---

# 3. Modules Overview

- RecruitLog API
- Dashboard API
- AI Review API
- Planner API
- Knowledge API

---

# 4. RecruitLog API

## 4.1 Get Logs

```http
GET /api/log
```

Query parameters:

- date (optional)
- limit (optional)

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2026-01-01",
      "resumeCount": 10
    }
  ],
  "error": null
}
```

## 4.2 Get Single Log

```http
GET /api/log/:date
```

## 4.3 Create Log

```http
POST /api/log
```

Request:

```json
{
  "date": "2026-01-01",
  "position": "Frontend Engineer",
  "resumeCount": 10
}
```

## 4.4 Update Log

```http
PUT /api/log/:id
```

## 4.5 Delete Log

```http
DELETE /api/log/:id
```

---

# 5. Dashboard API

## 5.1 Get KPI Summary

```http
GET /api/dashboard/summary
```

Response:

```json
{
  "success": true,
  "data": {
    "today": {
      "resumeCount": 10,
      "interviewCount": 2
    },
    "week": {},
    "month": {}
  },
  "error": null
}
```

## 5.2 Get Trends

```http
GET /api/dashboard/trends
```

---

# 6. AI Review API

## 6.1 Generate Review

```http
POST /api/review/generate
```

Request:

```json
{
  "date": "2026-01-01"
}
```

Behavior:

- Fetch RecruitLog through ReviewService
- Call AI Service through ReviewService
- Parse JSON output
- Validate parsed output
- Save DailyReview with AI trace fields
- Return review summary

Response:

```json
{
  "success": true,
  "data": {
    "summary": "...",
    "score": 85
  },
  "error": null
}
```

Rules:

- Route handler must not call OpenAI directly
- Route handler must not build prompts
- Route handler must not access Prisma
- If a review already exists for the date, Service Layer must handle idempotency or return a controlled error

## 6.2 Get Review

```http
GET /api/review/:date
```

---

# 7. Planner API

## 7.1 Generate Plan

```http
POST /api/planner/generate
```

Request:

```json
{
  "date": "2026-01-02"
}
```

Behavior:

- Read latest log and review through PlannerService
- Call AI Service through PlannerService
- Parse JSON output
- Validate parsed output
- Save DailyPlan with AI trace fields
- Return generated plan

Rules:

- Route handler must not call OpenAI directly
- Route handler must not build prompts
- Route handler must not access Prisma
- If a plan already exists for the date, Service Layer must handle idempotency or return a controlled error

## 7.2 Get Plan

```http
GET /api/planner/:date
```

---

# 8. Knowledge API

## 8.1 Get Knowledge List

```http
GET /api/knowledge
```

Query parameters:

- type (optional)
- tag (optional)

## 8.2 Create Knowledge

```http
POST /api/knowledge
```

Request:

```json
{
  "title": "Interview Tip",
  "content": "....",
  "type": "EXPERIENCE",
  "tags": ["interview"]
}
```

## 8.3 Update Knowledge

```http
PUT /api/knowledge/:id
```

Notes:

- User-created knowledge may be updated.
- AI-generated knowledge must preserve AI trace fields.

## 8.4 Delete Knowledge

```http
DELETE /api/knowledge/:id
```

---

# 9. AI Internal API Flow

## 9.1 Review Flow

```text
API -> Service -> AI Service -> OpenAI -> Parser -> DB
```

## 9.2 Planner Flow

```text
API -> Service -> AI Service -> OpenAI -> Parser -> DB
```

## 9.3 Knowledge Extraction Flow

```text
API -> Service -> AI Service -> OpenAI -> Parser -> DB
```

---

# 10. Error Codes

| Code | Meaning |
| --- | --- |
| LOG_NOT_FOUND | Log not found |
| REVIEW_NOT_FOUND | Review not found |
| PLAN_NOT_FOUND | Plan not found |
| KNOWLEDGE_NOT_FOUND | Knowledge entry not found |
| AI_ERROR | AI generation failed |
| VALIDATION_ERROR | Invalid input |
| DB_ERROR | Database failure |
| CONFLICT_ERROR | Resource already exists or conflicts with current state |

---

# 11. Validation Rules

- date must be valid ISO format
- numeric fields must be >= 0
- required fields must not be null
- enum values must match documented database enums
- AI outputs must be parsed and validated before saving

---

# 12. Performance Rules

- API response (non-AI): < 300ms
- AI APIs: async, timeout handled
- No blocking UI requests
- AI failure must not block core log creation

---

# 13. Security Rules

- No authentication required in V1
- API must not expose internal errors
- Environment variables only for secrets
- API must never return `OPENAI_API_KEY`
- Frontend must never call AI provider APIs directly

---

# 14. Out of Scope

- Authentication APIs
- User management APIs
- Multi-tenant APIs
- Webhook integrations
- External ATS APIs

---

# 15. Summary

This API layer is designed to:

- Be thin and predictable
- Fully service-driven
- AI-safe (no direct AI calls in routes)
- Easy for Codex to implement step-by-step
