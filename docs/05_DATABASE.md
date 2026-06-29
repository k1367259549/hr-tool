# 05_DATABASE.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the complete database design for HR Daily AI V1.

It includes:

- Data models
- Relationships
- Constraints
- Prisma schema
- Index strategy (minimal for V1)

All database changes MUST go through Prisma migrations.

No manual database modification is allowed.

---

# 2. Database Overview

The system uses PostgreSQL as the only database.

V1 is a single-user system, so no multi-tenant design is required.

Core entities:

- RecruitLog
- DailyReview
- DailyPlan
- Knowledge

---

# 3. Data Model Overview

```text
RecruitLog
    ↓
DailyReview
    ↓
DailyPlan

Knowledge (independent, but may reference AI-generated insights)
```

---

# 4. Entity Definitions

## 4.1 RecruitLog

Purpose:

Stores daily recruiting activities.

Fields:

- id: UUID
- date: Date (unique)
- position: String (optional)
- resumeCount: Int
- screenCount: Int
- phoneCount: Int
- interviewCount: Int
- offerCount: Int
- entryCount: Int
- summary: Text
- problems: Text
- reflection: Text
- createdAt: DateTime
- updatedAt: DateTime

Constraints:

- date must be unique
- numeric fields default to 0
- numeric fields must be greater than or equal to 0

## 4.2 DailyReview

Purpose:

Stores AI analysis of a daily log.

Fields:

- id: UUID
- logId: UUID (FK -> RecruitLog, unique)
- summary: Text
- strengths: Json
- weaknesses: Json
- suggestions: Json
- score: Int (0-100)
- provider: String
- model: String
- promptFile: String
- promptVersion: String
- inputHash: String
- rawOutput: Json
- parsedOutput: Json
- createdAt: DateTime

Relationship:

- One RecruitLog -> One DailyReview

AI traceability:

- rawOutput stores the raw AI response payload
- parsedOutput stores the validated structured JSON
- inputHash identifies the exact input used for generation
- promptFile and promptVersion identify the prompt source

## 4.3 DailyPlan

Purpose:

Stores AI-generated next-day plan.

Fields:

- id: UUID
- date: Date
- logId: UUID (optional FK -> RecruitLog)
- reviewId: UUID (optional FK -> DailyReview)
- schedule: Json
- priorityTasks: Json
- goals: Json
- risks: Json
- expectedOutcomes: Json
- priority: ENUM (LOW / MEDIUM / HIGH)
- provider: String
- model: String
- promptFile: String
- promptVersion: String
- inputHash: String
- rawOutput: Json
- parsedOutput: Json
- createdAt: DateTime

Notes:

- DailyPlan can be generated from a RecruitLog, a DailyReview, or historical data.
- logId and reviewId are optional to keep generation flexible in V1.
- When generated from today's log or review, the relationship should be stored.

## 4.4 Knowledge

Purpose:

Stores reusable recruiting knowledge.

Fields:

- id: UUID
- title: String
- content: Text
- type: ENUM
- source: ENUM
- tags: String[]
- sourceReviewId: UUID (optional FK -> DailyReview)
- sourcePlanId: UUID (optional FK -> DailyPlan)
- rawOutput: Json (optional)
- parsedOutput: Json (optional)
- createdAt: DateTime
- updatedAt: DateTime

ENUM: KnowledgeType

- EXPERIENCE
- TEMPLATE
- POSITION
- NOTE

ENUM: KnowledgeSource

- USER
- AI
- REVIEW
- PLAN

Notes:

- User-created knowledge does not require rawOutput or parsedOutput.
- AI-generated knowledge must store parsedOutput.
- If knowledge is extracted from a review or plan, the source relationship should be stored.

---

# 5. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum KnowledgeType {
  EXPERIENCE
  TEMPLATE
  POSITION
  NOTE
}

enum KnowledgeSource {
  USER
  AI
  REVIEW
  PLAN
}

enum PlanPriority {
  LOW
  MEDIUM
  HIGH
}

model RecruitLog {
  id             String       @id @default(uuid())
  date           DateTime     @unique
  position       String?
  resumeCount    Int          @default(0)
  screenCount    Int          @default(0)
  phoneCount     Int          @default(0)
  interviewCount Int          @default(0)
  offerCount     Int          @default(0)
  entryCount     Int          @default(0)
  summary        String?
  problems       String?
  reflection     String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  review         DailyReview?
  plans          DailyPlan[]

  @@index([date])
}

model DailyReview {
  id            String       @id @default(uuid())
  logId         String       @unique
  summary       String
  strengths     Json
  weaknesses    Json
  suggestions   Json
  score         Int
  provider      String
  model         String
  promptFile    String
  promptVersion String
  inputHash     String
  rawOutput     Json
  parsedOutput  Json
  createdAt     DateTime     @default(now())

  log           RecruitLog   @relation(fields: [logId], references: [id])
  plans         DailyPlan[]
  knowledge     Knowledge[]

  @@index([createdAt])
}

model DailyPlan {
  id               String        @id @default(uuid())
  date             DateTime
  logId            String?
  reviewId         String?
  schedule         Json
  priorityTasks    Json
  goals            Json
  risks            Json
  expectedOutcomes Json
  priority         PlanPriority
  provider         String
  model            String
  promptFile       String
  promptVersion    String
  inputHash        String
  rawOutput        Json
  parsedOutput     Json
  createdAt        DateTime      @default(now())

  log              RecruitLog?   @relation(fields: [logId], references: [id])
  review           DailyReview?  @relation(fields: [reviewId], references: [id])
  knowledge        Knowledge[]

  @@index([date])
  @@index([logId])
  @@index([reviewId])
}

model Knowledge {
  id             String          @id @default(uuid())
  title          String
  content        String
  type           KnowledgeType
  source         KnowledgeSource
  tags           String[]
  sourceReviewId String?
  sourcePlanId   String?
  rawOutput      Json?
  parsedOutput   Json?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  sourceReview   DailyReview?    @relation(fields: [sourceReviewId], references: [id])
  sourcePlan     DailyPlan?      @relation(fields: [sourcePlanId], references: [id])

  @@index([type])
  @@index([source])
  @@index([createdAt])
}
```

---

# 6. Index Strategy (V1 Minimal)

Required indexes:

- RecruitLog.date (unique index)
- DailyReview.logId (unique index)
- DailyPlan.date (query frequent)
- DailyPlan.logId (source lookup)
- DailyPlan.reviewId (source lookup)
- Knowledge.type (filtering)
- Knowledge.source (filtering)

No additional indexes are required for V1.

---

# 7. Data Rules

## 7.1 General Rules

- All IDs must be UUID
- All timestamps must use UTC
- No soft delete in V1
- No historical versioning in V1
- Numeric recruiting count fields must be greater than or equal to 0

## 7.2 AI Data Rules

- AI outputs must be stored fully
- AI outputs must be stored as structured JSON
- rawOutput must preserve the original AI response payload
- parsedOutput must store the validated JSON used by the application
- promptFile, promptVersion, provider, model, and inputHash are required for AI-generated records
- No partial overwrite of AI results
- Each AI generation is immutable once created

---

# 8. Migration Strategy

Rules:

- Only Prisma migrations allowed
- No manual SQL changes
- Migration must be reversible in development

Commands:

```bash
npx prisma migrate dev
npx prisma generate
```

---

# 9. Data Flow Integration

Log Creation Flow:

```text
UI -> API -> Service -> Repository -> DB
```

AI Review Flow:

```text
RecruitLog -> Service -> AI -> Parsed JSON -> DailyReview -> DB
```

Planner Flow:

```text
RecruitLog + Review -> AI -> Parsed JSON -> DailyPlan -> DB
```

Knowledge Extraction Flow:

```text
Review or Plan -> Service -> AI -> Parsed JSON -> Knowledge -> DB
```

---

# 10. Constraints

Forbidden in V1:

- No multi-tenant tables
- No user table
- No authentication tables
- No audit logs
- No event sourcing
- No Redis caching layer

---

# 11. Summary

This database design is optimized for:

- Single-user MVP
- AI-driven workflows
- Structured and traceable AI results
- Fast iteration
- Minimal complexity
- Strong future extensibility
