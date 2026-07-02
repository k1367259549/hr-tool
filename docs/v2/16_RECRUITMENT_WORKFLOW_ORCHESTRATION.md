# 16_RECRUITMENT_WORKFLOW_ORCHESTRATION.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-009 - Recruitment Workflow Orchestration Architecture

---

## 1. Purpose

This document defines the Recruitment Workflow Orchestration Architecture for hr-tool V2.

The workflow engine coordinates recruiting workflows across domain modules, AI Intelligence, recruiter review, feedback, and Learning Assets.

This is an architecture document only. It does not implement code, define database tables, create APIs, define prompts, define scoring standards, connect Feishu, modify V1, or redesign existing modules.

The architecture reuses:

- `ARCHITECTURE_PRINCIPLES.md`
- `docs/v2/04_RECRUITMENT_DOMAIN_MODEL.md`
- `docs/v2/05_RECRUITMENT_WORKFLOW.md`
- `docs/v2/06_RESUME_CANDIDATE_DATA_MODEL.md`
- `docs/v2/07_AI_RECRUITMENT_INTELLIGENCE.md`
- `docs/v2/08_AI_MODULES.md`
- `docs/v2/09_AI_DATA_FLOW.md`
- `docs/v2/11_RECRUITMENT_INTELLIGENCE_LEARNING.md`
- `docs/v2/14_FEEDBACK_AND_LEARNING_LOOP.md`
- `docs/v2/15_V2_IMPLEMENTATION_PLAN.md`

---

## 2. Core Principle

Business modules never call each other directly.

Instead:

```text
Workflow Engine
  -> coordinates
  -> Domain Modules
  -> AI Intelligence
  -> Recruiter Review
  -> Learning Assets
```

Example:

```text
Resume Uploaded
  -> Workflow Engine
  -> Resume Library
  -> Resume Parser
  -> Evaluation Engine
  -> Recruiter Review
  -> Candidate Library
```

The workflow engine owns orchestration. Domain modules own business logic.

---

## 3. Architecture Position

The workflow engine sits above domain services and below API/UI entry points.

```text
UI / API / External Trigger
  -> Workflow Engine
  -> Domain Service
  -> Repository

Workflow Engine
  -> AI Intelligence Module
  -> AI Provider Adapter

Workflow Engine
  -> Human Review Queue
  -> Review Feedback
  -> Learning Asset Draft
```

Rules:

- UI does not coordinate cross-module workflows directly.
- API routes should start or advance workflows through workflow-facing service methods.
- Domain modules do not import each other for cross-module actions.
- AI modules are triggered through workflow orchestration or domain services, never from UI.
- Workflow records and audit records must not contain secrets or unnecessary raw personal data.

---

## 4. Workflow Engine Responsibilities

The workflow engine is responsible for:

- workflow coordination
- state transitions
- event dispatch
- human approval gates
- AI task triggering
- audit recording
- retry strategy
- failure recovery
- cancellation handling
- idempotency guidance
- preserving source references
- routing workflow outputs back to owning domain modules

The workflow engine is not responsible for:

- defining Job Profile content rules
- parsing resume facts itself
- evaluating candidates itself
- deciding whether a candidate should be hired
- defining scoring standards
- defining classification thresholds
- writing prompts
- owning Feishu API logic
- directly accessing Prisma
- replacing service-layer business logic

---

## 5. Workflow Types

### 5.1 Resume Intake Workflow

Purpose:

- receive a Resume into Resume Library and prepare it for parsing and review.

Coordinates:

- Resume Library
- duplicate signal checks
- AI Resume Parser if allowed
- Recruiter Review

Main output:

- Resume intake state and parsing readiness.

### 5.2 Resume Parsing Workflow

Purpose:

- turn Original Resume into Parsed Resume, structure-aware chunks, and semantic chunk placeholders.

Coordinates:

- Resume Library
- AI Intelligence Resume Parser
- Resume Analyzer
- Review Feedback

Main output:

- reviewed or reviewable Parsed Resume.

### 5.3 Evaluation Workflow

Purpose:

- create a contextual Evaluation Result for a Resume, Parsed Resume, Candidate, Phone Screen, Interview, or Offer readiness context.

Coordinates:

- Job Profile
- Evaluation Template
- Resume Library
- Candidate Library
- Evaluation Result
- AI Evaluation Engine
- Recruiter Review

Main output:

- reviewed or reviewable Evaluation Result.

### 5.4 Candidate Conversion Workflow

Purpose:

- move a reviewed Resume from Resume Library into Candidate Library or link it to an existing Candidate.

Coordinates:

- Resume Library
- Candidate Library
- Evaluation Result
- Review Feedback

Main output:

- Candidate created, Resume linked, Resume retained, archived, or marked duplicate.

### 5.5 Pipeline Workflow

Purpose:

- coordinate candidate movement for a Job Profile.

Coordinates:

- Candidate Library
- Pipeline
- Phone Screen
- Interview
- Offer
- Evaluation Result
- AI next-action suggestions when approved

Main output:

- auditable pipeline stage history.

### 5.6 Phone Screen Workflow

Purpose:

- support early qualification and evidence gathering.

Coordinates:

- Candidate Library
- Job Profile
- Evaluation Result
- Phone Screen
- Question Generator
- Review Feedback

Main output:

- Phone Screen record, reviewed notes, optional Evaluation Result.

### 5.7 Interview Workflow

Purpose:

- support interview planning, feedback capture, and missing evidence review.

Coordinates:

- Candidate Library
- Job Profile
- Evaluation Template
- Interview
- Question Generator
- Evaluation Result
- Review Feedback

Main output:

- Interview record, feedback summary, optional Evaluation Result.

### 5.8 Offer Workflow

Purpose:

- track offer readiness, offer status, and final candidate outcome.

Coordinates:

- Candidate Library
- Job Profile
- Interview
- Offer
- Pipeline
- Review Feedback

Main output:

- Offer status and outcome history.

### 5.9 Talent Map Workflow

Purpose:

- build role-centered talent landscape summaries from reviewed operational data.

Coordinates:

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Result
- Pipeline
- Talent Map
- AI Talent Map Generator
- Recruiter Review

Main output:

- reviewed Talent Map draft or active Talent Map view.

### 5.10 Learning Asset Workflow

Purpose:

- convert reviewed Decision Support and recruiter feedback into versioned Learning Assets.

Coordinates:

- Review Feedback
- Knowledge
- Representative Models
- Recruitment Models
- Talent Map
- AI Knowledge Generator
- Recruiter Review

Main output:

- approved, rejected, archived, or superseded Learning Asset version.

---

## 6. Orchestration Pattern

Every workflow follows this conceptual pattern:

```text
Trigger
  -> Validate workflow prerequisites
  -> Load current workflow state
  -> Dispatch event
  -> Call owning domain service
  -> Optionally call AI Intelligence
  -> Persist domain result through owning service
  -> Request human review if required
  -> Advance state
  -> Write audit record
  -> Emit next event
```

The workflow engine may decide sequence and gates. It must not decide domain truth.

---

## 7. AI Orchestration

AI is triggered by workflow rules, but AI modules remain independent.

```text
Workflow Engine
  -> AI Module Request
  -> AI Orchestrator
  -> Input Builder
  -> Prompt Version
  -> Provider Adapter
  -> Structured Output
  -> Schema Validation
  -> Audit
  -> Workflow Engine
  -> Human Review
```

Rules:

- AI output is Decision Support unless explicitly reviewed into a Learning Asset.
- AI output must be structured and schema validated.
- AI failure must not corrupt domain data.
- AI provider must remain model-independent.
- Prompt text is not defined in this architecture task.

---

## 8. Human Review Orchestration

Human review is a workflow gate, not optional UI polish.

```text
AI Output / Workflow Proposal
  -> Review Required
  -> Recruiter Approves / Modifies / Rejects
  -> Feedback Captured
  -> Workflow Continues / Retries / Cancels / Archives
```

Mandatory review gates include:

- AI parsing uncertainty
- Candidate creation
- Candidate linking or duplicate merge
- Evaluation Result acceptance
- Pipeline movement suggested by AI
- generated phone screen or interview questions before use
- Talent Map publication
- Representative Model publication
- Learning Asset publication
- Offer recommendation or offer risk interpretation

---

## 9. Failure Recovery Principles

Workflow recovery must preserve existing domain data.

Common recovery options:

- retry AI task
- ask recruiter for manual review
- move workflow to `needs_input`
- mark workflow as `blocked`
- cancel workflow
- archive source object
- keep item in current library without advancing
- create safe audit record

Failures must not:

- delete source records automatically
- overwrite historical AI outputs
- convert unreviewed output into Learning Assets
- silently advance candidates
- expose secrets or raw sensitive data in logs

---

## 10. Workflow Audit

Every workflow action should be auditable.

Minimum audit fields:

```text
actor
timestamp
source
workflowId
eventId
workflowType
stateBefore
stateAfter
action
domainObjectType
domainObjectId
AI provider if applicable
AI model if applicable
prompt version if applicable
input hash if applicable
review decision if applicable
error code if applicable
```

Audit must answer:

- what happened
- who or what triggered it
- which workflow state changed
- which domain object was affected
- whether AI was involved
- whether human review occurred
- why the workflow advanced, retried, stopped, or failed

---

## 11. Future Workflow Extensibility

The workflow engine should support future workflow types without redesign:

- Batch Resume Import
- Campus Recruitment
- Internal Referral
- Executive Hiring
- External ATS Integration
- Feishu Sync
- Recruitment Campaign
- Talent Pool Refresh
- Model Review Cycle

New workflows should add:

- workflow type
- states
- events
- approval gates
- retry rules
- audit requirements
- module coordination map

They should not require existing modules to call each other directly.

---

## 12. Relationship To Existing Modules

### Job Profile

The workflow engine requests Job Profile context and routes Job Profile draft confirmation. Job Profile owns role content and lifecycle.

### Evaluation Template

The workflow engine ensures Evaluation Results reference the correct template version. Evaluation Template owns template configuration and versioning.

### Resume Library

The workflow engine coordinates intake, parsing, review, duplicate handling, and conversion decisions. Resume Library owns resume artifacts and parsing states.

### Candidate Library

The workflow engine coordinates candidate creation and linking after review. Candidate Library owns candidate identity and profile lifecycle.

### Evaluation Result

The workflow engine coordinates generation, review, correction, retry, and downstream use. Evaluation Result owns the evaluation record and review metadata.

### Pipeline

The workflow engine coordinates stage movement requests and related events. Pipeline owns stage history and current stage state.

### Phone Screen

The workflow engine coordinates question suggestions, note capture, and optional evaluation. Phone Screen owns its record content.

### Interview

The workflow engine coordinates interview question suggestions, feedback capture, and optional evaluation. Interview owns interview records.

### Offer

The workflow engine coordinates offer readiness, offer status events, and outcome feedback. Offer owns offer records and status.

### Talent Map

The workflow engine coordinates Talent Map generation and publication review. Talent Map owns talent landscape views.

### Representative Models

The workflow engine coordinates model draft creation and approval gates. Representative Models own versioned model assets.

### AI Intelligence

The workflow engine triggers AI modules and routes results to review. AI Intelligence owns provider-independent generation, validation, and AI metadata.

### Review Feedback

The workflow engine captures review decisions and routes them to feedback lifecycle. Review Feedback owns feedback records and learning signals.

---

## 13. Explicit Non-Goals

This document does not:

- implement code
- define database schema
- create APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- redesign existing modules
- introduce autonomous hiring decisions
- introduce autonomous offer decisions
- introduce vector database, RAG, or memory server

---

## 14. Readiness For Future Work

This document should guide future implementation of:

- workflow service boundaries
- workflow state machine
- workflow event catalog
- human review queue
- retry and failure recovery rules
- workflow audit records
- AI task orchestration
- Learning Asset approval workflows

Implementation must preserve module independence, service-layer ownership, model independence, human review, and auditability.
