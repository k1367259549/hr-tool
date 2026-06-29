# Task013 - AI Review Page

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the AI Review page.

After this task, the user must be able to generate and view AI daily reviews from the UI.

---

# Context

Task012 implemented the AI Review backend.

Task013 connects the Review UI to the backend API.

---

# Requirements

Implement the page:

```text
/review
```

---

# Page Functions

The page must support:

- Select date
- Generate AI review
- View existing AI review
- Regenerate AI review
- Display loading state
- Display error state

---

# Files To Create or Modify

```text
src/app/review/page.tsx
src/features/review/components/ReviewGeneratePanel.tsx
src/features/review/components/ReviewResult.tsx
src/features/review/components/ReviewScoreCard.tsx
src/features/review/hooks/useReview.ts
src/types/review.ts
```

---

# UI Sections

The page must include:

- Date selector
- Generate Review button
- Score card
- Summary
- Strengths
- Weaknesses
- Suggestions

---

# API Integration

Use:

- `POST /api/review/generate`
- `GET /api/review/date/:date`

---

# Do NOT

Do NOT:

- implement Planner
- implement Knowledge extraction
- modify AI backend
- add authentication
- call OpenAI directly from frontend

---

# Acceptance Criteria

- User can select date
- Existing review loads if available
- User can generate review
- User can regenerate review
- AI result is displayed clearly
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
