# 03_ARCHITECTURE.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the system architecture for HR Daily AI V1.

It describes how data flows through the system, how layers interact, and how responsibilities are separated.

All implementations MUST follow this architecture strictly.

---

# 2. High-Level Architecture

The system follows a layered monolithic architecture.

```text
[ Browser ]
     ↓
[ Next.js UI Layer ]
     ↓
[ API Layer (Route Handlers) ]
     ↓
[ Service Layer ]
     ↓
[ Repository Layer ]
     ↓
[ Prisma ORM ]
     ↓
[ PostgreSQL ]
```

---

# 3. Frontend Architecture

## 3.1 Structure Principle

Frontend is organized by feature, not by type.

Example:

```text
src/features/
    log/
    dashboard/
    review/
    planner/
    knowledge/
```

Each feature contains:

- page
- components
- hooks
- service (frontend service wrapper if needed)

## 3.2 UI Rule

- UI must NOT contain business logic
- UI only triggers actions and displays state
- Data transformation is not allowed in components

---

# 4. Backend Architecture

## 4.1 API Layer

Located in:

```text
src/app/api/
```

Responsibilities:

- Receive request
- Validate input
- Call service layer
- Return response

No business logic is allowed here.

## 4.2 Service Layer (Core Business Logic)

Located in:

```text
src/services/
```

Responsibilities:

- Business logic
- AI orchestration
- Data aggregation
- Cross-repository operations

Service layer is the ONLY place where business logic exists.

## 4.3 Repository Layer

Located in:

```text
src/repositories/
```

Responsibilities:

- Database access only
- CRUD operations
- Query optimization

Rules:

- No business logic
- No AI logic
- No transformation logic

## 4.4 AI Layer

Located in:

```text
src/ai/
```

Responsibilities:

- AI request handling
- Prompt construction
- Model selection
- Response parsing

Rules:

- Must never be called directly from UI
- Must always be called via Service Layer

---

# 5. Data Flow Architecture

## 5.1 Standard Flow

```text
UI
 ↓
API Route
 ↓
Service Layer
 ↓
Repository
 ↓
Database
```

## 5.2 AI Flow

```text
Service Layer
 ↓
Prompt Builder
 ↓
AI Provider (OpenAI)
 ↓
Response Parser
 ↓
Service Layer
 ↓
Repository (save result)
 ↓
Database
```

---

# 6. Module Architecture

## 6.1 Daily Log Module

Responsibilities:

- Create daily recruiting log
- Update log
- Store structured recruitment data

Flow:

```text
UI → API → LogService → LogRepository → DB
```

## 6.2 Dashboard Module

Responsibilities:

- Aggregate KPI data
- Compute trends
- Provide visualization-ready data

Flow:

```text
UI → API → DashboardService → Repository → DB
```

## 6.3 AI Review Module

Responsibilities:

- Read daily log
- Call AI
- Generate structured analysis
- Store review result

Flow:

```text
UI → API → ReviewService → AI Layer → Repository → DB
```

## 6.4 Planner Module

Responsibilities:

- Generate next-day plan
- Use AI + historical data
- Store structured plan

Flow:

```text
UI → API → PlannerService → AI Layer → Repository → DB
```

## 6.5 Knowledge Module

Responsibilities:

- Store AI-generated insights
- Store user notes
- Provide searchable knowledge base

Flow:

```text
UI → API → KnowledgeService → Repository → DB
```

---

# 7. AI Architecture Rules

## 7.1 AI Isolation Rule

AI must be isolated inside:

```text
src/ai/
```

AI must NEVER be used directly in:

- UI components
- API routes

## 7.2 Prompt Pipeline

```text
Input Data
   ↓
Prompt Builder
   ↓
AI Model
   ↓
Response Parser
   ↓
Validated JSON
   ↓
Database Storage
```

## 7.3 AI Output Rule

- All outputs MUST be JSON
- Must be validated before saving
- Raw text output is not allowed for core features

---

# 8. State Management Architecture

- No global state library
- Server state handled by Next.js
- Local state only in UI components
- Database is single source of truth

---

# 9. Error Handling Architecture

## 9.1 API Errors

- Standardized error response format
- No raw error exposure to frontend

## 9.2 AI Errors

- AI failure must NOT block core features
- Fallback behavior required:
- Show partial result
- Allow retry

---

# 10. Performance Architecture

- Server-side rendering preferred
- Minimize client-side computation
- AI calls are asynchronous and non-blocking

---

# 11. Extensibility Design

System is designed to allow future expansion:

Planned V2 modules:

- Candidate management
- Resume parsing
- Interview tracking
- Offer management
- Multi-agent system

Architecture supports this via feature isolation.

---

# 12. Summary

This architecture enforces:

- Strict layer separation
- AI isolation
- Feature-based modular design
- Predictable data flow
- High maintainability for single developer + AI coding agents
