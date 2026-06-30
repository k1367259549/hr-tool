# Task021 - Prompt Management Foundation

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a prompt management foundation for the AI system.

After this task, prompts must be easier to inspect, validate, and maintain.

---

# Context

Task011 created basic prompt loading.

Task021 improves prompt maintainability without adding a full prompt editor.

V1 prompt management is read-only from the UI.

---

# Requirements

Create:

- Prompt metadata reader
- Prompt status API
- Prompt status UI section
- Prompt validation utility

---

# Files To Create or Modify

```text
src/services/prompt.service.ts
src/app/api/prompts/status/route.ts
src/types/prompt.ts
src/utils/promptValidation.ts
src/app/settings/page.tsx
```

---

# Prompt Files

Required prompt files:

- `prompts/review.md`
- `prompts/planner.md`
- `prompts/knowledge.md`

---

# Prompt Status API

## Endpoint

```http
GET /api/prompts/status
```

Response example:

```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "name": "review",
        "path": "prompts/review.md",
        "exists": true,
        "valid": true,
        "hasInputPlaceholder": true
      }
    ]
  },
  "error": null
}
```

---

# Validation Rules

Each prompt must:

- exist
- include `{{INPUT}}`
- instruct JSON-only output
- not be empty

---

# UI Requirement

Add a section to Settings page:

Prompt Status

Display:

- prompt name
- existence status
- validation status
- missing placeholder warning

---

# Do NOT

Do NOT:

- create editable prompt editor
- store prompts in database
- modify AI generation behavior
- add version control UI
- add authentication

---

# Acceptance Criteria

- Prompt status API works
- Settings page shows prompt status
- Missing prompt is handled gracefully
- Invalid prompt is shown as invalid
- No secret values are exposed
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
