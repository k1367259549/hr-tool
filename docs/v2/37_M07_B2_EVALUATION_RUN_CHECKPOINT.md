# 37_M07_B2_EVALUATION_RUN_CHECKPOINT.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: MILESTONE-07B2 - EvaluationRun Foundation Checkpoint

---

## 1. Checkpoint Summary

M07-B2 is building the auditable run foundation for Resume x JobProfile evaluation.

Current goals:

- establish append-only evaluation run evidence
- support multiple runs under the same `ResumeEvaluationResult`
- distinguish `latestSuccessfulRun`, `selectedRun`, and future `reviewedRun`
- prepare the data and service boundaries for later AI runs and HR review

This checkpoint does not add runtime behavior. It records the current architecture state after the EvaluationRun, selected-run, and reviewer-decision design work.

---

## 2. Stable Baseline

Recent key commits:

```text
5ba6f4b feat(evaluation): add revision and snapshot refs to evaluation results
2fc67d8 docs(evaluation): design EvaluationRun and rerun semantics for M07-B2
71797d0 feat(evaluation): add EvaluationRun schema foundation
59849c8 feat(evaluation): add mock evaluation run API
fd70e4e feat(evaluation): add latest successful run read path
59b9544 docs(evaluation): design selected run review binding
13a5b14 feat(evaluation): add selected run review binding
2ffb24a docs(evaluation): design reviewer decision binding
```

Current baseline:

```text
2ffb24a docs(evaluation): design reviewer decision binding
```

---

## 3. Completed Capabilities

### A. ResumeEvaluationResult Revision/Snapshot Binding

`ResumeEvaluationResult` can reference the exact resume content context used for new evaluations:

- `resumeRevisionId`
- `parsedSnapshotId`

The partial-reference consistency rules prevent mixing an explicit revision with an unrelated parsed snapshot.

New evaluation creation no longer depends only on implicit latest state. When explicit revision or snapshot input is provided, service logic resolves a consistent pair.

### B. EvaluationRun Schema Foundation

`ResumeEvaluationRun` exists as append-only execution evidence.

Implemented foundation:

- `runType`
- `status`
- run output fields for future structured suggestions
- duplicated master context fields for audit and query readability
- no strict unique constraint blocking reruns
- no write-back to `CandidateResume`
- `rawOutputJson` defaults to not being persisted

The run table is intended for multiple runs under one evaluation master.

### C. MOCK Run API

Implemented endpoint:

```text
POST /api/evaluations/[id]/runs
```

Current behavior:

- supports `MOCK` only
- does not call an AI provider
- does not add prompt files
- requires the evaluation master to have usable revision and snapshot references
- persists safe mock run data through the service layer

### D. Run History Read Path

Implemented endpoint:

```text
GET /api/evaluations/[id]/runs
```

Current behavior:

- returns run history as safe DTOs
- newest first
- does not return `rawOutputJson`
- does not return parsed resume text
- does not return prompt body
- does not return secrets

### E. Latest Successful Run

Implemented endpoint:

```text
GET /api/evaluations/[id]/runs/latest-successful
```

Current behavior:

- derives latest successful run by query
- returns a safe DTO or `null`
- does not persist `latestRunId`
- does not update the evaluation master

### F. Selected Run

Implemented foundation:

- nullable `selectedRunId` relation on `ResumeEvaluationResult`
- `onDelete: SetNull`
- `PATCH /api/evaluations/[id]/selected-run`
- selection limited to `SUCCEEDED` runs under the same evaluation
- clearing selection is allowed
- run history is not deleted when selection is cleared
- latest successful run is not automatically selected

### G. Reviewer Decision Architecture

Designed but not implemented:

- future `reviewedRunId`
- future `reviewerDecision`
- future `reviewerNotes`
- future `reviewedAt`
- future `reviewedBy`
- explicit `manualReviewWithoutRunBasis`
- ReviewEvent as a deferred append-only audit enhancement

The design separates current run selection from the historical run basis used for an HR decision.

---

## 4. Current Data Flow

Current and planned evaluation chain:

```text
CandidateResume
  -> ResumeRevision
  -> ParsedSnapshot
  -> ResumeEvaluationResult
  -> ResumeEvaluationRun[]
  -> selectedRunId
  -> future reviewedRunId / reviewerDecision
```

Meaning:

- `latestSuccessfulRun` is query-derived from `ResumeEvaluationRun[]`.
- `selectedRunId` is the current review-basis pointer.
- `reviewedRunId` is the future evidence pointer captured when HR submits a decision.
- `reviewerDecision` is the future HR decision on the evaluation master.

This keeps immutable run evidence separate from mutable human review state.

---

## 5. Current API Flow

Implemented:

```text
POST  /api/evaluations/[id]/runs
GET   /api/evaluations/[id]/runs
GET   /api/evaluations/[id]/runs/latest-successful
PATCH /api/evaluations/[id]/selected-run
```

Not implemented:

```text
PATCH /api/evaluations/[id]/review
GET   /api/evaluations/[id] selected/latest/review combined detail
AI run execution API
RULE_BASED run execution API
selected-run UI
review UI
```

---

## 6. Explicitly Not Implemented

The following remain out of the current implementation:

- `reviewerDecision`
- `reviewerNotes`
- `reviewedAt`
- `reviewedBy`
- `reviewedRunId`
- ReviewEvent
- `latestRunId`
- AI provider integration
- prompt files
- real scoring
- ranking or matching
- automatic rejection or hiring
- Candidate Pipeline movement
- Feishu synchronization
- multi-model comparison UI

---

## 7. Current Design Principles

- `EvaluationRun` is append-only evidence.
- `ResumeEvaluationResult` is the business master and human review container.
- `score` and `rating` are suggestions only.
- `reviewerDecision` is the HR decision.
- `latestSuccessfulRun` is not the same as `selectedRun`.
- `selectedRun` is not the same as future `reviewedRun`.
- run creation does not automatically update `selectedRunId`.
- changing `selectedRunId` must not automatically change future `reviewedRunId`.
- `rawOutputJson` defaults to not being persisted.
- route handlers must not query Prisma directly.
- route handlers must not call AI providers.

---

## 8. Current Risks And Technical Debt

- `reviewerDecision` is not implemented, so the human review loop is not complete.
- `reviewedRunId` is not implemented, so HR decision evidence capture is not complete.
- `latestSuccessfulRun` is query-derived; large list-page displays may eventually need denormalized `latestRunId` or an aggregate read model.
- `rawOutputJson` defaults to not being saved, but AI integration still needs dedicated privacy guard tests.
- AI provider `errorMessage` values must be safely sanitized before persistence or API return.
- PostgreSQL and Docker environment validation still needs to be rerun where local services are available.
- ReviewEvent append-only audit is deferred.
- permissions, actor identity, and multi-tenant ownership validation are deferred.

---

## 9. Recommended Next Routes

### Route A: Finish Human Review Loop

Tasks:

- M07-B2-F-B reviewedRunId + reviewerDecision schema/API

Pros:

- completes the evaluation review loop
- makes HR decisions traceable to a stable run basis
- keeps AI output clearly separated from human decision

Cons:

- adds more fields to the evaluation master
- increases review validation and workflow complexity

### Route B: Enter Rule-Based Run

Tasks:

- M07-B3-A rule-based output schema
- M07-B3-B rule-based run service

Pros:

- enables structured output testing without AI provider risk
- validates run persistence with deterministic behavior

Cons:

- HR review still remains incomplete
- rule output can only stay at suggestion level until review lands

### Route C: Prepare AI Run

Tasks:

- M07-B4-A AI provider boundary
- M07-B4-B prompt/input builder
- M07-B4-C AI run persistence

Pros:

- moves closer to the user-facing AI evaluation goal
- exercises prompt, model, and output trace fields

Cons:

- without `reviewerDecision`, AI output remains suggestion-only
- privacy, sanitization, prompt governance, and error handling risks increase

Recommendation:

Prioritize Route A. Finish the human review loop first, then proceed to rule-based or AI runs.

---

## 10. Next Step Recommendation

Recommended next task:

```text
M07-B2-F-B | reviewedRunId + reviewerDecision Schema/API
```

Boundaries for that task should remain strict:

- still do not connect an AI provider
- still do not implement Candidate Pipeline movement
- still do not implement automatic rejection or hiring
- keep ReviewEvent deferred
- preserve `selectedRunId` semantics
- keep `latestSuccessfulRun` query-derived unless explicitly rescoped

---

## 11. Verification Information

Required verification for this checkpoint:

```text
git status --short
git log -1 --oneline
```

This checkpoint changes documentation only. It does not modify code, Prisma schema, migrations, prompts, or runtime APIs.
