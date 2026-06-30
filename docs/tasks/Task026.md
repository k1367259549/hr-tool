# Task026 - Logging and Audit

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a lightweight logging and audit system.

After this task, the system must be able to record important AI and system events for debugging and future cost analysis.

---

# Context

Task025 created centralized configuration.

Task026 adds observability for AI calls, errors, and important backend operations.

---

# Requirements

Create:

- Logger utility
- AI request logging
- Error logging
- Basic audit records for AI operations

---

# Files To Create or Modify

```text
src/lib/logger.ts
src/services/audit.service.ts
src/repositories/aiRequestLog.repository.ts
src/types/audit.ts
prisma/schema.prisma
```

---

# Database Model

Add model:

```prisma
model AIRequestLog {
  id           String   @id @default(uuid())
  feature      String
  model        String
  promptTokens Int?
  outputTokens Int?
  totalTokens  Int?
  latencyMs    Int?
  success      Boolean
  errorMessage String?
  createdAt    DateTime @default(now())
}
```

---

# Logger Requirements

Logger must support:

- info
- warn
- error

Rules:

- Do not log secrets
- Do not log full API keys
- Do not log full DATABASE_URL
- AI prompt logging is disabled in V1

---

# AI Request Logging

For each AI call, log:

- feature
- model
- token usage if available
- latency
- success/failure
- error message if failed

---

# Integration Requirements

Integrate logging with:

- AI Service
- OpenAI Provider
- Review generation
- Planner generation
- Knowledge extraction

---

# Do NOT

Do NOT:

- add external logging service
- add Sentry
- add OpenTelemetry
- log full prompts
- log secrets
- create admin dashboard
- add authentication

---

# Acceptance Criteria

- AIRequestLog model exists
- Migration succeeds
- AI calls create log records
- AI failures create failed log records
- Logger utility works
- No secrets are logged
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npx prisma migrate dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `docker compose up --build`

all succeed.
