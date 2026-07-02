# 30_RECRUITING_PIPELINE_FOUNDATION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-05 - Recruiting Application & Pipeline Foundation

---

## 1. Purpose

Recruiting Pipeline Foundation creates the first role-specific recruiting workflow between Candidate CRM and reviewed Job Profiles.

The core domain object is `CandidateApplication`:

```text
Candidate
+ Reviewed Job Profile
-> CandidateApplication
-> manual ApplicationStage
-> ApplicationEvent history
```

Pipeline stage belongs to `CandidateApplication`, not to `Candidate`.

---

## 2. Domain Rules

- A Candidate can participate in multiple Job Profiles at the same time.
- Each Candidate + Job Profile workflow has its own current stage and history.
- CandidateStatus remains only `ACTIVE`, `TALENT_POOL`, or `ARCHIVED`.
- Candidate does not store `currentPipelineStage`, `currentJobId`, or `currentApplicationStatus`.
- Stage movement is always manually confirmed.
- No AI output can move a CandidateApplication automatically.
- This milestone does not implement Interview records, Offer entities, Feishu API integration, scoring, ranking, hire recommendations, or reject recommendations.

---

## 3. Data Model

Added Prisma enums:

```text
ApplicationStage
ApplicationEventType
```

Added Prisma models:

```text
CandidateApplication
ApplicationEvent
```

Relationships:

- Candidate 1 -> N CandidateApplication
- JobProfile 1 -> N CandidateApplication
- CandidateApplication 1 -> N ApplicationEvent

Candidate and JobProfile deletion uses `Restrict` for application relations so recruiting history is not silently deleted.

---

## 4. Active Application Uniqueness

Current beta rule:

```text
One Candidate + one Job Profile can have only one active CandidateApplication at a time.
```

This is enforced by a PostgreSQL partial unique index:

```sql
CREATE UNIQUE INDEX "CandidateApplication_active_candidate_job_unique"
ON "CandidateApplication" ("candidateId", "jobProfileId")
WHERE "closedAt" IS NULL;
```

Prisma schema cannot fully express this partial unique index, so the migration SQL is the source of truth. A schema/migration guard test protects this behavior.

---

## 5. Stage Rules

Active stages:

```text
NEW
RESUME_SCREEN
PHONE_SCREEN
INTERVIEW
OFFER
```

Terminal stages:

```text
HIRED
REJECTED
WITHDRAWN
```

Allowed normal adjacent moves:

```text
NEW <-> RESUME_SCREEN
RESUME_SCREEN <-> PHONE_SCREEN
PHONE_SCREEN <-> INTERVIEW
INTERVIEW <-> OFFER
OFFER -> HIRED
```

From any non-terminal stage, recruiters may manually close as:

```text
REJECTED
WITHDRAWN
```

Terminal applications cannot move again in this milestone. Reopen is not implemented.

---

## 6. Transaction And Concurrency

Application creation reads Candidate and JobProfile, creates CandidateApplication, and writes a `CREATED` ApplicationEvent in one Prisma interactive transaction.

Stage transition uses a conditional atomic update:

```text
id = applicationId
AND currentStage = expectedCurrentStage
```

If the update count is zero, the service re-reads the application and returns `NOT_FOUND` or `CONFLICT`. It does not overwrite a concurrent stage movement and does not write a contradictory event.

Stage changes and `STAGE_CHANGED` events are written in the same transaction. If event creation fails, the stage update rolls back.

---

## 7. API Surface

Implemented routes:

```text
GET    /api/applications
POST   /api/applications
GET    /api/applications/[id]
PATCH  /api/applications/[id]
POST   /api/applications/[id]/transition
```

The list API supports search, stage, jobProfileId, candidateId, owner, open/closed/all status, page, and pageSize.

PATCH only updates metadata:

```text
owner
sourceChannel
notes
```

`currentStage` and `closedAt` cannot be changed by ordinary PATCH.

---

## 8. UI Surface

Implemented routes:

```text
/feishu/pipeline
/feishu/pipeline/new
/feishu/pipeline/[id]
```

Candidate detail pages now show a Recruiting Applications section and a manual create entry.

The Pipeline board displays stage columns without drag and drop. Detail pages show allowed next and previous moves, reject, withdraw, terminal disabled state, and event timeline.

---

## 9. Privacy And Event Minimalism

ApplicationEvent stores only:

```text
eventType
fromStage
toStage
note
actor
createdAt
```

Events do not copy Candidate email, phone, Candidate notes, Resume content, Job Profile full text, AI output, API keys, or request bodies.

---

## 10. Tests

Coverage includes:

- validation tests for create, update, transition, list query, unknown fields, empty PATCH, invalid stage, and pagination
- service tests for prerequisites, duplicate conflicts, no-op PATCH, legal and illegal transitions, terminal stages, stale transition conflicts, and event failure propagation
- API tests for success, validation, not found, conflict, standard response format, and safe DTO boundaries
- UI helper tests for labels, options, and terminal disabled behavior
- schema guard tests for CandidateApplication ownership and the partial unique migration
- gated real PostgreSQL tests for duplicate active application creation, concurrent stage movement, and transaction rollback

---

## 11. Explicit Non-Goals

This milestone does not implement:

- automatic stage movement
- AI scoring or ranking
- hire or reject recommendations
- Interview records
- Offer entities
- Feishu API integration
- drag-and-drop Pipeline board
- authentication or multi-user permissions
- Candidate current stage fields
- Candidate merge or deduplication

---

## 12. Known Limitations

Existing known technical debt remains intentionally out of scope:

- Candidate archive and Resume link concurrency
- Resume link/unlink activity timestamp semantics
- Resume audit originalName retention policy
- CREATED CandidateAudit PII retention policy
- tags/targetRoles array-order audit semantics

Additional Pipeline beta limitations:

- no authentication or role-based authorization
- no reopen flow after terminal state
- no configurable stage definitions yet
- no Interview or Offer records behind the stage labels
- no Feishu synchronization
