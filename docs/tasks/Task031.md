# Task031 - Unit Tests for Core Services

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Add minimal unit tests for core service logic.

After this task, the most important non-UI business logic must have basic automated test coverage.

---

# Context

Task030 standardized UI states.

Task031 introduces lightweight service-level testing for safer future iteration.

---

# Requirements

Set up unit testing and add tests for:

- Log validation
- KPI calculation
- AI JSON parsing
- Config validation
- Knowledge validation

---

# Files To Create or Modify

```text
vitest.config.ts
src/utils/logValidation.test.ts
src/utils/kpi.test.ts
src/ai/parser/jsonParser.test.ts
src/utils/configValidation.test.ts
src/utils/knowledgeValidation.test.ts
package.json
```

---

# Testing Framework

Use:

- Vitest

---

# Package Scripts

Add:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

# Test Scope

## Must Test

- valid log input passes
- negative numeric log input fails
- KPI rates calculate correctly
- invalid JSON is rejected
- valid JSON is parsed correctly
- missing required config is detected
- invalid knowledge type is rejected

---

# Do NOT

Do NOT:

- add full E2E tests
- add Playwright
- add Cypress
- test every UI component
- mock OpenAI API in detail
- add external testing services

---

# Acceptance Criteria

- Vitest is installed and configured
- `npm run test` works
- Core utility tests pass
- Tests are deterministic
- No network calls during tests
- No real database connection required for unit tests
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run test`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `docker compose up --build`

all succeed.
