# Task022 - Global Search

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a simple global search feature.

After this task, the user must be able to search across RecruitLog and Knowledge records.

---

# Context

Task021 created the prompt management foundation.

Task022 improves daily usability by allowing the user to quickly find past logs and knowledge entries.

---

# Requirements

Implement:

- Search API
- Search service
- Search UI page
- Sidebar navigation item

---

# Files To Create or Modify

```text
src/app/search/page.tsx
src/app/api/search/route.ts
src/services/search.service.ts
src/types/search.ts
src/components/layout/Sidebar.tsx
```

---

# Search Scope

Search must include:

- RecruitLog.summary
- RecruitLog.problems
- RecruitLog.reflection
- RecruitLog.position

- Knowledge.title
- Knowledge.content
- Knowledge.tags

---

# API Endpoint

```http
GET /api/search?q=keyword
```

---

# Response Shape

```json
{
  "success": true,
  "data": {
    "query": "interview",
    "results": [
      {
        "id": "uuid",
        "type": "RecruitLog",
        "title": "2026-01-01 Recruiting Log",
        "content": "summary preview",
        "url": "/log"
      },
      {
        "id": "uuid",
        "type": "Knowledge",
        "title": "Interview Follow-up Template",
        "content": "content preview",
        "url": "/knowledge"
      }
    ]
  },
  "error": null
}
```

---

# UI Requirements

Create page:

```text
/search
```

The page must include:

- Search input
- Search button
- Results list
- Empty state
- Loading state
- Error state

---

# Search Rules

- Empty query returns empty result list
- Query must be trimmed
- Search should be case-insensitive where possible
- Results should include short preview text
- V1 search can be simple database text search

---

# Do NOT

Do NOT:

- implement vector search
- implement embeddings
- implement RAG
- implement fuzzy search engine
- add external search service
- modify AI pipeline
- add authentication

---

# Acceptance Criteria

- User can search logs
- User can search knowledge
- Empty search is handled
- No results state works
- Results display type, title, and preview
- Sidebar includes Search
- API follows standard response format
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
