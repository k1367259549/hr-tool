# Task029 - Global Error Handling

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a consistent global error handling system.

After this task, API errors, UI errors, AI errors, and validation errors must follow unified handling rules.

---

# Context

Task028 implemented Monthly AI Review.

Task029 improves system stability and developer maintainability.

---

# Requirements

Create:

- Global API error handler
- Standard error codes
- Error boundary components
- AI error fallback handling
- Validation error formatter

---

# Files To Create or Modify

```text
src/utils/errors.ts
src/utils/apiResponse.ts
src/components/shared/ErrorBoundary.tsx
src/components/shared/ErrorState.tsx
src/types/error.ts
src/ai/ai.service.ts
src/app/layout.tsx
```

---

# Error Categories

Support:

- VALIDATION_ERROR
- NOT_FOUND
- DATABASE_ERROR
- AI_ERROR
- CONFIG_ERROR
- UNKNOWN_ERROR

---

# API Error Format

All failed API responses must follow:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AI_ERROR",
    "message": "AI generation failed."
  }
}
```

---

# UI Error Requirements

UI must show:

- Friendly message
- Retry option if possible
- No raw stack trace

---

# AI Error Requirements

AI errors must:

- not crash the app
- return clear message
- be logged by logger/audit system
- allow user retry

---

# Do NOT

Do NOT:

- expose internal stack traces to UI
- log secrets
- add external error tracking service
- add authentication
- rewrite existing APIs unnecessarily

---

# Acceptance Criteria

- API error responses are consistent
- UI errors are user-friendly
- AI errors do not crash pages
- Error boundaries work
- Validation errors are clear
- No raw internal errors exposed
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
