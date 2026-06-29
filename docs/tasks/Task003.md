# Task003 - PostgreSQL + Prisma Setup

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Configure Prisma and connect the application to PostgreSQL.

After this task, the database foundation must be ready for feature development.

---

# Context

Task002 created the Docker environment with PostgreSQL.

Task003 focuses only on Prisma configuration and initial database models.

---

# Requirements

Use:

- PostgreSQL
- Prisma ORM
- Prisma Client

---

# Implementation Decision

This task follows the complete database design in `/docs/05_DATABASE.md`.

Where the original task draft conflicts with `/docs/05_DATABASE.md`, the detailed docs take precedence.

---

# Files To Create or Modify

```text
prisma/schema.prisma
prisma/seed.ts
src/lib/prisma.ts
.env.example
package.json
```

---

# Do NOT

Do NOT:

- create API routes
- create UI pages
- implement AI logic
- add authentication
- add user table

---

# Definition of Done

Task is complete when:

- `npx prisma generate` succeeds
- `npx prisma migrate dev` succeeds
- `npm run build` succeeds
