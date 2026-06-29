# Task009 - Dashboard Service and API

Version: V1.0
Status: TODO
Estimated Time: 1~2 hours

---

# Goal

Create the backend service and API endpoints for Dashboard statistics.

After this task, the system must be able to calculate and return recruiting KPI summaries.

---

# Context

Task008 completed the Daily Log page.

Dashboard data should be calculated from RecruitLog records.

---

# Requirements

Create:

- Dashboard service
- Dashboard API
- KPI calculation utilities
- Dashboard TypeScript types

---

# Files To Create

```text
src/services/dashboard.service.ts
src/app/api/dashboard/summary/route.ts
src/app/api/dashboard/trends/route.ts
src/types/dashboard.ts
src/utils/kpi.ts
```

---

# KPI Metrics

Calculate:

- total resume count
- total screen count
- total phone count
- total interview count
- total offer count
- total entry count
- screen rate
- interview rate
- offer rate
- entry rate

---

# Time Ranges

Support:

- today
- week
- month

---

# API Endpoints

## Summary

```http
GET /api/dashboard/summary
```

Returns KPI summary for:

- today
- week
- month

## Trends

```http
GET /api/dashboard/trends
```

Returns daily trend data for recent logs.

---

# Do NOT

Do NOT:

- create Dashboard UI
- implement charts
- implement AI
- modify RecruitLog form
- add authentication

---

# Acceptance Criteria

- Dashboard summary API works
- Dashboard trends API works
- KPI calculations are correct
- API uses Service Layer
- API response follows standard format
- No direct Prisma usage in API routes
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
