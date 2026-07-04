# 34_EVALUATION_RUN_ARCHITECTURE.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: MILESTONE-07B2-A - EvaluationRun / Rerun Semantics Architecture Decision
Implementation Status: M07-B2-B EvaluationRun schema foundation implemented

---

## Implementation Status

M07-B2-B implements the first EvaluationRun foundation:

- `ResumeEvaluationRun` schema, enum, indexes, and foreign-key relations
- append-only repository methods for creating and listing runs
- MOCK run service foundation for verifying the persistence boundary
- safe run DTOs that omit `rawOutputJson`

The existing `ResumeEvaluationResult_context_key` remains unchanged.

Still not implemented:

- `selectedRunId` / `latestRunId` on `ResumeEvaluationResult`
- AI provider integration
- prompt files for evaluation runs
- real scoring, ranking, or matching
- automatic rejection, hiring, or Candidate Pipeline movement
- raw model output persistence by default

Run records are append-only. M07-B2-B does not overwrite older runs and does not write run output back to `CandidateResume`.

## 1. Background

M07-B1 keeps `ResumeEvaluationResult` as the Evaluation master record and adds nullable references to the actual resume content used:

```text
ResumeEvaluationResult
  -> ResumeRevision
  -> ParsedSnapshot
```

The current business uniqueness remains:

```text
@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion])
```

That constraint is correct for the master record because one Resume x JobProfile x TemplateVersion x JobProfileVersion context should have one human-review workflow. It should remain on `ResumeEvaluationResult`.

M07-B2 needs a separate run concept because fields such as `modelProvider`, `modelName`, `promptVersion`, `inputHash`, and `outputHash` describe one execution attempt. They should not be stored directly on `ResumeEvaluationResult` because:

- one master evaluation may be rerun many times
- prompt, model, parser snapshot, or criteria input may change across runs
- failed runs and successful runs both need audit history
- replacing values on the master record would erase historical model and prompt evidence
- human review should confirm a business evaluation context, not every raw execution attempt

Rerun output must not overwrite historical results. Each run is evidence about what a specific workflow produced at a specific time. If a later run is better, the UI may select it as the current recommendation, but older runs remain auditable.

---

## 2. Core Concepts

### ResumeEvaluationResult

`ResumeEvaluationResult` is the business context master record and human-review container.

It owns:

- resume context
- JobProfile context
- template version context
- current human review lifecycle
- criterion-level reviewed result compatibility
- audit events

It should not own immutable run history.

### EvaluationRun

`EvaluationRun` represents one AI or rule-based evaluation execution.

It records:

- exact resume revision and parsed snapshot used
- exact job/template context used
- run type
- run status
- AI or rule output
- trace metadata
- errors and timing

### PromptRun / AITrace

`PromptRun` or `AITrace` may be extracted later if multiple AI workflows need shared tracing.

M07-B2 does not need to solve a generic AI analysis layer. A dedicated `EvaluationRun` is enough if it stores fields that can later migrate into a shared trace table.

### selectedRun / latestRun

`latestRun` means the newest run, usually by creation time.

`selectedRun` means the run the recruiter or system has chosen as the current recommendation shown on the evaluation detail page.

They are separate concepts. The newest run is not always the best or the one HR reviewed.

---

## 3. Recommended Data Model Draft

This is an architecture draft only. M07-B2-A does not modify Prisma schema and does not generate a migration.

### EvaluationRun

Recommended fields:

```text
EvaluationRun

id
evaluationId
resumeId
resumeRevisionId
parsedSnapshotId
jobProfileId
templateVersionId
jobProfileVersion
runType
status
score
rating
summary
strengthsJson
weaknessesJson
riskFlagsJson
evidenceJson
phoneScreenQuestionsJson
interviewQuestionsJson
modelProvider
modelName
promptVersion
inputHash
outputHash
rawOutputJson?
parsedOutputJson?
errorCode?
errorMessage?
latencyMs?
createdAt
completedAt?
```

Suggested enum-like values:

```text
runType: RULE_BASED | MOCK | AI
status: PENDING | SUCCEEDED | FAILED
```

`score` and `rating` are run-level suggestions only. They must not become final hiring decisions.

`EvaluationRun` intentionally duplicates `resumeId`, `jobProfileId`, `templateVersionId`, and `jobProfileVersion` from the master evaluation context. This is deliberate denormalization for audit, query, and historical context readability.

The source of truth remains `ResumeEvaluationResult`. M07-B2-B implementations must validate that duplicated fields match the master evaluation before persisting a run. Future maintainers should not remove these fields as redundant unless they replace the audit and query strategy with an equivalent design.

### ResumeEvaluationResult Optional Fields

Optional future fields on the master record:

```text
selectedRunId?
latestRunId?
reviewerDecision?
reviewerNotes?
```

These can be deferred. M07-B2 can first create runs and derive latest run by query ordering.

---

## 4. Rerun Semantics

- One `ResumeEvaluationResult` may have many `EvaluationRun` records.
- Every promptVersion change creates a new run.
- Every modelName change creates a new run.
- Every parsedSnapshotId change creates a new run.
- Every criteria or template context change creates a new run or a new master record, depending on whether the master context key changes.
- A run never overwrites another run.
- Failed runs are retained with safe error metadata.
- The UI defaults to the latest successful run.
- HR may choose a `selectedRun` if the latest successful run is not the one to review.
- Human review belongs to the master evaluation. If review is based on a specific run, the master record should record `selectedRunId`.

This gives the system append-only execution history while keeping one human-review workflow for one business evaluation context.

---

## 5. Unique Constraint Decision

Keep the current `ResumeEvaluationResult` unique constraint:

```text
@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion])
```

M07-B2 should not modify `ResumeEvaluationResult_context_key`.

`EvaluationRun` should not prevent multiple runs under the same evaluation. Repeated runs are expected.

If idempotency is needed later, possible options include:

- application-level dedupe by `inputHash`, `promptVersion`, and `modelName`
- a soft conflict warning when an identical successful run already exists
- an optional unique constraint after real rerun behavior is observed

Do not add a strict first-version unique constraint such as `unique(inputHash, promptVersion, modelName)`. It may block useful reruns for debugging, retry, model comparison, or prompt regression.

---

## 6. AI / Rule-Based Boundary

M07-B2 can start with mock or rule-based runs.

AI provider integration should be a later task. When AI is added:

- service layer calls the AI layer
- route handlers never call AI providers
- prompts live in `/prompts`
- output must be JSON
- parsed output must pass schema validation before writing `parsedOutputJson` or derived criterion output
- failures should create `FAILED` runs with safe error metadata

`rawOutputJson` should default to not being persisted. M07-B2-B should prioritize schema-validated `parsedOutputJson` rather than raw model output.

Saving `rawOutputJson` needs a separate privacy decision because raw model output may contain PII, copied resume text, or prompt leakage. If retained for audit or debugging, it must require explicit access control and follow the same retention and privacy policy as parsed resume text.

---

## 7. Human Review Boundary

Run output is decision support.

```text
EvaluationRun.score / rating = suggestion
ResumeEvaluationResult.reviewerDecision = HR decision
```

The system must not:

- automatically reject candidates
- automatically hire candidates
- automatically move Candidate Pipeline stages
- treat score as a threshold
- hide evidence behind an unreviewed rating

Human review should be explicit, auditable, and able to override or reject AI/run suggestions.

---

## 8. API / Service Draft

Potential API surface:

```text
POST  /api/evaluations/[id]/runs
GET   /api/evaluations/[id]/runs
PATCH /api/evaluations/[id]/selected-run
PATCH /api/evaluations/[id]/review
```

### POST /api/evaluations/[id]/runs

Creates a rule-based, mock, or future AI run for an existing evaluation master.

Service responsibilities:

1. Load the evaluation master.
2. Resolve and validate actual `resumeRevisionId` and `parsedSnapshotId`.
3. Verify `resumeRevisionId` belongs to the evaluation `resumeId`.
4. Verify `parsedSnapshotId` belongs to that revision.
5. Build rule or AI input.
6. Compute `inputHash`.
7. Persist an immutable run.
8. Optionally update latest run metadata after success.

### GET /api/evaluations/[id]/runs

Returns run history without full resume text or unsafe raw payloads in list shape.

### PATCH /api/evaluations/[id]/selected-run

Selects which successful run is treated as the current recommendation.

### PATCH /api/evaluations/[id]/review

Continues to update human review on the master evaluation. It may reference `selectedRunId` when review is based on a run.

Rules:

- route handlers validate request shape
- route handlers call service layer
- route handlers never access Prisma directly
- route handlers never call AI providers directly

---

## 9. UI Draft

Evaluation detail should show run history:

- run type
- status
- model and prompt metadata if present
- created/completed time
- score/rating suggestion if present
- summary preview
- error state for failed runs

The default detail view should show the latest successful run, unless a `selectedRun` exists.

Labels must distinguish:

```text
AI suggestion
Selected Run
HR Decision
```

Resume list should not show complex run information. Resume detail may show a simple count or latest evaluation state, but run history belongs on Evaluation detail.

---

## 10. Non-Goals

M07-B2-A does not implement:

- schema changes
- Prisma migration
- AI provider integration
- prompt files
- real scoring
- automatic screening
- automatic rejection
- automatic hiring
- Candidate Pipeline movement
- Feishu synchronization
- multi-model comparison UI
- generic AIAnalysisRun infrastructure

---

## 11. M07-B2-B Implementation Recommendations

Recommended sequence:

1. Add `EvaluationRun` schema foundation.
2. Keep `ResumeEvaluationResult_context_key` unchanged.
3. Defer nullable `selectedRunId` and `latestRunId` unless the first UI needs them.
4. Implement a mock or rule-based run first.
5. Ensure every run references actual `resumeRevisionId` and `parsedSnapshotId`.
6. Validate that `resumeRevisionId` belongs to `resumeId`.
7. Validate that `parsedSnapshotId` belongs to `resumeRevisionId`.
8. Keep M06 and M07-B1 DTOs compatible.
9. Add tests for multiple runs under one evaluation.
10. Add tests that reruns do not overwrite old runs.
11. Add AI provider integration only after run persistence and review semantics are stable.

Do not add scoring, ranking, automatic rejection, or automatic pipeline movement in the schema foundation task.
