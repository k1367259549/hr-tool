# Task004 - Base Layout and Navigation

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Create the basic application layout and navigation system.

After this task, the app must have a usable shell with sidebar navigation.

---

# Context

Task003 completed PostgreSQL + Prisma setup.

Task004 focuses only on the visual structure of the application.

No business logic should be implemented.

---

# Requirements

Create a desktop-first app layout with:

- Sidebar navigation
- Main content area
- Page header
- Basic responsive behavior

---

# Navigation Items

Sidebar must include:

```text
Dashboard
Daily Log
AI Review
Tomorrow Planner
Knowledge Base
```

---

# Routes

Create placeholder pages for:

```text
/
/log
/dashboard
/review
/planner
/knowledge
```

---

# Files To Create or Modify

```text
src/app/layout.tsx
src/app/page.tsx
src/app/log/page.tsx
src/app/dashboard/page.tsx
src/app/review/page.tsx
src/app/planner/page.tsx
src/app/knowledge/page.tsx

src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/PageHeader.tsx
```

---

# UI Requirements

Use:

- TailwindCSS
- shadcn/ui components where appropriate

---

# Page Placeholder Content

Each page should display:

- Page title
- Short module description
- Empty content placeholder

---

# Do NOT

Do NOT:

- implement forms
- implement APIs
- connect database
- implement dashboard statistics
- implement AI calls
- implement authentication

---

# Acceptance Criteria

- App loads successfully
- Sidebar is visible
- Navigation links work
- All five placeholder pages render
- Layout is reusable
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
