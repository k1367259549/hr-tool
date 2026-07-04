# 35_SELECTED_RUN_REVIEW_BINDING_ARCHITECTURE.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: MILESTONE-07B2-E-A - Selected Run / HR Review Binding Architecture Decision
Implementation Status: M07-B2-E-B selectedRunId relation and selected-run API implemented

---

## Implementation Status

M07-B2-E-B implements:

- nullable `ResumeEvaluationResult.selectedRunId`
- `selectedRunId` relation to `ResumeEvaluationRun`
- `onDelete: SetNull` for the selected-run pointer
- `PATCH /api/evaluations/[id]/selected-run`
- service-layer validation that selected runs belong to the same evaluation context
- clearing `selectedRunId` without deleting run history

Still not implemented:

- `latestRunId`
- `reviewerDecision`
- `reviewerNotes`
- `reviewedBy`
- selected-run UI
- AI provider integration
- automatic selection of latest successful run

The latest-successful query path remains unchanged. Run creation does not auto-update `selectedRunId`.

## 1. Background

M07-B2-B, M07-B2-C, and M07-B2-D establish the first EvaluationRun path:

- `ResumeEvaluationRun` stores append-only run records.
- `POST /api/evaluations/[id]/runs` creates MOCK runs only.
- `GET /api/evaluations/[id]/runs` reads safe run history.
- `GET /api/evaluations/[id]/runs/latest-successful` reads the latest successful run by query.

The latest successful run is query-derived. It is not an HR selection and is not persisted on `ResumeEvaluationResult`.

After real AI runs are introduced, one `ResumeEvaluationResult` may have multiple successful runs under the same evaluation context. These runs may differ by model, prompt version, parsed snapshot, input hash, output hash, or retry timing.

HR decisions must therefore be traceable to the specific run used as review evidence. The system needs a separate concept for "the run HR selected for review" instead of treating the newest successful run as an implicit decision basis.

---

## 2. Core Concepts

### latestSuccessfulRun

`latestSuccessfulRun` is the newest `SUCCEEDED` run derived by query ordering.

It is useful as a default display candidate, but it is not an explicit HR choice.

### selectedRun

`selectedRun` is the run explicitly chosen as the current review basis.

It may be selected by HR or by a controlled service workflow, but it must be persisted separately from query-derived latest-run behavior.

### reviewerDecision

`reviewerDecision` is the final HR decision attached to the evaluation master.

It is not equivalent to `EvaluationRun.score` or `EvaluationRun.rating`.

### reviewerNotes

`reviewerNotes` stores HR commentary explaining the decision or override.

It should live with the review decision rather than with immutable run output.

### Run Suggestion vs Human Decision

Run output is decision support. Human review is the decision boundary.

The UI and API must distinguish:

```text
EvaluationRun.score / rating = run suggestion
ResumeEvaluationResult.reviewerDecision = HR decision
ResumeEvaluationResult.selectedRunId = review evidence pointer
```

---

## 3. Recommended Route

Recommended route A:

- Add nullable `ResumeEvaluationResult.selectedRunId`.
- Point `selectedRunId` to `ResumeEvaluationRun`.
- Do not add `latestRunId`.
- Continue deriving latest successful run by query.
- Allow `selectedRunId` only for runs with the same `evaluationId`.
- Allow `selectedRunId` only for `SUCCEEDED` runs.
- Reject `FAILED` and `PENDING` runs as selected review basis.

This route keeps the master evaluation as the human-review container while preserving append-only run history.

---

## 4. Not Recommended

Do not automatically write the latest successful run into `selectedRunId`.

Reasons:

- the newest successful run is not always the run HR reviewed
- a later retry may appear after HR has already made a decision
- automatic selection would blur system suggestion with human choice

Do not use `latestRunId` instead of `selectedRunId`.

Reasons:

- `latestRunId` is derivable from run history
- persisting it creates synchronization risk
- it does not answer which run HR actually selected

Do not place `reviewerDecision` on `EvaluationRun`.

Reasons:

- a run is immutable execution evidence
- human review belongs to the business evaluation context
- the same run may be reviewed, rejected, or superseded without mutating run output

Do not treat `score` or `rating` as HR decision.

Reasons:

- score/rating are suggestions
- HR must remain the accountable decision maker
- automated rejection, hiring, ranking, or pipeline movement is out of scope

---

## 5. API Draft

Potential API surface:

```text
PATCH /api/evaluations/[id]/selected-run
GET   /api/evaluations/[id]
PATCH /api/evaluations/[id]/review
```

### PATCH /api/evaluations/[id]/selected-run

Sets or clears the selected review basis.

Input:

```text
selectedRunId: string | null
expectedRevision?: number
actor?: string | null
```

Rules:

- route validates request shape
- route calls service layer
- route never accesses Prisma directly
- route never calls AI providers

### GET /api/evaluations/[id]

May return both:

- `selectedRun` summary
- `latestSuccessfulRun` summary

The response must label these as separate concepts.

### PATCH /api/evaluations/[id]/review

May record HR decision based on the current `selectedRunId`.

If no `selectedRunId` exists, the service must decide whether review is blocked or explicitly recorded as reviewed without a run basis. That decision should be made in the implementation task.

---

## 6. Validation Rules

When setting `selectedRunId`:

- selected run must exist
- selected run must belong to the target `evaluationId`
- selected run `status` must be `SUCCEEDED`
- selected run `resumeId` must match the master evaluation `resumeId`
- selected run `jobProfileId` must match the master evaluation `jobProfileId`
- selected run `templateVersionId` must match the master evaluation `templateVersionId`
- selected run `jobProfileVersion` must match the master evaluation `jobProfileVersion`
- `FAILED` and `PENDING` runs must be rejected

When clearing `selectedRunId`:

- `selectedRunId = null` is allowed
- clearing selection must not delete run history
- clearing selection must not update, delete, or regenerate any `ResumeEvaluationRun`

The service layer must enforce these rules. Routes should not query Prisma directly.

---

## 7. Data Model Draft

`ResumeEvaluationResult` may later add:

```text
selectedRunId String?
reviewerDecision String?
reviewerNotes String?
reviewedAt DateTime?
reviewedBy String?
```

Notes:

- `selectedRunId` and its relation are implemented in M07-B2-E-B
- `reviewerDecision`, `reviewerNotes`, `reviewedAt`, and `reviewedBy` remain deferred
- `latestRunId` remains deferred
- `ResumeEvaluationResult_context_key` must not be changed
- new fields should be nullable first to avoid breaking existing rows
- selected run relation should avoid cascading deletion of evaluation history
- recommended `selectedRunId` FK `onDelete` strategy: `SetNull`
- reason: `selectedRunId` is only a review-basis pointer
- if deleting a run is ever permitted in the future, it must not delete the evaluation master
- `SetNull` preserves the evaluation master and clears only the selection pointer
- `Cascade` must not be used
- `Restrict` is safer than `Cascade` but less flexible; `SetNull` is the preferred first-version behavior

---

## 8. UI Draft

Evaluation detail should default to:

1. show `selectedRun` when present
2. otherwise show `latestSuccessfulRun`
3. clearly indicate when the visible run is derived rather than selected

Required labels:

```text
Latest Successful
Selected for Review
HR Decision
```

HR should be able to:

- select a successful run as `selectedRun`
- clear the selected run
- see which run a review decision is based on
- distinguish run suggestion from HR decision

The HR decision area must display the run basis clearly.

Example wording:

```text
HR Decision based on Selected Run: run_123
```

If no selected run exists, the UI should not imply that latest successful has been reviewed.

---

## 9. Non-Goals

This design task does not implement:

- AI provider integration
- rule-based run execution
- prompt files
- real scoring
- ranking or matching
- automatic rejection
- automatic hiring
- Candidate Pipeline movement
- Feishu synchronization
- multi-model comparison UI
- schema changes
- migration
- runtime API changes
- UI changes

---

## 10. M07-B2-E-B Implementation Recommendations

Recommended sequence:

1. Add nullable `selectedRunId` relation on `ResumeEvaluationResult`.
2. Keep `latestRunId` deferred.
3. Keep latest-successful query path unchanged.
4. Add `PATCH /api/evaluations/[id]/selected-run`.
5. Allow setting `selectedRunId` only to a run under the same evaluation.
6. Allow setting `selectedRunId` only to `SUCCEEDED` runs.
7. Allow clearing `selectedRunId` to `null`.
8. Do not automatically update `selectedRunId` when new runs are created.
9. Add tests proving selected run and latest successful run can differ.
10. Add tests proving selection changes do not mutate run history.
11. Keep route handlers out of Prisma and AI provider calls.

Reviewer decision fields should be deferred unless the review API needs them immediately.

The first implementation should preserve all existing M06, M07-B1, M07-B2-B, M07-B2-C, and M07-B2-D DTO compatibility.
