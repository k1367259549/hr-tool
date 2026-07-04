# 36_REVIEWER_DECISION_BINDING_ARCHITECTURE.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: MILESTONE-07B2-F-A - Reviewer Decision / Review Binding Architecture Decision

---

## Implementation Status

M07-B2-F-B implements the reviewer decision binding foundation:

- `ResumeEvaluationResult.reviewedRunId`
- `ResumeEvaluationResult.reviewerDecision`
- `ResumeEvaluationResult.reviewerNotes`
- existing `ResumeEvaluationResult.reviewedAt` reused as review decision timestamp
- `ResumeEvaluationResult.reviewedBy`
- `PATCH /api/evaluations/[id]/review`

Implemented behavior:

- `manualReviewWithoutRunBasis` defaults to `false`
- manual review without run basis requires `reviewerNotes`
- `selectedRunId` remains mutable and separate from `reviewedRunId`
- `reviewedRunId` is fixed at review submit time
- later `selectedRunId` changes do not automatically update `reviewedRunId`
- review submit does not update `selectedRunId`

Still not implemented:

- `latestRunId`
- ReviewEvent append-only audit
- AI provider integration
- prompt files
- ranking, matching, or Candidate Pipeline movement
- automatic rejection or hiring

---

## 1. Background

M07-B2-E-B implements the selected-run foundation:

- `ResumeEvaluationResult.selectedRunId`
- nullable relation from `selectedRunId` to `ResumeEvaluationRun`
- `PATCH /api/evaluations/[id]/selected-run`
- validation that selected runs belong to the same evaluation context

`selectedRunId` is the current review-basis pointer. HR can change it or clear it.

`reviewerDecision`, `reviewerNotes`, `reviewedAt`, and `reviewedBy` are implemented by M07-B2-F-B.

The latest successful run remains query-derived. Run creation does not automatically update `selectedRunId`.

When future AI runs are introduced, one evaluation may have multiple successful runs. HR's final decision must be traceable to the exact run used when the decision was made.

---

## 2. Core Problem

`selectedRunId` is the current selection. It is not necessarily the historical basis for a final review decision.

If `reviewerDecision` only depends on the current `selectedRunId`, then changing `selectedRunId` later can make the old decision basis unclear.

If review is allowed without `selectedRunId`, that must be explicit manual review without run basis. The system must not pretend that such a decision was based on AI or an EvaluationRun.

`reviewerDecision` must not live on `EvaluationRun`. A run is immutable execution evidence. Human decision state belongs to the `ResumeEvaluationResult` master record.

---

## 3. Core Concepts

### selectedRunId

Current review-basis pointer on `ResumeEvaluationResult`.

It can be changed or cleared by HR before review.

### reviewedRunId

The run pointer captured when HR submits a final decision.

It records the evidence basis for `reviewerDecision` at decision time.

### reviewerDecision

The HR final decision for the evaluation master.

It is not equivalent to `EvaluationRun.score` or `EvaluationRun.rating`.

### reviewerNotes

Human explanation, context, or override notes for the decision.

### reviewedAt

Timestamp for when HR submitted or updated the decision.

### reviewedBy

Actor identifier for the HR reviewer.

### manualReviewWithoutRunBasis

Explicit mode for allowing review when there is no selected run.

This mode must be labeled and auditable. It cannot be treated as AI-backed review.

---

## 4. Recommended Route

Recommended route A: add review binding fields to `ResumeEvaluationResult`.

Future fields:

```text
reviewedRunId String?
reviewerDecision String? or ResumeReviewerDecision?
reviewerNotes String?
reviewedAt DateTime?
reviewedBy String?
```

Rules:

- `reviewerDecision` belongs to `ResumeEvaluationResult`.
- `reviewedRunId` points to `ResumeEvaluationRun`.
- When HR submits review and `selectedRunId` exists:
  - `reviewedRunId = selectedRunId`
  - `reviewerDecision` is written on the master
  - `reviewerNotes`, `reviewedAt`, and `reviewedBy` are written on the master
- When HR submits review and `selectedRunId` does not exist:
  - reject by default
  - allow only if request explicitly sets `manualReviewWithoutRunBasis = true`
  - if allowed, set `reviewedRunId = null`
  - require `reviewerNotes` explaining why no run basis was used
- Later changes to `selectedRunId` must not automatically change `reviewedRunId`.
- Later changes to `selectedRunId` must not automatically clear `reviewerDecision`.
- Clearing or changing review should require an explicit "re-review", "reopen", or "withdraw review" workflow.

---

## 5. selectedRunId vs reviewedRunId

`selectedRunId` means:

- current UI or HR-selected review basis
- mutable
- can be cleared
- useful before review or while comparing runs

`reviewedRunId` means:

- evidence pointer captured when HR decision is made
- historical basis for `reviewerDecision`
- should remain stable even if `selectedRunId` later changes
- may be null only for explicit manual review without run basis

When showing `reviewerDecision`, UI should prioritize `reviewedRunId`, not the current `selectedRunId`.

If `selectedRunId` and `reviewedRunId` differ, the UI should explicitly indicate that the current selected run is not the run used for the existing HR decision.

---

## 6. Not Recommended

Do not use only `selectedRunId` as the review basis.

Do not put `reviewerDecision` on `EvaluationRun`.

Do not treat `score` or `rating` as HR decision.

Do not write `reviewerDecision` when creating an AI run.

Do not write `reviewedRunId` automatically when a latest successful run appears.

Do not silently overwrite `reviewerDecision`.

Do not silently change `reviewedRunId` when `selectedRunId` changes.

Do not trigger automatic rejection, hiring, ranking, matching, or pipeline movement from review fields.

---

## 7. Review API Draft

Potential endpoint:

```text
PATCH /api/evaluations/[id]/review
```

AI/run-backed review request:

```json
{
  "reviewerDecision": "PASS",
  "reviewerNotes": "Candidate meets the must-have backend API criteria.",
  "manualReviewWithoutRunBasis": false,
  "actor": "kgj"
}
```

Manual review without run basis:

```json
{
  "reviewerDecision": "PASS",
  "reviewerNotes": "Manual offline assessment based on recruiter interview notes.",
  "manualReviewWithoutRunBasis": true,
  "actor": "kgj"
}
```

First-version decision values:

```text
PASS
REJECT
HOLD
NEEDS_MORE_INFO
```

Rules:

- route validates request shape
- route calls service layer
- route does not access Prisma directly
- route does not call AI providers
- if `manualReviewWithoutRunBasis` is omitted, it defaults to `false`
- `reviewerNotes` may be optional for run-backed review
- `reviewerNotes` is required when `manualReviewWithoutRunBasis = true`
- `actor` can be a free string until a permission system exists

---

## 8. Validation Rules

When `selectedRunId` exists:

- selected run must exist
- selected run must belong to `evaluationId`
- selected run status must be `SUCCEEDED`
- selected run context must match the evaluation master:
  - `resumeId`
  - `jobProfileId`
  - `templateVersionId`
  - `jobProfileVersion`
- write `reviewedRunId = selectedRunId`

When `selectedRunId` does not exist:

- reject review by default
- allow only when `manualReviewWithoutRunBasis = true`
- require `reviewerNotes`
- write `reviewedRunId = null`

When an evaluation already has `reviewerDecision`:

- first version may allow overwrite
- overwrite must update `reviewedAt` and `reviewedBy`
- a later ReviewEvent append-only audit model is recommended
- M07-B2-F-B should not implement ReviewEvent unless explicitly scoped

---

## 9. Data Model Draft

`ResumeEvaluationResult` may add:

```text
reviewedRunId String?
reviewerDecision ResumeReviewerDecision?
reviewerNotes String?
reviewedAt DateTime?
reviewedBy String?
```

Potential enum:

```text
ResumeReviewerDecision

PASS
REJECT
HOLD
NEEDS_MORE_INFO
```

Relation:

```text
reviewedRunId -> ResumeEvaluationRun.id
```

Recommended `reviewedRunId` FK `onDelete` strategy: `SetNull`.

Reasons:

- `reviewedRunId` is an evidence pointer.
- deleting a run, if ever permitted in the future, must not delete the evaluation master.
- `SetNull` preserves the evaluation master and clears only the evidence pointer.
- `Cascade` must not be used.
- `Restrict` is safer than `Cascade` but less flexible; `SetNull` is the preferred first-version behavior.

Do not add:

- `latestRunId`
- `ReviewEvent`
- automatic decision fields
- pipeline movement fields

Do not modify:

- `selectedRunId` semantics
- `ResumeEvaluationResult_context_key`

---

## 10. UI Draft

Evaluation detail should show:

```text
Latest Successful
Selected for Review
Reviewed Based On
HR Decision
```

If `reviewerDecision` exists:

- show the `reviewedRunId` run as the decision basis
- do not present current `selectedRunId` as the reviewed basis unless it matches `reviewedRunId`

If `selectedRunId` differs from `reviewedRunId`, show:

```text
Current selected run differs from reviewed basis.
```

If manual review without run basis was used, show:

```text
Manual review without run basis
```

The UI must not use run score or rating as a substitute for HR decision.

---

## 11. Non-Goals

This task does not implement:

- schema changes
- migration
- runtime API
- UI
- ReviewEvent
- AI provider integration
- prompt files
- real scoring
- ranking or matching
- automatic rejection
- automatic hiring
- Candidate Pipeline movement
- Feishu synchronization

---

## 12. M07-B2-F-B Implementation Recommendations

If implemented next:

1. Add `reviewedRunId` and reviewer decision fields to `ResumeEvaluationResult`.
2. Add `ResumeReviewerDecision` enum.
3. Do not add `latestRunId`.
4. Do not change `selectedRunId` semantics.
5. Implement `PATCH /api/evaluations/[id]/review`.
6. Default to requiring `selectedRunId`.
7. Allow manual review without run basis only when explicitly requested.
8. Require `reviewerNotes` for manual review without run basis.
9. On review submit, copy current `selectedRunId` into `reviewedRunId`.
10. Do not update `reviewedRunId` when `selectedRunId` later changes.
11. Do not implement ReviewEvent in the first schema/API task unless separately scoped.
12. Do not trigger pipeline movement.
13. Do not automatically reject or hire candidates.
