# Task008 - Daily Log Page

Version: V1.0  
Status: TODO  
Estimated Time: 2~3 hours

---

# Goal

Create the Daily Log page.

After this task, the user must be able to create, edit, view, and delete recruiting logs from the UI.

---

# Context

Task007 created the RecruitLog API.

Task008 connects the frontend page to the API.

---

# Requirements

Implement the page:

```text
/log
```

---

# Page Functions

The page must support:

- Create daily log
- Edit existing log
- Delete log
- View log history
- Select log by date

---

# Form Fields

The form must include:

- date
- position
- resumeCount
- screenCount
- phoneCount
- interviewCount
- offerCount
- entryCount
- summary
- problems
- reflection

---

# Validation

- date is required
- numeric fields must be >= 0
- empty text fields are allowed

---

# Files To Create or Modify

```text
src/app/log/page.tsx
src/features/log/components/LogForm.tsx
src/features/log/components/LogList.tsx
src/features/log/components/LogItem.tsx
src/features/log/hooks/useLogForm.ts
src/types/log.ts
```

---

# UI Requirements

Use:

- shadcn/ui form components
- shared components from Task005
- loading state
- error state
- success toast after save

---

# API Integration

Use existing endpoints:

- `GET /api/log`
- `POST /api/log`
- `PUT /api/log/:id`
- `DELETE /api/log/:id`
- `GET /api/log/date/:date`

---

# Do NOT

Do NOT:

- implement AI Review
- implement Dashboard statistics
- implement Planner
- implement Knowledge Base
- add authentication

---

# Acceptance Criteria

- User can create a log
- User can edit a log
- User can delete a log
- User can view log list
- Form validation works
- Data persists after refresh
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
