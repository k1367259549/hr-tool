# 18_WORKFLOW_EVENTS.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-009 - Workflow Events

---

## 1. Purpose

This document defines the conceptual event-driven architecture for hr-tool V2 recruitment workflow orchestration.

It designs events only. It does not implement code, define database tables, create APIs, define prompts, define scoring standards, connect Feishu, modify V1, or redesign existing modules.

---

## 2. Event Principles

Workflow events describe something that happened or something that needs orchestration.

Rules:

- Events coordinate modules without tight coupling.
- Events do not contain business logic.
- Events should carry references, not large raw sensitive payloads.
- Every event should be auditable.
- AI-related events must include provider/model metadata when available.
- Human review events must preserve reviewer decision and reason.
- Failed event handling must be retryable or recoverable.

---

## 3. Conceptual Event Envelope

Every event should preserve:

```text
eventId
eventType
workflowId
workflowType
producer
timestamp
actor
source
correlationId
causationId
payload
stateBefore
stateAfter
retryCount
auditRequired
```

Notes:

- `correlationId` groups events from the same workflow.
- `causationId` points to the event that caused this event.
- `actor` can be recruiter, system, AI module, import process, or future integration provider.
- payload should use domain object IDs and compact summaries where possible.

---

## 4. Event Catalog

### 4.1 `ResumeUploaded`

Producer:

- UI upload flow
- future Feishu import
- future ATS import

Consumers:

- Workflow Engine
- Resume Library
- Audit Writer

Payload:

```text
resumeId
sourceType
fileName
fileType
uploadedBy
sourceReference
```

Retry policy:

- retry intake validation if transient storage or parsing readiness check fails
- do not retry unsupported file rejection automatically

Audit requirement:

- required

### 4.2 `ResumeIntakeValidated`

Producer:

- Resume Intake Workflow

Consumers:

- Workflow Engine
- Resume Library

Payload:

```text
resumeId
validationStatus
warnings
duplicateSignals
```

Retry policy:

- retry duplicate signal calculation if transient

Audit requirement:

- required

### 4.3 `DuplicateReviewRequired`

Producer:

- Resume Intake Workflow
- Resume Library

Consumers:

- Human Review Queue
- Workflow Engine

Payload:

```text
resumeId
candidateDuplicateRefs
resumeDuplicateRefs
signals
confidenceSignal
```

Retry policy:

- not automatic; waits for recruiter review

Audit requirement:

- required

### 4.4 `ResumeParsingRequested`

Producer:

- Workflow Engine
- recruiter manual action

Consumers:

- AI Intelligence Resume Parser
- Resume Library
- Audit Writer

Payload:

```text
resumeId
parserMode
sourceTextReference
promptVersion
requestedBy
```

Retry policy:

- retry provider timeout according to workflow retry rules
- invalid input requires recruiter correction

Audit requirement:

- required

### 4.5 `ResumeParsed`

Producer:

- AI Resume Parser
- manual parser in future

Consumers:

- Workflow Engine
- Resume Library
- Human Review Queue
- Resume Analyzer

Payload:

```text
resumeId
parsedResumeId
parsingConfidence
warnings
aiProvider
aiModel
promptVersion
outputSchemaVersion
```

Retry policy:

- not retried after success
- follow-up chunking may retry independently

Audit requirement:

- required

### 4.6 `ResumeParseFailed`

Producer:

- AI Resume Parser
- Resume Parsing Workflow

Consumers:

- Workflow Engine
- Resume Library
- Human Review Queue
- Audit Writer

Payload:

```text
resumeId
errorCode
safeErrorMessage
retryable
attemptNumber
```

Retry policy:

- retry if timeout or provider unavailable
- no automatic retry for invalid JSON beyond configured retry limit
- manual review if repeated failure

Audit requirement:

- required

### 4.7 `ResumeReviewed`

Producer:

- Recruiter Review

Consumers:

- Workflow Engine
- Resume Library
- Review Feedback

Payload:

```text
resumeId
parsedResumeId
decision
corrections
reviewer
reason
```

Retry policy:

- no automatic retry; correction save may be retried if transient

Audit requirement:

- required

### 4.8 `EvaluationRequested`

Producer:

- Workflow Engine
- recruiter manual action

Consumers:

- Evaluation Result
- AI Evaluation Engine
- Audit Writer

Payload:

```text
evaluatedObjectType
evaluatedObjectId
jobProfileId
evaluationTemplateId
templateVersion
requestedBy
```

Retry policy:

- retry only if prerequisites remain valid
- missing Job Profile or Template requires recruiter input

Audit requirement:

- required

### 4.9 `EvaluationGenerated`

Producer:

- AI Evaluation Engine

Consumers:

- Workflow Engine
- Evaluation Result
- Human Review Queue
- Review Feedback

Payload:

```text
evaluationResultId
evaluatedObjectType
evaluatedObjectId
jobProfileId
templateVersion
aiProvider
aiModel
promptVersion
validationStatus
```

Retry policy:

- not retried after valid generation
- regeneration requires explicit request

Audit requirement:

- required

### 4.10 `EvaluationGenerationFailed`

Producer:

- AI Evaluation Engine

Consumers:

- Workflow Engine
- Evaluation Result
- Audit Writer

Payload:

```text
evaluatedObjectType
evaluatedObjectId
jobProfileId
errorCode
safeErrorMessage
retryable
attemptNumber
```

Retry policy:

- retry provider timeout or temporary provider errors
- schema failure may retry once or request manual review

Audit requirement:

- required

### 4.11 `EvaluationReviewed`

Producer:

- Recruiter Review

Consumers:

- Workflow Engine
- Evaluation Result
- Review Feedback
- Candidate Conversion Workflow

Payload:

```text
evaluationResultId
decision
correctedFields
reviewer
reason
acceptedForWorkflow
```

Retry policy:

- no automatic retry

Audit requirement:

- required

### 4.12 `CandidateConversionRequested`

Producer:

- Workflow Engine
- recruiter manual action

Consumers:

- Candidate Library
- Resume Library
- Human Review Queue

Payload:

```text
resumeId
parsedResumeId
evaluationResultId
conversionIntent
targetJobProfileId
```

Retry policy:

- waits for recruiter confirmation if identity is uncertain

Audit requirement:

- required

### 4.13 `CandidateCreated`

Producer:

- Candidate Library

Consumers:

- Workflow Engine
- Pipeline
- Audit Writer

Payload:

```text
candidateId
resumeId
source
createdBy
targetJobProfileIds
```

Retry policy:

- not retried after success
- idempotency required in future implementation

Audit requirement:

- required

### 4.14 `ResumeLinkedToCandidate`

Producer:

- Candidate Library

Consumers:

- Workflow Engine
- Resume Library
- Audit Writer

Payload:

```text
candidateId
resumeId
linkReason
reviewer
identitySignals
```

Retry policy:

- not retried after success

Audit requirement:

- required

### 4.15 `PipelineMoved`

Producer:

- Pipeline
- recruiter action

Consumers:

- Workflow Engine
- Candidate Library
- Phone Screen
- Interview
- Offer
- Review Feedback

Payload:

```text
candidateId
jobProfileId
fromStage
toStage
reason
actor
aiSuggestionReference
```

Retry policy:

- not automatic if stage conflict occurs; requires current-state reload and human decision

Audit requirement:

- required

### 4.16 `PhoneScreenQuestionsGenerated`

Producer:

- AI Question Generator

Consumers:

- Workflow Engine
- Phone Screen
- Human Review Queue

Payload:

```text
candidateId
jobProfileId
evaluationResultId
questionsReference
aiProvider
aiModel
promptVersion
```

Retry policy:

- retry on provider timeout
- invalid questions require regeneration or manual questions

Audit requirement:

- required

### 4.17 `PhoneScreenCompleted`

Producer:

- Recruiter
- Phone Screen module

Consumers:

- Workflow Engine
- Evaluation Result
- Pipeline
- Review Feedback

Payload:

```text
phoneScreenId
candidateId
jobProfileId
summaryReference
nextStep
completedBy
```

Retry policy:

- no automatic retry

Audit requirement:

- required

### 4.18 `InterviewCompleted`

Producer:

- Interview module
- interviewer or recruiter

Consumers:

- Workflow Engine
- Evaluation Result
- Pipeline
- Offer
- Review Feedback

Payload:

```text
interviewId
candidateId
jobProfileId
round
feedbackReference
nextStep
completedBy
```

Retry policy:

- no automatic retry

Audit requirement:

- required

### 4.19 `OfferRecommendationReviewed`

Producer:

- Recruiter Review

Consumers:

- Workflow Engine
- Offer
- Pipeline
- Review Feedback

Payload:

```text
candidateId
jobProfileId
offerId
decision
reason
reviewer
aiSuggestionReference
```

Retry policy:

- no automatic retry

Audit requirement:

- required

### 4.20 `OfferAccepted`

Producer:

- Offer module
- recruiter confirmation

Consumers:

- Workflow Engine
- Pipeline
- Review Feedback
- Learning Asset Workflow

Payload:

```text
offerId
candidateId
jobProfileId
acceptedAt
confirmedBy
```

Retry policy:

- not automatic; correction requires audited update

Audit requirement:

- required

### 4.21 `OfferDeclined`

Producer:

- Offer module
- recruiter confirmation

Consumers:

- Workflow Engine
- Pipeline
- Review Feedback
- Learning Asset Workflow

Payload:

```text
offerId
candidateId
jobProfileId
declinedAt
declineReason
confirmedBy
```

Retry policy:

- not automatic; correction requires audited update

Audit requirement:

- required

### 4.22 `FeedbackSubmitted`

Producer:

- Recruiter Review

Consumers:

- Review Feedback
- Workflow Engine
- Learning Asset Workflow

Payload:

```text
sourceObjectType
sourceObjectId
feedbackType
reviewer
reason
corrections
qualityNotes
```

Retry policy:

- retry transient save failure
- do not lose original AI output if feedback fails

Audit requirement:

- required

### 4.23 `TalentMapGenerated`

Producer:

- AI Talent Map Generator

Consumers:

- Workflow Engine
- Talent Map
- Human Review Queue

Payload:

```text
talentMapId
jobProfileId
sourceScope
aiProvider
aiModel
promptVersion
validationStatus
```

Retry policy:

- retry transient AI failure
- data insufficiency requires recruiter action

Audit requirement:

- required

### 4.24 `TalentMapApproved`

Producer:

- Recruiter Review

Consumers:

- Workflow Engine
- Talent Map
- Representative Models
- Learning Asset Workflow

Payload:

```text
talentMapId
jobProfileId
approvedBy
modifications
reason
```

Retry policy:

- no automatic retry

Audit requirement:

- required

### 4.25 `RepresentativeModelGenerated`

Producer:

- AI Representative Candidate Generator

Consumers:

- Workflow Engine
- Representative Models
- Human Review Queue

Payload:

```text
modelDraftId
jobProfileId
sourceTalentMapId
sourceScope
aiProvider
aiModel
promptVersion
```

Retry policy:

- retry transient generation failure
- invalid draft requires regeneration or rejection

Audit requirement:

- required

### 4.26 `LearningAssetApproved`

Producer:

- Recruiter Review

Consumers:

- Workflow Engine
- Learning Asset module
- AI Intelligence context builders in future

Payload:

```text
learningAssetId
assetType
version
sourceReferences
approvedBy
reason
```

Retry policy:

- no automatic retry
- activation conflict requires human resolution

Audit requirement:

- required

### 4.27 `WorkflowCancelled`

Producer:

- recruiter
- Workflow Engine
- future integration process

Consumers:

- Workflow Engine
- Audit Writer
- relevant domain modules

Payload:

```text
workflowId
workflowType
reason
cancelledBy
stateAtCancellation
```

Retry policy:

- no automatic retry; resume requires explicit new workflow or reopen action

Audit requirement:

- required

### 4.28 `WorkflowFailed`

Producer:

- Workflow Engine

Consumers:

- Audit Writer
- Human Review Queue
- relevant domain module

Payload:

```text
workflowId
workflowType
failedState
errorCode
safeErrorMessage
retryable
attemptNumber
```

Retry policy:

- retry only when `retryable` is true and retry limit has not been reached
- otherwise move to manual review or blocked state

Audit requirement:

- required

---

## 5. Event Retry Policy

Conceptual retry classes:

```text
no_retry
manual_retry
automatic_retry_limited
requires_human_input
blocked_until_dependency_changes
```

Automatic retry may apply to:

- AI provider timeout
- temporary provider unavailable
- transient persistence failure
- temporary integration failure in future Feishu workflows

Manual review is required for:

- duplicate resume
- missing Job Profile
- invalid AI output after retry
- recruiter rejection
- stage conflict
- Learning Asset activation conflict

---

## 6. Event Audit Requirements

Every event should record:

- actor
- timestamp
- source
- workflow id
- event id
- state before
- state after
- domain object reference
- AI provider if applicable
- AI model if applicable
- prompt version if applicable
- review decision if applicable
- retry count
- safe error code if applicable

Audit must not store:

- API keys
- provider secrets
- full environment values
- unnecessary raw resume text
- unnecessary contact information

---

## 7. Future Event Support

Future workflows can introduce events for:

- BatchResumeImportStarted
- BatchResumeImportCompleted
- CampusRecruitmentCreated
- ReferralSubmitted
- ExternalATSRecordImported
- FeishuRecordSynced
- FeishuSyncFailed
- PromptVersionApproved
- ModelComparisonCompleted

Future events must keep the same envelope and audit expectations.

---

## 8. Explicit Non-Goals

This document does not:

- implement an event bus
- define database event tables
- define API route contracts
- define message queue infrastructure
- connect Feishu
- define prompts
- define scoring standards
- define classification thresholds
- modify V1
