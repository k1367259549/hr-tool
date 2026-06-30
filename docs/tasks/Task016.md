# Task016 - Knowledge Backend

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Implement the backend for the Knowledge Base module.

After this task, the system must be able to create, read, filter, update, and delete knowledge entries.

---

# Context

Task015 completed the Tomorrow Planner page.

Task016 implements backend support for reusable HR knowledge.

---

# Requirements

Create:

- Knowledge repository
- Knowledge service
- Knowledge API
- Knowledge validation

---

# Files To Create

```text
src/repositories/knowledge.repository.ts
src/services/knowledge.service.ts
src/app/api/knowledge/route.ts
src/app/api/knowledge/[id]/route.ts
src/types/knowledge.ts
src/utils/knowledgeValidation.ts
```

---

# API Endpoints

## Get Knowledge List

```http
GET /api/knowledge
```

Optional query parameters:

- type
- tag
- keyword

## Create Knowledge

```http
POST /api/knowledge
```

Request:

```json
{
  "title": "Interview follow-up template",
  "content": "Send a follow-up message within 24 hours.",
  "type": "TEMPLATE",
  "source": "USER",
  "tags": ["interview", "follow-up"]
}
```

## Get Knowledge by ID

```http
GET /api/knowledge/:id
```

## Update Knowledge

```http
PUT /api/knowledge/:id
```

## Delete Knowledge

```http
DELETE /api/knowledge/:id
```

---

# Validation Rules

- title is required
- content is required
- type must be one of:
  - EXPERIENCE
  - TEMPLATE
  - POSITION
  - NOTE
- source must be one of:
  - USER
  - AI
- tags must be an array of strings

---

# Do NOT

Do NOT:

- implement Knowledge UI
- implement AI knowledge extraction
- modify Planner
- modify Review
- add authentication

---

# Acceptance Criteria

- Knowledge entries can be created
- Knowledge entries can be listed
- Knowledge entries can be filtered by type
- Knowledge entries can be filtered by tag
- Knowledge entries can be searched by keyword
- Knowledge entries can be updated
- Knowledge entries can be deleted
- API response follows standard format
- No direct Prisma usage in API routes
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `docker compose up --build`

all succeed.
