# Task018 - AI Knowledge Extraction

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Implement AI-powered knowledge extraction.

After this task, the system must be able to extract reusable HR knowledge from RecruitLog and DailyReview data, then save it into the Knowledge Base.

---

# Context

Task017 completed the Knowledge Base page.

Task018 connects the existing AI infrastructure with the Knowledge module.

---

# Requirements

Create:

- Knowledge extraction service
- Knowledge extraction API
- Knowledge extraction schema validation

---

# Files To Create or Modify

```text
src/services/knowledgeExtraction.service.ts
src/app/api/knowledge/extract/route.ts
src/ai/schemas/knowledge.schema.ts
src/types/knowledge.ts
prompts/knowledge.md
```

---

# API Endpoint

## Extract Knowledge

```http
POST /api/knowledge/extract
```

Request:

```json
{
  "date": "2026-01-01"
}
```

Behavior:

- Find RecruitLog by date
- Find DailyReview by date if available
- Build prompt using `/prompts/knowledge.md`
- Call AI Service
- Parse JSON output
- Validate schema
- Save generated items into Knowledge table
- Return saved knowledge entries

---

# AI Output Schema

```json
{
  "items": [
    {
      "title": "string",
      "content": "string",
      "type": "EXPERIENCE",
      "tags": ["string"]
    }
  ]
}
```

---

# Validation Rules

- items must be an array
- title is required
- content is required
- type must be one of:
  - EXPERIENCE
  - TEMPLATE
  - POSITION
  - NOTE
- tags must be an array of strings
- source must be saved as AI

---

# Duplicate Handling

If AI generates knowledge with the same title:

- do not create exact duplicates
- either skip duplicate entries or update existing entries
- implementation must be deterministic

---

# Do NOT

Do NOT:

- implement advanced RAG
- implement vector database
- implement embeddings
- modify Planner
- modify Dashboard
- call OpenAI directly from frontend
- add authentication

---

# Acceptance Criteria

- Knowledge can be extracted by date
- AI-generated knowledge is saved to database
- Saved knowledge has source = AI
- Duplicate titles are handled
- Invalid AI JSON is rejected
- Missing log returns clear error
- API response follows standard format
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
