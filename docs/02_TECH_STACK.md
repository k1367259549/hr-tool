# 02_TECH_STACK.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the official technology stack for HR Daily AI V1.

All implementation in this project MUST strictly follow this stack.

No alternative technologies are allowed in V1 unless explicitly updated in this document.

---

# 2. Frontend Stack

## 2.1 Core Framework

- Next.js 15 (App Router)
- React 18+
- TypeScript (strict mode enabled)

Rationale:
- Full-stack capability
- Server Actions support
- Strong ecosystem
- Compatible with AI coding agents

---

## 2.2 UI Layer

- TailwindCSS
- shadcn/ui
- Radix UI primitives (via shadcn)

Rationale:
- Rapid UI development
- Consistent design system
- Minimal custom CSS
- High maintainability

---

## 2.3 State Management

- React Server Components (primary)
- React hooks (local state only)

No external state library is used in V1.

---

## 2.4 Data Fetching

- Next.js Server Actions (preferred)
- Fetch API (fallback)
- No external client-side data libraries (e.g. React Query is NOT required in V1)

---

# 3. Backend Stack

## 3.1 Runtime

- Node.js 20+

## 3.2 API Layer

- Next.js Route Handlers (/app/api)
- Server Actions (preferred for internal logic)

---

## 3.3 Business Logic Layer

- Service Layer (mandatory)
- Repository Pattern (mandatory)

Architecture rule:

UI → API Route → Service → Repository → Database

---

# 4. Database Stack

## 4.1 Database

- PostgreSQL 16+

## 4.2 ORM

- Prisma ORM

---

## 4.3 Migration Strategy

- Prisma Migrate only
- No manual SQL schema changes in production

---

# 5. AI Stack

## 5.1 Primary Provider

- OpenAI API

## 5.2 Model Strategy

Default model usage:

- GPT-4.1 / GPT-5 class model (latest stable available)

---

## 5.3 AI Architecture

- AI calls are server-side only
- AI logic isolated in `/src/ai`
- Prompt templates stored in `/prompts`

---

## 5.4 AI Output Format

All AI outputs MUST follow structured JSON schema.

Unstructured text output is not allowed for core features.

---

# 6. Infrastructure Stack

## 6.1 Containerization

- Docker
- Docker Compose

Required services:

- app (Next.js)
- postgres (PostgreSQL)

---

## 6.2 Development Environment

- Local Docker environment (primary)
- Node.js local runtime (optional for debugging)

---

# 7. DevOps Stack

## 7.1 Version Control

- Git

## 7.2 Hosting

- GitHub (primary repository)

## 7.3 CI/CD

- GitHub Actions (basic pipeline)

Pipeline includes:

- lint
- typecheck
- build

---

# 8. Code Quality Tools

## 8.1 Linting

- ESLint (strict configuration)

## 8.2 Formatting

- Prettier

## 8.3 Type Safety

- TypeScript strict mode enabled

---

# 9. Project Constraints

## 9.1 Forbidden Technologies (V1)

The following are explicitly NOT allowed in V1:

- React Native
- Microservices architecture
- GraphQL
- Redis
- Kafka
- ElasticSearch
- Multi-database systems
- Complex state management libraries (Redux, Zustand not required)

---

## 9.2 Forbidden Patterns

- Direct Prisma usage inside React components
- Direct AI calls from frontend
- Business logic inside UI layer
- Hardcoded prompts inside code files
- Unstructured AI responses used directly without parsing

---

# 10. Environment Variables

Required environment variables:

- DATABASE_URL
- OPENAI_API_KEY

Optional:

- NODE_ENV
- NEXT_PUBLIC_APP_NAME (for UI display only)

---

# 11. Performance Targets

- Page load < 2s (local)
- API response < 300ms (excluding AI calls)
- AI response < 10s (target, depends on provider)

---

# 12. Deployment Target

- Docker Compose only in V1
- No cloud deployment requirement in V1

---

# 13. Summary

This stack prioritizes:

- Simplicity
- AI compatibility
- Fast iteration
- Maintainability
- Single-developer scalability

No enterprise-level complexity is introduced in V1.
