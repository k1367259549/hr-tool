# Task010 - Dashboard Page

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the Dashboard page.

After this task, the user must be able to view recruiting KPI summaries and simple trend information from the UI.

---

# Context

Task009 created Dashboard service and API endpoints.

Task010 connects the Dashboard UI to those APIs.

---

# Requirements

Implement the page:

```text
/dashboard
```

---

# Page Sections

The Dashboard page must include:

- KPI summary cards
- Today summary
- Weekly summary
- Monthly summary
- Simple trend chart
- Recruiting funnel overview

---

# KPI Cards

Display:

- Resume Count
- Screen Count
- Phone Count
- Interview Count
- Offer Count
- Entry Count
- Screen Rate
- Interview Rate
- Offer Rate
- Entry Rate

---

# Files To Create or Modify

```text
src/app/dashboard/page.tsx
src/features/dashboard/components/DashboardSummary.tsx
src/features/dashboard/components/DashboardTrendChart.tsx
src/features/dashboard/components/DashboardFunnel.tsx
src/features/dashboard/hooks/useDashboard.ts
src/types/dashboard.ts
```

---

# UI Requirements

Use:

- shared KPI card component
- shadcn/ui cards
- simple chart if Recharts is installed
- loading state
- error state
- empty state

---

# API Integration

Use:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/trends`

---

# Do NOT

Do NOT:

- implement AI Review
- implement Planner
- implement Knowledge Base
- modify RecruitLog APIs
- add authentication

---

# Acceptance Criteria

- Dashboard loads KPI summary
- Dashboard displays today/week/month metrics
- Trend data is displayed
- Funnel overview is displayed
- Empty state works when no logs exist
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `docker compose up --build`

all succeed.
