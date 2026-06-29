# Task007 - RecruitLog API

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Create REST API endpoints for RecruitLog.

After this task, the frontend should be able to create, read, update, and delete daily recruiting logs through API routes.

---

# Context

Task006 created the RecruitLog repository and service.

Task007 exposes those services through Next.js API routes.

---

# Requirements

Create API routes for RecruitLog CRUD.

---

# Files To Create

```text
src/app/api/log/route.ts
src/app/api/log/[id]/route.ts
src/app/api/log/date/[date]/route.ts
src/types/api.ts
src/utils/apiResponse.ts
```

---

# API Endpoints

## Get Logs

```http
GET /api/log
```

Returns all logs.

## Create Log

```http
POST /api/log
```

Creates a new RecruitLog.

## Get Log by ID

```http
GET /api/log/:id
```

## Update Log

```http
PUT /api/log/:id
```

## Delete Log

```http
DELETE /api/log/:id
```

## Get Log by Date

```http
GET /api/log/date/:date
```

---

# Standard Response Format

All endpoints must return:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

# Validation

API must validate:

- required date
- numeric fields >= 0
- valid ID
- valid JSON body

---

# Do NOT

Do NOT:

- access Prisma directly in API routes
- implement UI
- implement Dashboard
- implement AI logic
- implement authentication

---

# Acceptance Criteria

- RecruitLog can be created through API
- RecruitLog can be listed through API
- RecruitLog can be retrieved by ID
- RecruitLog can be retrieved by date
- RecruitLog can be updated
- RecruitLog can be deleted
- All responses follow standard response format
- API routes call Service Layer only
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
