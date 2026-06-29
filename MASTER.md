# MASTER.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This file is the single entry point for AI coding agents (Codex / Claude Code / other LLM tools).

It summarizes the entire system into one structured reference.

If any contradiction exists between documents, this file is NOT the source of truth.  
The detailed docs in `/docs` always take precedence.

---

# 2. System Overview

HR Daily AI is a structured AI-assisted recruiting operations system.

It transforms daily recruiting activity into:

- structured logs
- performance analytics
- AI-driven insights
- next-day planning
- reusable knowledge

---

# 3. Core Modules

## 3.1 Daily Log

Records structured recruiting activity:

- resume count
- screening count
- phone count
- interview count
- offer count
- entry count
- qualitative notes

---

## 3.2 Dashboard

Aggregates recruiting performance:

- KPI summary
- funnel conversion
- time-based trends

---

## 3.3 AI Review

Analyzes daily performance:

- summary
- strengths
- weaknesses
- suggestions
- score (0-100)

---

## 3.4 Tomorrow Planner

Generates next-day plan:

- time-based schedule
- priority tasks
- goals
- risks
- expected outcomes

---

## 3.5 Knowledge Base

Stores reusable HR knowledge:

- templates
- experience insights
- position-specific notes
- general HR rules

---

# 4. System Architecture

```text
UI
 ->
API Routes
 ->
Service Layer
 ->
Repository Layer
 ->
Prisma ORM
 ->
PostgreSQL
```

AI Flow:

```text
Service Layer
 ->
Prompt Builder
 ->
OpenAI API
 ->
JSON Parser
 ->
Validation
 ->
Database
```

---

# 5. Technology Stack

- Next.js 15 (App Router)
- React 18+
- TypeScript strict mode
- TailwindCSS
- shadcn/ui
- Node.js 20+
- PostgreSQL 16+
- Prisma ORM
- OpenAI API
- Docker + Docker Compose
- GitHub Actions (CI)

---

# 6. AI System Rules

- AI is backend-only
- All AI calls must go through the Service Layer
- All outputs MUST be structured JSON
- All prompts are externalized in `/prompts`
- AI responses MUST be validated before storage
- AI-generated records MUST store trace fields
- No AI calls in UI layer
- No AI calls directly in API routes

---

# 7. Data Model Summary

Core entities:

- RecruitLog
- DailyReview
- DailyPlan
- Knowledge

Relationships:

- RecruitLog -> DailyReview (1:1)
- RecruitLog -> DailyPlan (optional source relation)
- DailyReview -> DailyPlan (optional source relation)
- DailyReview -> Knowledge (optional source relation)
- DailyPlan -> Knowledge (optional source relation)

AI trace fields for generated records:

- provider
- model
- promptFile
- promptVersion
- inputHash
- rawOutput
- parsedOutput

---

# 8. API Summary

Core endpoints:

- `/api/log`
- `/api/dashboard/*`
- `/api/review/*`
- `/api/planner/*`
- `/api/knowledge/*`

Rules:

- API must be thin
- All logic must go through Service Layer
- Standard JSON response format is required
- API routes must not access Prisma directly
- API routes must not call AI providers directly

---

# 9. Development Rules (Critical)

- Strict layered architecture
- No business logic in UI/API
- No direct Prisma in UI
- No direct Prisma in Service Layer
- No inline prompts
- No unstructured AI output usage
- Feature isolation required
- Every completed task must be independently commit-ready
- Every feature must support Docker
- Every feature must pass ESLint and TypeScript

---

# 10. Deployment Model

Deployment target:

- Docker Compose only in V1
- PostgreSQL + Next.js containerized
- No cloud deployment requirement in V1

Canonical one-command startup from repository root:

```bash
docker compose up --build
```

Stop the Docker environment:

```bash
docker compose down
```

---

# 11. Workflow Summary

Daily usage flow:

1. Create log
2. Store structured data
3. Generate AI review
4. Generate next-day plan
5. Extract knowledge
6. View dashboard

---

# 12. Codex Execution Strategy

When using Codex:

## Step 1

Read `AGENTS.md` and `MASTER.md` first.

## Step 2

Read all files in `/docs` before making changes.

Recommended order:

1. `00_PROJECT.md`
2. `01_PRODUCT_SPEC.md`
3. `02_TECH_STACK.md`
4. `03_ARCHITECTURE.md`
5. `04_FOLDER_STRUCTURE.md`
6. `05_DATABASE.md`
7. `06_API.md`
8. `07_AI_DESIGN.md`
9. `08_PROMPT_DESIGN.md`
10. `09_UI_SPEC.md`
11. `10_DEPLOYMENT.md`
12. `11_DEVELOPMENT_RULES.md`
13. `12_TEST_PLAN.md`
14. `13_ROADMAP.md`

## Step 3

Implement task files incrementally.

## Step 4

Stop and ask for clarification if requirements conflict.

---

# 13. Non-Goals (V1)

- Multi-user system
- Authentication
- External integrations
- Real-time collaboration
- Advanced AI agents
- Microservices architecture
- Multi-tenant architecture
- Cloud deployment

---

# 14. Success Definition

System is successful if:

- User can log daily HR activity in < 2 minutes
- AI generates usable review without edits (>70% usefulness)
- Planner is actionable without manual rewrite
- System runs fully in Docker without setup issues
- Lint, typecheck, and build pass

---

# 15. Final Note

This system is intentionally simple in infrastructure, but AI-heavy in functionality.

Complexity is shifted from architecture to the AI reasoning layer.
