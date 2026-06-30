# Task019 - Dashboard Enhancement

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Enhance the Dashboard page with better KPI presentation, filters, and basic recruiting funnel visualization.

After this task, the Dashboard should provide a clearer view of recruiting performance.

---

# Context

Task010 created the initial Dashboard page.

Task019 improves usability and readability without changing the core data model.

---

# Requirements

Enhance:

- KPI cards
- Date range filtering
- Trend chart
- Funnel visualization
- Empty state
- Error state

---

# Files To Modify

```text
src/app/dashboard/page.tsx
src/features/dashboard/components/DashboardSummary.tsx
src/features/dashboard/components/DashboardTrendChart.tsx
src/features/dashboard/components/DashboardFunnel.tsx
src/features/dashboard/hooks/useDashboard.ts
src/types/dashboard.ts
```

---

# Dashboard Filters

Add basic filters:

- today
- week
- month
- all

---

# KPI Display

Display:

- resumeCount
- screenCount
- phoneCount
- interviewCount
- offerCount
- entryCount
- screenRate
- interviewRate
- offerRate
- entryRate

---

# Funnel

Visualize:

```text
Resume
 ↓
Screen
 ↓
Phone
 ↓
Interview
 ↓
Offer
 ↓
Entry
```

---

# Do NOT

Do NOT:

- implement advanced analytics
- add AI insight generation
- add external charting complexity beyond existing setup
- modify database schema
- add authentication

---

# Acceptance Criteria

- Dashboard filter works
- KPI values update by selected range
- Funnel displays correct values
- Trend chart displays available log data
- Empty state works when no logs exist
- Error state works when API fails
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
