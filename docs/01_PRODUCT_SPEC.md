# 01_PRODUCT_SPEC.md

Version: V1.0  
Status: Draft  
System: HR Daily AI

---

# 1. Product Vision

HR Daily AI is an AI-native recruiting operations system.

It is designed to replace fragmented recruiter workflows (notes, spreadsheets, dashboards, manual planning) with a unified, AI-driven daily operating system.

The system continuously transforms raw recruiting activity into structured insights, plans, and knowledge.

---

# 2. Product Objectives

The product has four core objectives:

## 2.1 Operational Logging
Provide a fast and structured way to record daily recruiting activities.

## 2.2 Performance Visibility
Automatically convert logs into measurable recruiting KPIs.

## 2.3 AI-driven Analysis
Use AI to analyze daily performance, identify issues, and generate actionable insights.

## 2.4 Planning Automation
Automatically generate next-day recruiting plans based on historical performance.

## 2.5 Knowledge Accumulation
Continuously extract reusable recruiting knowledge from daily operations.

---

# 3. Target Users

Primary user:

- Recruiters (internal HR / agency recruiters)

Secondary users:

- HR managers
- Solo recruiters
- Startup founders handling hiring

Constraints:

- Single-user MVP (no multi-tenant system required in V1)
- No authentication system required in V1

---

# 4. User Journey

## 4.1 Daily Workflow

1. User opens system
2. User creates daily log (or continues previous draft)
3. User records recruiting activities
4. System stores structured data
5. User triggers AI review
6. System generates insights
7. User reviews AI suggestions
8. User generates next-day plan
9. System stores plan
10. System extracts knowledge entries

---

## 4.2 Weekly Workflow

1. User views dashboard
2. System aggregates weekly KPIs
3. AI summarizes weekly performance
4. System highlights bottlenecks and improvements

---

# 5. Information Architecture

The system consists of five core modules:

## 5.1 Daily Log
Structured input of recruiting activities.

## 5.2 Dashboard
Aggregated KPI visualization.

## 5.3 AI Review
Analysis of daily performance.

## 5.4 Tomorrow Planner
AI-generated next-day plan.

## 5.5 Knowledge Base
Long-term accumulation of recruiting knowledge.

---

# 6. Functional Modules

# 6.1 Daily Log

## Purpose
Record structured daily recruiting activity.

## Fields

- date (required)
- position (string)
- resumeCount (number)
- screenCount (number)
- phoneCount (number)
- interviewCount (number)
- offerCount (number)
- entryCount (number)
- summary (text)
- problems (text)
- reflection (text)

## Features

- Create log
- Edit log
- Delete log
- Auto-save draft
- View history

## Constraints

- One log per day per user (V1 assumption single user)
- Numeric fields ≥ 0

---

# 6.2 Dashboard

## Purpose
Provide visual KPI overview.

## Metrics

- Daily activity count
- Weekly totals
- Monthly totals
- Funnel conversion (resume → offer → entry)
- Trend analysis

## Features

- KPI cards
- Simple charts
- Date filtering

---

# 6.3 AI Review

## Purpose
Analyze daily log using AI.

## Input

- Daily Log
- Optional last 7 days logs

## Output

Structured JSON:

- summary
- strengths
- weaknesses
- suggestions
- score (0–100)

## Constraints

- AI output must be stored in database
- Must be reproducible with same input (deterministic prompt design preferred)

---

# 6.4 Tomorrow Planner

## Purpose
Generate next-day plan based on historical performance.

## Input

- Today’s log
- AI review
- Optional historical logs

## Output

- time-based schedule
- priority tasks
- expected outcomes

---

# 6.5 Knowledge Base

## Purpose
Store reusable recruiting knowledge.

## Types

- EXPERIENCE (insights)
- TEMPLATE (scripts, messages)
- POSITION (job-specific notes)
- NOTE (manual input)

## Sources

- AI generated
- User manual input
- Extracted from reviews

## Features

- Create knowledge entry
- Tagging system
- Search
- Filter by type

---

# 7. Functional Requirements

## 7.1 System Requirements

- Must support CRUD for all core entities
- Must persist all AI outputs
- Must support Docker deployment
- Must run locally with one command

## 7.2 Data Requirements

- All data must be structured
- No unstructured free-text-only storage (except summary fields)
- All AI outputs must be JSON-parsed before saving

---

# 8. Non-Functional Requirements

## Performance

- Page load < 2 seconds (local environment)
- AI response timeout handling required

## Reliability

- AI failure must not block log creation
- System must work without AI

## Maintainability

- Feature-based folder structure
- Service layer mandatory
- Repository pattern required

---

# 9. AI Requirements

## 9.1 AI Provider

- OpenAI API (primary)

## 9.2 AI Usage Rules

- AI must only be called from backend
- Frontend must never access AI directly
- All prompts stored in `/prompts`

## 9.3 AI Outputs

Must always follow structured schema:

- JSON format required
- Must be validated before saving

## 9.4 AI Features

- Daily Review generation
- Tomorrow Plan generation
- Knowledge extraction

---

# 10. MVP Scope

Included:

- Daily Log (CRUD)
- Dashboard (basic KPI)
- AI Review
- Tomorrow Planner
- Knowledge Base
- Docker setup
- GitHub workflow

Excluded:

- Authentication
- Multi-user support
- Role/permission system
- Resume parsing
- Candidate tracking system
- Email integration
- Calendar integration
- ATS integration

---

# 11. Success Metrics

## Product Success

- User can complete daily log in < 2 minutes
- AI review generated in < 10 seconds (excluding network delays)
- Planner usable without manual editing in >70% cases

## System Success

- Docker startup success rate: 100%
- No manual setup required after clone
- All core features functional in local environment

---

# 12. Future Extensions (Not in V1)

- Candidate management system
- Resume parsing pipeline
- Interview evaluation system
- Offer management system
- Multi-agent AI system
- MCP integration
- External ATS integration
- Mobile version
