# 32_EVALUATION_TEMPLATE_FOUNDATION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-07A - Evaluation Template Foundation

---

## 1. Purpose

Evaluation Template Foundation introduces configurable and versioned recruiting evaluation standards.

The relationship is:

```text
EvaluationTemplate
  -> EvaluationTemplateVersion
  -> JobProfileEvaluationAssignment
  -> future ResumeEvaluationResult
```

This milestone only creates the standards and assignment foundation. It does not evaluate resumes, call AI, score candidates, rank candidates, or move pipeline stages.

---

## 2. Data Model

Added Prisma enums:

```text
EvaluationTemplateStatus
EvaluationTemplateVersionStatus
```

Added Prisma models:

```text
EvaluationTemplate
EvaluationTemplateVersion
JobProfileEvaluationAssignment
```

Rules:

- `EvaluationTemplate` is the long-lived identity.
- Template content lives only in `EvaluationTemplateVersion`.
- `EvaluationTemplateVersion` stores structured `criteria` JSON.
- `JobProfileEvaluationAssignment` connects a reviewed Job Profile to one published Template Version.
- `JobProfile` has assignment history through `evaluationTemplateAssignments`.
- `CandidateInsight.resumeId @unique` remains unchanged for existing Candidate Understanding compatibility.

---

## 3. Versioning

Version states:

```text
DRAFT
PUBLISHED
```

Draft versions can be edited. Published versions are immutable. A new standard change is made by creating the next Draft version, which copies the latest Published criteria and instructions when available.

The database enforces one Draft per Template:

```sql
CREATE UNIQUE INDEX "EvaluationTemplateVersion_one_draft_per_template"
ON "EvaluationTemplateVersion" ("templateId")
WHERE "status" = 'DRAFT';
```

---

## 4. Criteria

Criteria are ordered structured objects:

```text
key
label
description
importance
evidenceGuidance
```

`importance` supports:

```text
REQUIRED
PREFERRED
CONTEXTUAL
```

`REQUIRED` means recruiter attention priority only. It does not mean automatic failure, pass score, deduction, ranking, or rejection.

The validation layer rejects unknown fields and explicitly rejects:

```text
score
weight
threshold
passScore
failScore
ranking
autoReject
autoHire
```

---

## 5. Job Profile Assignment

Only reviewed Job Profiles can receive a Template Version assignment.

Assignment requires:

- reviewed Job Profile
- published Template Version
- active Template
- explicit recruiter action

Each Job Profile can have only one active assignment at a time. Historical assignments are preserved.

The database enforces one active assignment per Job Profile:

```sql
CREATE UNIQUE INDEX "JobProfileEvaluationAssignment_one_active_per_job_profile"
ON "JobProfileEvaluationAssignment" ("jobProfileId")
WHERE "endedAt" IS NULL;
```

Changing the assigned standard closes the old assignment and creates a new one in one transaction.

---

## 6. API Surface

Implemented routes:

```text
GET  /api/evaluation-templates
POST /api/evaluation-templates

GET   /api/evaluation-templates/[id]
PATCH /api/evaluation-templates/[id]

POST /api/evaluation-templates/[id]/versions
POST /api/evaluation-templates/[id]/archive
POST /api/evaluation-templates/[id]/restore

PATCH /api/evaluation-template-versions/[id]
POST  /api/evaluation-template-versions/[id]/publish

GET    /api/job-profiles/[id]/evaluation-template-assignment
PUT    /api/job-profiles/[id]/evaluation-template-assignment
DELETE /api/job-profiles/[id]/evaluation-template-assignment
```

GET endpoints use `Cache-Control: no-store`.

All routes follow:

```text
Route -> Validation -> Service -> Repository -> Prisma
```

---

## 7. UI Surface

Implemented pages:

```text
/feishu/evaluation-templates
/feishu/evaluation-templates/new
/feishu/evaluation-templates/[id]
```

The UI supports:

- template list with search, status filter, pagination, loading, error, and empty states
- template creation with automatic Version 1 Draft
- metadata editing
- Draft criteria editor
- criterion add, remove, edit, reorder
- publish confirmation
- version history
- archive and restore
- manual Job Profile assignment and unassignment
- assignment history

The module is listed as `评价标准` and is not marked as an AI module.

---

## 8. Explicit Non-Goals

This milestone does not implement:

- Resume Evaluation Result
- AI resume evaluation
- batch evaluation
- scores
- weights
- thresholds
- ranking
- automatic pass or rejection
- automatic Pipeline movement
- CandidateInsight redesign
- Interview
- Offer
- Feishu API

M07B should add the future Resume Evaluation Result. M07C should add AI invocation if separately approved.

---

## 9. Privacy Boundaries

Evaluation Templates should describe role evaluation dimensions and evidence guidance only.

They must not store:

- Candidate names
- phone numbers
- email addresses
- identity numbers
- specific candidate evaluations
- real Resume text

Logs should not record complete criteria or instructions.

---

## 10. Tests

Coverage includes:

- validation for template create, patch, criteria, duplicate keys, forbidden scoring fields, pagination, assignment payloads, unknown fields, and empty patch
- service lifecycle rules for create, draft update, published immutability, publish, next Draft, archive, restore, assignment, replacement, and unassign
- API routes for success, validation, not found, conflict, no-store, and safe errors
- UI helper tests for pagination, filter reset, and no scoring labels
- schema guard tests for partial unique indexes and CandidateInsight compatibility
- gated PostgreSQL tests for transaction and concurrency behavior

---

## 11. Future Work

Future milestones should:

- create Resume x JobProfile x TemplateVersion Evaluation Result
- store reviewer decisions separately from AI output
- call AI only after Evaluation Result boundaries are approved
- keep historical evaluations linked to the exact Template Version used at evaluation time
- define authentication, authorization, retention, erasure, and audit policy before production use
