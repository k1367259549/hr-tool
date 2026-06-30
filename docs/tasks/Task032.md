# Task032 - API Integration Tests

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Add minimal integration tests for critical API routes.

After this task, the most important backend workflows must be verifiable through automated tests.

---

# Context

Task031 added unit tests for core service utilities.

Task032 focuses on API-level correctness.

---

# Requirements

Create integration tests for:

- RecruitLog API
- Dashboard summary API
- AI Review API error handling
- Knowledge API

---

# Files To Create or Modify

```text
tests/api/log.test.ts
tests/api/dashboard.test.ts
tests/api/review.test.ts
tests/api/knowledge.test.ts
tests/setup/testDb.ts
vitest.config.ts
package.json
```

---

# Test Scope

## Must Test

- POST /api/log
- GET /api/log
- PUT /api/log/:id
- DELETE /api/log/:id
- GET /api/dashboard/summary
- POST /api/knowledge
- GET /api/knowledge

---

# AI Test Rule

Do not call real OpenAI API during tests.

Mock AI service for review API tests.

---

# Database Test Rule

Use a test database or mocked repository layer.

Do not run tests against production or development database.

---

# Required Scripts

Add if missing:

```json
{
  "test:api": "vitest run tests/api"
}
```

---

# Do NOT

Do NOT:

- call real OpenAI API
- require real API keys
- run tests against production DB
- add E2E browser tests
- add Playwright or Cypress

---

# Acceptance Criteria

- API tests run successfully
- Critical API routes are covered
- AI API tests use mock service
- Test DB setup is isolated
- No real secrets required
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run test`
- `npm run test:api`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

all succeed.
