# 04_FOLDER_STRUCTURE.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the official folder structure for the HR Daily AI project.

All code MUST follow this structure.

No alternative or ad-hoc folder organization is allowed in V1.

---

# 2. Root Structure

```text
hr-daily-ai/
│
├── src/
├── prisma/
├── docs/
├── prompts/
├── docker/
├── public/
├── .github/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
├── MASTER.md
├── AGENTS.md
├── package.json
└── tsconfig.json
```

---

# 3. Source Code Structure (src/)

```text
src/
│
├── app/                     # Next.js App Router
├── features/                # Feature-based modules
├── services/                # Business logic layer
├── repositories/            # Database access layer
├── ai/                      # AI integration layer
├── lib/                     # Shared libraries
├── config/                  # Configuration files
├── types/                   # Global TypeScript types
├── utils/                   # Utility functions
├── hooks/                   # Custom React hooks
└── styles/                  # Global styles
```

---

# 4. App Router Structure (src/app)

```text
src/app/
│
├── layout.tsx
├── page.tsx
│
├── api/
│   ├── log/
│   ├── dashboard/
│   ├── review/
│   ├── planner/
│   └── knowledge/
```

Rules:

- API routes must be thin
- No business logic inside API layer

---

# 5. Feature-Based Structure (src/features)

Each feature is self-contained.

```text
src/features/
│
├── log/
├── dashboard/
├── review/
├── planner/
├── knowledge/
```

Each feature MUST include:

```text
feature/
│
├── components/
├── hooks/
├── pages/
├── services/
├── types/
└── utils/
```

Rules:

- Feature should be independently understandable
- No cross-feature direct imports unless via shared services/types

---

# 6. Services Layer (src/services)

```text
src/services/
│
├── log.service.ts
├── dashboard.service.ts
├── review.service.ts
├── planner.service.ts
├── knowledge.service.ts
├── ai.service.ts
```

Responsibilities:

- Business logic
- Data aggregation
- AI orchestration
- Cross-repository coordination

---

# 7. Repository Layer (src/repositories)

```text
src/repositories/
│
├── log.repository.ts
├── review.repository.ts
├── planner.repository.ts
├── knowledge.repository.ts
```

Responsibilities:

- Direct database access only
- CRUD operations
- Prisma queries

Rules:

- No business logic allowed
- No AI logic allowed

---

# 8. AI Layer (src/ai)

```text
src/ai/
│
├── provider/
│   ├── openai.ts
│
├── promptBuilder.ts
├── promptLoader.ts
│
├── parser/
│   ├── jsonParser.ts
│
├── schemas/
│   ├── review.schema.ts
│   ├── planner.schema.ts
│
└── ai.service.ts
```

Responsibilities:

- Prompt loading from `/prompts`
- Prompt building
- AI API calls
- Response parsing
- Schema validation

Rules:

- Prompt content must live in `/prompts` as Markdown files
- No inline prompt strings in code

---

# 9. Shared Libraries (src/lib)

```text
src/lib/
│
├── prisma.ts
├── logger.ts
├── date.ts
├── constants.ts
```

Rules:

- Pure reusable infrastructure code only
- No business logic

---

# 10. Configuration (src/config)

```text
src/config/
│
├── env.ts
├── ai.config.ts
├── app.config.ts
```

Responsibilities:

- Environment variables
- App-level configuration
- AI configuration

---

# 11. Types (src/types)

```text
src/types/
│
├── log.ts
├── review.ts
├── planner.ts
├── knowledge.ts
├── api.ts
```

Rules:

- Shared TypeScript interfaces
- No implementation logic

---

# 12. Utils (src/utils)

```text
src/utils/
│
├── format.ts
├── validation.ts
├── calculate.ts
```

Rules:

- Pure functions only
- No side effects

---

# 13. Prisma Structure

```text
prisma/
│
├── schema.prisma
├── migrations/
└── seed.ts
```

Rules:

- All database schema changes must go through Prisma migrations
- No manual DB modification allowed

---

# 14. Prompts Structure

```text
prompts/
│
├── review.md
├── planner.md
├── knowledge.md
```

Rules:

- All AI prompts must be externalized
- All AI prompts must be Markdown files
- No inline prompt strings in code

---

# 15. Docker Structure

```text
docker/
│
├── Dockerfile
└── .dockerignore
```

---

# 16. GitHub Structure

```text
.github/
│
├── workflows/
│   ├── ci.yml
```

CI responsibilities:

- Lint check
- Type check
- Build verification

---

# 17. Key Architectural Rules

## 17.1 Dependency Rule

```text
UI → Feature → Service → Repository → Prisma → DB
```

Strictly enforced.

## 17.2 Forbidden Imports

- UI cannot import repositories directly
- UI cannot access Prisma
- API cannot contain business logic
- AI cannot be called from UI

## 17.3 Feature Isolation Rule

Each feature must be:

- Self-contained
- Replaceable
- Independently testable

---

# 18. Summary

This structure enforces:

- Predictable code organization
- AI-friendly architecture
- Strict separation of concerns
- Long-term maintainability
- Scalability beyond V1
