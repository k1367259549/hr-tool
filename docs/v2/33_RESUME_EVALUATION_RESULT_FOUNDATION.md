# 33_RESUME_EVALUATION_RESULT_FOUNDATION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-07B - Resume Evaluation Result Foundation

---

## 1. Purpose

Resume Evaluation Result Foundation introduces the data model and human-workflow layer for recording per-criterion evidence assessments against a specific Resume × JobProfile × EvaluationTemplateVersion context.

The relationship is:

```text
CandidateResume
  × JobProfile (reviewed)
  × EvaluationTemplateVersion (published, active assignment)
  → ResumeEvaluationResult
    → ResumeEvaluationEvent[]
```

This milestone only creates the evaluation record and human-review lifecycle. It does not call AI, produce scores, produce rankings, or move pipeline stages.

---

## 2. Data Model

Added Prisma enums:

```text
ResumeEvaluationStatus      (DRAFT, REVIEWED)
ResumeEvaluationEventType   (CREATED, UPDATED, REVIEWED, REOPENED)
```

Added Prisma models:

```text
ResumeEvaluationResult
ResumeEvaluationEvent
```

Reverse relations added to:

```text
CandidateResume.resumeEvaluations
JobProfile.resumeEvaluations
EvaluationTemplateVersion.resumeEvaluations
```

Rules:

- `ResumeEvaluationResult` is uniquely identified by the composite context key `(resumeId, jobProfileId, templateVersionId, jobProfileVersion)`.
- `criterionResults` is a JSONB array of `ResumeCriterionResult` objects with fields: `criterionKey`, `assessment`, `evidenceNotes[]`, `recruiterNote?`.
- Initial `revision` is `0` when the Evaluation Result is created.
- Each successful update, review, or reopen increments `revision` by `1`.
- Clients must send the `revision` returned by the latest server response as `expectedRevision`; stale revisions are rejected with conflict responses.
- `ResumeEvaluationEvent` records every lifecycle transition with `changedFields` (field names only, never before/after content).
- All foreign keys use `ON DELETE RESTRICT`.

---

## 3. Assessment Values

`CriterionEvidenceAssessment` values:

```text
NOT_ASSESSED
SUPPORTED
PARTIALLY_SUPPORTED
NOT_SUPPORTED
NOT_APPLICABLE
```

These record evidence-based observations only. They do not produce pass/fail decisions, scores, weights, rankings, or automatic rejections.

---

## 4. Lifecycle

State transitions:

```text
DRAFT → REVIEWED   (reviewEvaluation)
REVIEWED → DRAFT   (reopenEvaluation)
```

Creation prerequisites:

- Resume must have `parsingStatus = PARSED`
- JobProfile must have `reviewedAt` set
- JobProfile must have an active `JobProfileEvaluationAssignment`
- The requested `templateVersionId` must match the active assignment
- The template version must be `PUBLISHED` and its template `ACTIVE`

The composite context key prevents duplicate evaluations for the same Resume × JobProfile × TemplateVersion × JobProfileVersion combination.

---

## 5. API Surface

Implemented routes:

```text
GET  /api/resume-evaluations
POST /api/resume-evaluations

GET   /api/resume-evaluations/[id]
PATCH /api/resume-evaluations/[id]

POST /api/resume-evaluations/[id]/review
POST /api/resume-evaluations/[id]/reopen

GET /api/resume-evaluation-options
```

GET endpoints use `Cache-Control: no-store`.

All routes follow:

```text
Route → Validation → Service → Repository → Prisma
```

---

## 6. UI Surface

Implemented pages:

```text
/feishu/evaluations
/feishu/evaluations/new        (supports ?resumeId= prefill)
/feishu/evaluations/[id]
```

The Resume Library detail page (`/feishu/resumes/[id]`) now includes entry points:

- 新建评估 → `/feishu/evaluations/new?resumeId=<id>`
- 查看评估记录 → `/feishu/evaluations?resumeId=<id>`

---

## 7. Privacy Boundaries

Evaluation records must not store:

- Full Resume parsed text
- Candidate PII (email, phone, identity numbers)
- Full Job Description text
- Complete AI output

`ResumeEvaluationEvent.changedFields` stores field names only — never before or after content values.

Logs must not record:

- Complete `criterionResults` content
- `evidenceNotes` content
- `recruiterNote` content
- Candidate email or phone

---

## 8. Explicit Non-Goals

This milestone does not implement:

- AI resume evaluation
- Scores, weights, thresholds, rankings
- Automatic pass or rejection
- Automatic Pipeline movement
- Batch evaluation
- CandidateInsight redesign
- Interview or Offer stages
- Feishu API integration

M07C may add AI invocation if separately approved, using this result boundary as the container.

---

## 9. Tests

Coverage includes:

- Validation: list query, create, update, review, reopen payloads — valid, invalid, unknown fields, duplicate criterionKey, invalid slug, invalid assessment
- Service lifecycle: create prerequisites, DRAFT update with revision, review, reopen, stale revision rejection, P2002 conflict detection
- API routes: GET list (no-store), POST create (201, 400, 409), GET detail (no-store, 404), PATCH, review, reopen
- Integration (gated, `RUN_PRISMA_INTEGRATION_TESTS=true`): atomic creation, duplicate context key rejection, revision increment, stale revision rejection, review, reopen, DB-level unique constraint

---

## 10. Future Work

Future milestones should:

- Add AI invocation against this evaluation context boundary
- Add recruiter dashboard views filtered by jobProfile or templateVersion
- Define authentication, authorization, retention, erasure, and audit policy before production use
- Consider bulk evaluation creation for multiple resumes against one job profile
