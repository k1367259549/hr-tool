# Task030 - UI State Standardization

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Standardize loading, empty, success, and error states across the application.

After this task, all pages must provide consistent user feedback.

---

# Context

Task029 created global error handling.

Task030 improves UI consistency and reduces duplicated state-handling code.

---

# Requirements

Create or refine:

- Loading state component
- Empty state component
- Error state component
- Success toast pattern
- Confirm dialog pattern

---

# Files To Create or Modify

```text
src/components/shared/LoadingState.tsx
src/components/shared/EmptyState.tsx
src/components/shared/ErrorState.tsx
src/components/shared/ConfirmDialog.tsx
src/components/shared/ToastProvider.tsx
src/app/layout.tsx
```

---

# Apply To Pages

Update:

- `/log`
- `/dashboard`
- `/review`
- `/planner`
- `/knowledge`
- `/search`
- `/settings`

---

# UI State Rules

## Loading

Must show when:

- fetching API data
- saving form
- generating AI result

## Empty

Must show when:

- no logs exist
- no reviews exist
- no plans exist
- no knowledge entries exist
- no search results exist

## Error

Must show when:

- API request fails
- AI generation fails
- validation fails

## Success

Must show after:

- saving log
- generating review
- generating plan
- creating knowledge
- exporting Markdown

---

# Do NOT

Do NOT:

- add new business features
- modify database schema
- modify AI prompts
- add authentication
- add external UI libraries

---

# Acceptance Criteria

- All main pages use consistent loading state
- All main pages use consistent empty state
- All main pages use consistent error state
- Success toast works consistently
- Delete confirmation works consistently
- No duplicate state UI remains where avoidable
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
