# Task023 - Markdown Export

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create Markdown export functionality.

After this task, the user must be able to export daily logs, AI reviews, and tomorrow plans as Markdown text.

---

# Context

Task022 created Global Search.

Task023 adds lightweight export capability for daily HR reporting and personal archiving.

V1 only supports Markdown export. PDF export is out of scope.

---

# Requirements

Implement:

- Export service
- Export API
- Export UI actions
- Markdown formatter utilities

---

# Files To Create or Modify

```text
src/services/export.service.ts
src/app/api/export/daily/route.ts
src/utils/markdownExport.ts
src/types/export.ts
src/app/log/page.tsx
src/app/review/page.tsx
src/app/planner/page.tsx
```

---

# Export Scope

The system must support exporting:

- Daily Log
- AI Review
- Tomorrow Plan

---

# API Endpoint

```http
GET /api/export/daily?date=2026-01-01
```

---

# Response Shape

```json
{
  "success": true,
  "data": {
    "date": "2026-01-01",
    "markdown": "# HR Daily Report\n\n..."
  },
  "error": null
}
```

---

# Markdown Content Structure

The exported Markdown should include:

# HR Daily Report

## Date

## Daily Log

## KPI Summary

## AI Review

## Tomorrow Plan

---

# UI Requirements

Add export button to:

- `/log`
- `/review`
- `/planner`

Button behavior:

- call export API
- copy Markdown to clipboard
- show success toast

---

# Do NOT

Do NOT:

- implement PDF export
- implement Word export
- implement file download
- implement cloud storage
- implement email sending
- add authentication

---

# Acceptance Criteria

- Daily report can be exported as Markdown
- Export includes log data
- Export includes AI review if available
- Export includes tomorrow plan if available
- Markdown can be copied to clipboard
- Missing review/plan handled gracefully
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
