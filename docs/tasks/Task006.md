# Task006 - RecruitLog Repository and Service

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Create the backend data access and business logic layer for RecruitLog.

After this task, RecruitLog data operations should be available through Repository and Service layers.

---

# Context

Task003 created Prisma models.

Task006 prepares the backend logic for the Daily Log module.

No API routes or UI should be implemented in this task.

---

# Requirements

Create:

- RecruitLog repository
- RecruitLog service
- RecruitLog TypeScript types
- Basic validation utilities

---

# Files To Create

```text
src/repositories/log.repository.ts
src/services/log.service.ts
src/types/log.ts
src/utils/logValidation.ts
```

---

# Repository Requirements

The repository must support:

- create
- findMany
- findById
- findByDate
- update
- delete

Repository must use Prisma only.

---

# Service Requirements

The service must support:

- createLog
- getLogs
- getLogById
- getLogByDate
- updateLog
- deleteLog

Service must validate:

- date is required
- numeric fields must be >= 0

---

# Do NOT

Do NOT:

- create API routes
- create UI pages
- implement Dashboard
- implement AI logic
- bypass Repository layer

---

# Acceptance Criteria

- Repository compiles
- Service compiles
- Validation works
- No direct Prisma usage outside repository
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`

all succeed.
