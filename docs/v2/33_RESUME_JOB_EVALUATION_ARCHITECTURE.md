# 33_RESUME_JOB_EVALUATION_ARCHITECTURE.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: MILESTONE-07A - Resume x JobProfile Evaluation Architecture Design

---

## 1. Background

M06 freezes Resume Library architecture around independent resume assets:

```text
CandidateResume
  -> ResumeRevision
       -> ParsedSnapshot
```

`CandidateResume.jobProfileId` is now nullable and represents only the initial processing context. It must not be used as evaluation ownership.

M07 needs a separate Resume x JobProfile evaluation architecture because:

- one Resume Library record may be evaluated against many Job Profiles
- one Job Profile may evaluate many resumes
- one Resume x JobProfile pair may be evaluated again when prompt version, model, template, parser output, or Job Profile standards change
- evaluation output must be auditable and reviewable without mutating the original Resume Library record

M07 cannot continue to depend on `CandidateResume.jobProfileId` because that field records how a resume entered the system, not every role it may later be considered for. A Resume uploaded directly to the library has `jobProfileId = null`, but it must still be eligible for future evaluation.

Evaluation results must not be written back into `CandidateResume` because `CandidateResume` is the stable resume asset identity. Writing role-specific evaluation state into it would collapse many role contexts into one mutable field, overwrite historical evidence, and blur resume storage with decision support.

The same resume must support multiple JobProfile evaluations. A senior recruiter may compare one resume against a frontend role, a full-stack role, and a future talent pool role. Those evaluations can legitimately produce different strengths, risks, questions, and reviewer decisions.

M06 `ResumeRevision` and `ParsedSnapshot` provide the content version boundary for M07. M07 should evaluate a specific revision and parsed snapshot, not an implicit latest resume state that may change later.

---

## 2. Core Concepts

### CandidateResume

`CandidateResume` remains the Resume Library Record. It owns stable resume identity, upload metadata, duplicate signals, current compatibility fields, and optional Candidate linkage.

It is not the evaluation result container.

### ResumeRevision

`ResumeRevision` is the auditable resume content/source/parser revision being evaluated.

An evaluation should record the actual `resumeRevisionId` used so later re-parsing or file replacement does not silently change the evidence behind an old evaluation.

`ResumeRevision` should not gain `jobProfileId`. Job context belongs to evaluation records.

### ParsedSnapshot

`ParsedSnapshot` is the parsed text and structured parser output read by AI or rule-based evaluation.

An evaluation should record the actual `parsedSnapshotId` used. If M07 defaults to the latest snapshot, the service must resolve and persist the exact snapshot ID before evaluation starts.

### JobProfile

`JobProfile` is the hiring context. M07 evaluation should require a reviewed Job Profile before producing decision-support output.

### JobProfileSnapshot / JobCriteriaSnapshot

Job standards change over time. M07 should design for snapshotting the role context used at evaluation time.

M07 may start by storing `jobProfileVersion` or reusing an assigned `EvaluationTemplateVersion`, but the architecture should leave room for:

- `JobProfileSnapshot`: a frozen role summary, responsibilities, requirements, and risks
- `JobCriteriaSnapshot`: a frozen criteria set derived from a published template version or other approved rubric

These snapshots do not need to be implemented in M07-A.

### ResumeJobEvaluation

`ResumeJobEvaluation` is the conceptual object for one evaluation result:

```text
ResumeRevision x JobProfile standard x model/rule flow -> Evaluation result
```

The existing `ResumeEvaluationResult` model may evolve into this role if it remains scoped to Resume x JobProfile x TemplateVersion and gains revision/snapshot/AI trace fields as needed.

### HumanReview

`HumanReview` records HR confirmation, correction, or rejection of AI output.

AI score and rating are suggestions. `reviewerDecision` is the human-confirmed decision state. The system must not treat AI output alone as a hiring decision.

---

## 3. Recommended Data Model Draft

This is an architecture draft only. M07-A does not modify Prisma schema and does not generate a migration.

### ResumeJobEvaluation

Recommended fields:

```text
ResumeJobEvaluation

id
resumeId
resumeRevisionId
parsedSnapshotId
jobProfileId
jobProfileSnapshotId?
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
createdAt
updatedAt
reviewedAt?
reviewerDecision?
reviewerNotes?
```

Rules:

- `score` and `rating` are AI or rule-based suggestions, not final recruiting decisions.
- `reviewerDecision` represents the human-confirmed result.
- evaluation results do not write into `CandidateResume`.
- `ResumeRevision` does not receive `jobProfileId`.
- repeated evaluation should create a new record or a new immutable run, not overwrite historical evidence.

### Optional EvaluationEvidence

Useful if evidence needs independent filtering or source references:

```text
EvaluationEvidence

id
evaluationId
criterionKey
sourceType
sourceRefId?
excerpt
reason
createdAt
```

The excerpt may contain PII. It must follow the same logging and retention rules as parsed resume text.

### Optional EvaluationPromptRun

Useful if multiple runs are allowed under one evaluation:

```text
EvaluationPromptRun

id
evaluationId
modelProvider
modelName
promptVersion
inputHash
outputHash
rawOutputJson?
parsedOutputJson
latencyMs?
createdAt
```

M07 can defer this until repeat-run semantics are needed.

### Optional HumanReviewRecord

Useful if review history needs more than latest fields:

```text
HumanReviewRecord

id
evaluationId
reviewerDecision
reviewerNotes
changedFieldsJson
reviewedBy?
reviewedAt
```

The first implementation may store latest review fields on the evaluation and use event records for audit.

---

## 4. Design Principles

- Evaluation is an independent object.
- Evaluation means a specific resume content version x a specific JobProfile standard x a specific model/rule workflow.
- AI output must be explainable, auditable, and reproducible.
- The system must not automatically reject or eliminate candidates.
- AI score must not be the only decision basis.
- `contentHash`, `inputHash`, and `outputHash` support caching, audit, and reruns.
- The same Resume can be evaluated against multiple JobProfiles.
- The same Resume x JobProfile can be evaluated again with a different `promptVersion`, `modelName`, parser snapshot, or criteria snapshot.
- Historical evaluation results should remain append-friendly.
- UI and API labels must distinguish AI suggestions from HR decisions.

---

## 5. Relationship With Existing ResumeEvaluationResult

The current schema already contains:

```text
ResumeEvaluationResult
ResumeEvaluationEvent
ResumeEvaluationStatus
ResumeEvaluationEventType
```

Current `ResumeEvaluationResult` responsibilities:

- connect `CandidateResume`, reviewed `JobProfile`, and `EvaluationTemplateVersion`
- store criterion-level evidence assessments in `criterionResults`
- store human lifecycle status: `DRAFT` and `REVIEWED`
- preserve optimistic concurrency with `revision`
- record lifecycle events through `ResumeEvaluationEvent`
- prevent duplicate results for `(resumeId, jobProfileId, templateVersionId, jobProfileVersion)`

This model can evolve toward the conceptual `ResumeJobEvaluation` if M07 keeps it as the evaluation boundary and adds missing version references rather than writing evaluation fields back into `CandidateResume`.

If M07-B extends the existing `ResumeEvaluationResult`, it must explicitly revisit the current unique constraint:

```text
@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion])
```

That constraint prevents multiple evaluation records for the same Resume x JobProfile x TemplateVersion x JobProfileVersion tuple. This is correct for the current human-reviewed foundation, but it conflicts with M07 rerun requirements unless M07-B defines a new uniqueness strategy.

M07-B must choose one of these schema directions:

- add `resumeRevisionId`, `parsedSnapshotId`, `promptVersion`, `modelName`, or other run-defining fields to the uniqueness dimension
- keep one evaluation master record and add immutable `EvaluationPromptRun` or `EvaluationRun` records for repeated AI/rule runs
- allow multiple evaluation records and distinguish them by `createdAt`, `status`, and `revision`, while keeping query and UI semantics clear

If the unique constraint changes, the migration must explicitly drop the old unique constraint before adding the new constraint. Newly introduced fields should be nullable first to avoid breaking existing rows. The service layer must still resolve and write the actual `resumeRevisionId` and `parsedSnapshotId` for every newly created evaluation.

Fields that can be reused:

- `resumeId`
- `jobProfileId`
- `templateVersionId`
- `jobProfileVersion`
- `status`
- `revision`
- `criterionResults`
- `overallNote`
- `evaluatedBy`
- `reviewedAt`
- `createdAt`
- `updatedAt`
- `ResumeEvaluationEvent`

Fields likely needed for AI-enabled Resume x JobProfile evaluation:

- `resumeRevisionId`
- `parsedSnapshotId`
- `jobProfileSnapshotId` or stronger snapshot fields
- `score`
- `rating`
- `summary`
- `strengthsJson`
- `weaknessesJson`
- `riskFlagsJson`
- `evidenceJson`
- `phoneScreenQuestionsJson`
- `interviewQuestionsJson`
- `modelProvider`
- `modelName`
- `promptVersion`
- `inputHash`
- `outputHash`
- `reviewerDecision`
- `reviewerNotes`

M07-A does not change schema. It only records that `ResumeEvaluationResult` is a plausible evolution path, but the next schema task must decide whether to extend it directly or add a new `ResumeJobEvaluation` model.

---

## 6. API / Service Design Draft

Potential API surface:

```text
POST  /api/evaluations
GET   /api/evaluations
GET   /api/evaluations/[id]
PATCH /api/evaluations/[id]/review
```

### POST /api/evaluations

Input:

```text
resumeId
jobProfileId
resumeRevisionId?
parsedSnapshotId?
templateVersionId?
```

Behavior:

1. Validate request shape in the route handler.
2. Call Evaluation Service.
3. Resolve the Resume Library record.
4. Resolve the reviewed JobProfile.
5. Resolve the active criteria source or template version.
6. If `resumeRevisionId` is omitted, use the latest `ResumeRevision`.
7. If `parsedSnapshotId` is omitted, use the snapshot for the selected revision.
8. Persist the actual `resumeRevisionId` and `parsedSnapshotId` used.
9. Build AI/rule input from snapshots and approved JobProfile criteria.
10. Store evaluation output as a separate evaluation record.

No route handler should call Prisma or AI providers directly.

### GET /api/evaluations

Supports filters such as:

```text
resumeId
jobProfileId
status
reviewerDecision
page
pageSize
```

List responses should avoid full parsed text, raw prompt payloads, and large evidence arrays.

### GET /api/evaluations/[id]

Returns a safe detail DTO with:

- evaluation metadata
- selected resume/job/profile snapshots
- criterion results
- AI suggestion fields
- reviewer decision fields
- audit timeline

It should not return original resume binary or secrets.

### PATCH /api/evaluations/[id]/review

Allows HR to confirm, correct, reject, or annotate the evaluation.

Input may include:

```text
reviewerDecision
reviewerNotes
correctedCriterionResults?
expectedRevision?
```

Review writes must be auditable and concurrency-safe.

---

## 7. UI Design Draft

### Resume Detail

Resume detail should show a list of evaluations for that resume:

- JobProfile title
- template or criteria snapshot label
- score/rating suggestion if present
- HR review status
- created time
- reviewed time

Actions:

- create evaluation for a selected reviewed JobProfile
- open evaluation detail

### JobProfile Detail

JobProfile detail should show evaluations under that role:

- resume file name or Candidate summary
- latest revision reference
- evaluation status
- reviewer decision
- created/reviewed timestamps

This helps recruiters review all resumes being considered for one role.

### Evaluation Detail

Evaluation detail should show:

- score
- rating
- summary and reasons
- evidence
- strengths
- weaknesses
- risk flags
- phone screen questions
- interview questions
- reviewer decision
- reviewer notes
- model and prompt metadata
- resume revision and parsed snapshot IDs

The UI must separate:

```text
AI suggestion
HR decision
```

No page should imply automatic rejection, automatic hiring, or automatic pipeline movement.

---

## 8. Prompt / AI Analysis Boundary

M07 can start with a dedicated ResumeJobEvaluation workflow. It does not need to introduce a generic `AIAnalysisRun` layer immediately.

The dedicated workflow should still reserve trace fields:

```text
modelProvider
modelName
promptVersion
inputHash
outputHash
```

Prompt files must live in `/prompts`. AI calls must happen through backend services only. Output must be JSON and schema validated before persistence.

M08 can later extract a generic AI Analysis Layer if multiple workflows share the same run, prompt, replay, and review infrastructure.

---

## 9. Non-Goals

M07-A does not implement:

- schema changes
- Prisma migration
- AI provider integration
- real scoring implementation
- automatic screening
- automatic candidate rejection
- Candidate Pipeline automatic movement
- Offer module
- Interview module
- Feishu two-way synchronization
- multi-model comparison UI
- prompt files
- runtime APIs

---

## 10. Risks And Decisions

### JobProfile Changes

JobProfile content changes over time. Evaluation must record the role standard used at the time of evaluation.

Decision:

- design for `JobProfileSnapshot` or equivalent `jobProfileVersion`
- do not rely on mutable JobProfile fields alone

### AI Score Misuse

AI score or rating may mislead HR if presented as a final decision.

Decision:

- label score/rating as suggestions
- require human review fields
- do not trigger pipeline movement from AI output

### PII In Parsed Text

Parsed resume text may contain contact details and other sensitive personal data.

Decision:

- do not log parsed text
- do not return full parsed text in list DTOs
- keep detailed access explicit and review-oriented

### Prompt Reproducibility

Without `promptVersion`, old evaluations cannot be explained or rerun.

Decision:

- every AI-generated evaluation must store prompt and model metadata
- `inputHash` and `outputHash` should identify exact input/output envelopes

### Rerun Semantics

Evaluation output should not overwrite old records when a prompt, model, parser, or criteria snapshot changes.

Decision:

- new evaluation or new immutable run for reruns
- keep audit events for human review changes

---

## 11. M07-B Implementation Recommendations

Recommended sequence:

1. Start with schema foundation.
2. Prefer reusing or evolving existing `ResumeEvaluationResult` if it can carry the Resume x JobProfile evaluation boundary cleanly.
3. Add `resumeRevisionId` and `parsedSnapshotId` references before AI evaluation is introduced.
4. Keep `CandidateResume` DTOs compatible with M06.
5. Start with mock or rule-based evaluation to verify the data chain.
6. Add AI provider integration only after the persistence and review boundary is stable.
7. Ensure all writes record the actual `resumeRevisionId` and `parsedSnapshotId` used.
8. Preserve human review and event history.
9. Add tests for multiple JobProfiles per Resume and reruns for the same Resume x JobProfile.
10. Do not add automatic rejection, ranking, or pipeline movement.

M07-B should explicitly decide whether the implementation name remains `ResumeEvaluationResult` or migrates toward `ResumeJobEvaluation`.
