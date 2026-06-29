# Task005 - Shared UI Components

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Create reusable shared UI components for the V1 application.

After this task, future pages should reuse these components instead of duplicating UI code.

---

# Context

Task004 created the base app layout and navigation.

Task005 focuses only on shared UI components.

No business logic should be implemented.

---

# Requirements

Create reusable components for:

- KPI card
- Empty state
- Loading state
- Error state
- Section card
- Page actions
- Form field wrapper

---

# Files To Create

```text
src/components/shared/KpiCard.tsx
src/components/shared/EmptyState.tsx
src/components/shared/LoadingState.tsx
src/components/shared/ErrorState.tsx
src/components/shared/SectionCard.tsx
src/components/shared/PageActions.tsx
src/components/shared/FormField.tsx
```

---

# Component Rules

All components must:

- Use TypeScript
- Have explicit props types
- Be reusable
- Use TailwindCSS
- Use shadcn/ui where appropriate
- Contain no business-specific logic

---

# Do NOT

Do NOT:

- connect database
- create APIs
- implement Daily Log form
- implement Dashboard statistics
- implement AI logic

---

# Acceptance Criteria

- Components compile successfully
- Components are reusable
- No duplicated UI logic
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`

all succeed.
