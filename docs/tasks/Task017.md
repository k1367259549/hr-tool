# Task017 - Knowledge Base Page

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the Knowledge Base page.

After this task, the user must be able to create, view, search, filter, edit, and delete knowledge entries from the UI.

---

# Context

Task016 implemented the Knowledge backend.

Task017 connects the Knowledge UI to the backend API.

---

# Requirements

Implement the page:

```text
/knowledge
```

---

# Page Functions

The page must support:

- Create knowledge entry
- View knowledge list
- Search by keyword
- Filter by type
- Filter by tag
- Edit knowledge entry
- Delete knowledge entry

---

# Files To Create or Modify

```text
src/app/knowledge/page.tsx
src/features/knowledge/components/KnowledgeForm.tsx
src/features/knowledge/components/KnowledgeList.tsx
src/features/knowledge/components/KnowledgeItem.tsx
src/features/knowledge/components/KnowledgeFilters.tsx
src/features/knowledge/hooks/useKnowledge.ts
src/types/knowledge.ts
```

---

# UI Sections

The page must include:

- Search input
- Type filter
- Tag filter
- Create button
- Knowledge list
- Edit dialog
- Delete confirmation

---

# Knowledge Types

Display supported types:

- EXPERIENCE
- TEMPLATE
- POSITION
- NOTE

---

# API Integration

Use:

- `GET /api/knowledge`
- `POST /api/knowledge`
- `GET /api/knowledge/:id`
- `PUT /api/knowledge/:id`
- `DELETE /api/knowledge/:id`

---

# Do NOT

Do NOT:

- implement AI knowledge extraction
- modify Review
- modify Planner
- call OpenAI directly from frontend
- add authentication

---

# Acceptance Criteria

- User can create knowledge entry
- User can view knowledge list
- User can search entries
- User can filter by type
- User can filter by tag
- User can edit entry
- User can delete entry
- Empty state works
- Loading state works
- Error state works
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
