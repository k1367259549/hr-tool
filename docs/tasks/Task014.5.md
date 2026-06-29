# Task014.5 - Database Extensions

Version: V1.0
Status: TODO
Estimated Time: 1~2 hours

---

# Goal

Implement the V1 database extensions documented in `docs/05.5_DATABASE_EXTENSIONS.md`.

After this task, the database must support additional recruiting source metadata and AI request logging.

---

# Context

Task014 completed the Tomorrow Planner backend.

The database extension document was introduced after Task014, so this work is handled as an independent Task014.5 commit.

---

# Requirements

Create or modify:

- `docs/05.5_DATABASE_EXTENSIONS.md`
- `docs/tasks/Task014.5.md`
- `prisma/schema.prisma`
- `prisma/migrations/*`
- `src/types/log.ts`
- `src/utils/logValidation.ts`

---

# Database Changes

Extend `RecruitLog` with optional fields:

- `source`
- `channel`
- `roleType`
- `priority`

Add `AIRequestLog` model:

- `id`
- `feature`
- `model`
- `promptTokens`
- `outputTokens`
- `totalTokens`
- `latencyMs`
- `success`
- `errorMessage`
- `createdAt`

---

# Implementation Rules

- Use Prisma migration only
- Do not manually modify production database
- Do not create UI for these fields
- Do not wire AI request logging into OpenAI calls yet
- Do not implement cost calculation
- Do not add vector database, embeddings, RAG, or memory systems

---

# Acceptance Criteria

- Prisma schema includes RecruitLog extension fields
- Prisma schema includes AIRequestLog
- Migration is created
- Prisma Client generates successfully
- Existing TypeScript types compile
- Existing lint/build checks pass
- Docker build/start still works

---

# Definition of Done

Task is complete when:

- `npx prisma generate`
- `npx prisma migrate dev`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `docker compose up --build`

all succeed.
