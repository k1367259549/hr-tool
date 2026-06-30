# Task015 - Tomorrow Planner Page

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the Tomorrow Planner page.

After this task, the user must be able to generate, view, and regenerate tomorrow's AI work plan from the UI.

---

# Context

Task014 implemented the Tomorrow Planner backend.

Task015 connects the Planner UI to the backend API.

---

# Requirements

Implement the page:

```text
/planner
```

---

# Page Functions

The page must support:

- Select target date
- Generate tomorrow plan
- View existing plan
- Regenerate plan
- Display task list by time period
- Display focus area

---

# Files To Create or Modify

```text
src/app/planner/page.tsx
src/features/planner/components/PlannerGeneratePanel.tsx
src/features/planner/components/PlannerTaskList.tsx
src/features/planner/components/PlannerFocusCard.tsx
src/features/planner/hooks/usePlanner.ts
src/types/planner.ts
```

---

# API Integration

Use:

- `POST /api/planner/generate`
- `GET /api/planner/date/:date`

---

# UI Sections

The page must include:

- Date selector
- Generate Plan button
- Focus area
- Morning tasks
- Afternoon tasks
- Evening tasks

---

# Do NOT

Do NOT:

- implement Knowledge backend
- implement Knowledge UI
- modify AI provider
- call OpenAI directly from frontend
- add authentication

---

# Acceptance Criteria

- User can select date
- Existing plan loads if available
- User can generate plan
- User can regenerate plan
- Tasks are grouped by time period
- Priority is displayed clearly
- Loading state works
- Error state works
- No frontend OpenAI calls exist
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
