# 09_AI_DATA_FLOW.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-006 - AI Data Flow

---

## 1. Purpose

This document defines AI data flow for hr-tool V2.

It explains how domain data moves through AI modules, how structured outputs return to the recruitment workflow, and how audit and human review remain attached to every AI output.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, or modify V1.

---

## 2. Global AI Data Flow

```text
Domain Object
  -> Service Layer
  -> AI Module Request
  -> Input Builder
  -> Prompt Version
  -> Provider Adapter
  -> Model Output
  -> JSON Parser
  -> Schema Validator
  -> AI Result Envelope
  -> Audit Record
  -> Human Review
  -> Domain Persistence
```

Rules:

- UI never calls AI providers directly.
- API routes never call AI providers directly.
- Service Layer orchestrates all AI workflows.
- AI outputs must be structured and validated.
- Invalid AI outputs must not become domain truth.
- Human review must remain available for every AI-generated judgment.

---

## 3. Data Flow Envelope

Every AI pipeline should preserve a consistent envelope.

Conceptual fields:

```text
AI Result Envelope
  module
  provider
  model
  promptFile
  promptVersion
  inputBuilderVersion
  outputSchemaVersion
  inputHash
  rawOutputReference
  parsedOutput
  validationStatus
  latencyMs
  tokenUsage
  createdAt
  reviewStatus
```

This is not a database table definition. It is a data flow contract for future implementation.

---

## 4. Pipeline A - Job Profile Intelligence

### 4.1 Flow

```text
Recruiter Input
  -> Job Profile Service
  -> Job Profile Generator
  -> Structured Job Profile Draft
  -> Recruiter Review
  -> Confirmed Job Profile
  -> Evaluation Template Preparation
```

### 4.2 Inputs

- recruiter job description
- role notes
- department and hiring context
- optional historical Job Profiles

### 4.3 Outputs

- Job Profile draft
- missing information warnings
- role summary
- extraction confidence signal

### 4.4 Review Point

Recruiter must review and confirm the Job Profile before it anchors Evaluation Results.

### 4.5 Audit Point

Record:

- input hash
- prompt version
- provider/model
- validation status
- recruiter confirmation status

---

## 5. Pipeline B - Evaluation Template Assistance

### 5.1 Flow

```text
Job Profile
  -> Evaluation Template Service
  -> Template Assistance Module
  -> Template Draft Suggestions
  -> Recruiter Review
  -> Evaluation Template Version
```

### 5.2 Inputs

- Job Profile
- recruiter notes
- existing reusable templates if available

### 5.3 Outputs

- template section suggestions
- missing section warnings
- expected output schema reference

### 5.4 Constraints

- template is configurable and versionable
- template remains empty by default
- no scoring criteria are defined by this pipeline

---

## 6. Pipeline C - Resume Intake To Parsed Resume

### 6.1 Flow

```text
Original Resume
  -> Resume Intake Service
  -> Text Extraction
  -> Resume Parser
  -> Parsed Resume
  -> Parsing Status
  -> Recruiter Review / Correction
```

### 6.2 Inputs

- original resume file or text
- source metadata
- intake timestamp
- file metadata

### 6.3 Outputs

- Parsed Resume
- parsing confidence
- parsing warnings
- ambiguous fields
- missing fields

### 6.4 Failure Branches

```text
Original Resume
  -> Text Extraction Failed
  -> parse_failed
  -> Recruiter Manual Review

Original Resume
  -> AI Parser Invalid JSON
  -> needs_review
  -> Retry / Manual Correction
```

### 6.5 Audit Point

Do not log raw resume text. Store or reference raw output according to privacy rules.

---

## 7. Pipeline D - Resume Chunking And Evidence Map

### 7.1 Flow

```text
Parsed Resume
  -> Resume Analyzer
  -> Structure-aware Chunks
  -> Semantic Chunks
  -> Evidence Map
  -> Evaluation Input Package
```

### 7.2 Inputs

- Parsed Resume
- original text sections
- optional Job Profile context

### 7.3 Outputs

- structure-aware chunks
- semantic chunks
- source references
- confidence signals
- evidence map

### 7.4 Constraints

- semantic chunks must reference source chunks
- no vector storage is required by this architecture
- missing evidence must be explicit

---

## 8. Pipeline E - Resume Evaluation

### 8.1 Flow

```text
Job Profile
  + Evaluation Template Version
  + Parsed Resume
  + Resume Chunks
  -> Evaluation Engine
  -> Evaluation Result
  -> Recruiter Review
  -> Candidate Conversion Decision
```

### 8.2 Inputs

- Job Profile
- Evaluation Template version
- Parsed Resume
- structure-aware chunks
- semantic chunks
- source metadata summary

### 8.3 Outputs

- summary
- strengths
- weaknesses
- risks
- missing evidence
- high-score reasons placeholder
- score placeholder
- classification placeholder
- phone screen questions
- interview questions
- explainability fields

### 8.4 Human Review Branch

```text
Evaluation Result
  -> accepted
  -> corrected
  -> overridden
  -> rejected_as_invalid
  -> needs_regeneration
```

### 8.5 Conversion Branch

```text
Evaluation Result
  -> Remain in Resume Library
  -> Convert to Candidate
  -> Link to Existing Candidate
  -> Archive
  -> Mark Duplicate
  -> Keep for Future Talent Pool
```

No branch is selected solely by hidden AI rules.

---

## 9. Pipeline F - Candidate Library Intelligence

### 9.1 Flow

```text
Candidate
  + Linked Resumes
  + Evaluation Results
  + Pipeline Status
  + Notes
  -> Candidate Summarizer
  -> Candidate Summary
  -> Recruiter Review
  -> Candidate Library Display / Notes
```

### 9.2 Inputs

- Candidate identity
- contact metadata summary
- linked resume summaries
- latest Evaluation Results
- pipeline status per Job Profile
- recruiter notes

### 9.3 Outputs

- candidate summary
- latest status summary
- key evidence
- risks
- missing evidence
- suggested next review actions

### 9.4 Constraints

- sensitive contact details should be minimized in AI input
- Candidate summary is not final decision truth

---

## 10. Pipeline G - Phone Screen Intelligence

### 10.1 Flow

```text
Candidate
  + Job Profile
  + Evaluation Result
  -> Question Generator
  -> Phone Screen Questions
  -> Recruiter Edit
  -> Phone Screen
  -> Note Summarization
  -> Optional Evaluation Result
```

### 10.2 Inputs

- Candidate
- Job Profile
- Evaluation Result
- missing evidence
- risk notes
- recruiter notes

### 10.3 Outputs

- phone screen questions
- question purpose
- evidence gap addressed
- phone screen summary after notes exist
- follow-up tasks

### 10.4 Constraints

- generated questions must be recruiter-editable
- AI must not infer protected personal information
- AI must not invent phone screen answers

---

## 11. Pipeline H - Interview Intelligence

### 11.1 Flow

```text
Candidate
  + Job Profile
  + Evaluation Result
  + Phone Screen Summary
  -> Question Generator
  -> Interview Questions
  -> Interview
  -> Feedback Summarization
  -> Missing Evidence Detection
  -> Optional Evaluation Result
```

### 11.2 Inputs

- Candidate
- Job Profile
- Evaluation Template version
- prior Evaluation Results
- Phone Screen summary
- interviewer feedback when available

### 11.3 Outputs

- interview question suggestions
- feedback summary
- missing evidence notes
- risk updates
- optional Evaluation Result

### 11.4 Constraints

- AI must not invent interviewer feedback
- interviewer-authored content must remain distinguishable from AI summary

---

## 12. Pipeline I - Offer Intelligence

### 12.1 Flow

```text
Candidate
  + Job Profile
  + Interview Results
  + Offer Context
  -> Offer Intelligence Module
  -> Offer Risk Summary
  -> Follow-up Checklist
  -> Recruiter Review
```

### 12.2 Inputs

- Candidate
- Job Profile
- Interview records
- Offer status
- recruiter notes

### 12.3 Outputs

- offer risk summary
- candidate concern summary
- onboarding handoff summary
- follow-up checklist

### 12.4 Constraints

- AI does not create compensation rules
- AI does not approve offers
- AI does not replace recruiter or management approval

---

## 13. Pipeline J - Recruitment Analytics

### 13.1 Flow

```text
RecruitLog
  + Dashboard KPI
  + Pipeline History
  + Candidate Library
  + Evaluation Results
  + Interview / Offer Records
  -> Recruitment Analytics
  -> Recruiting Intelligence Report
  -> Recruiter Review
  -> Knowledge Generator
```

### 13.2 Inputs

- V1 RecruitLog and KPI summaries
- V2 Pipeline history
- Candidate Library
- source/channel data
- Interview and Offer records

### 13.3 Outputs

- funnel observations
- bottleneck summaries
- channel analysis
- trend summaries
- data completeness warnings
- action suggestions

### 13.4 Constraints

- deterministic KPI calculation should happen before AI interpretation
- AI must not invent missing metrics
- missing data should be reported

---

## 14. Pipeline K - Talent Map

### 14.1 Flow

```text
Job Profile
  + Candidate Library
  + Resume Library
  + Evaluation Results
  + Pipeline Outcomes
  -> Talent Map Generator
  -> Talent Segments
  -> Recruiter Review
  -> Representative Candidate Generator
```

### 14.2 Inputs

- Job Profile
- candidate set
- resume set
- evaluation set
- pipeline outcome summary

### 14.3 Outputs

- talent segments
- common background patterns
- common strengths and risks
- market observations
- missing market evidence

### 14.4 Constraints

- no hidden ranking rules
- no automatic candidate rejection
- all segment summaries must be evidence-backed

---

## 15. Pipeline L - Representative Candidate Models

### 15.1 Flow

```text
Talent Map
  + Job Profile
  + Candidate Library
  + Evaluation Results
  + Pipeline Outcomes
  -> Representative Candidate Generator
  -> Representative Candidate Model Version
  -> Recruiter Review
  -> Approved / Rejected / Revised Model
```

### 15.2 Inputs

- Talent Map
- Job Profile
- accumulated Candidate and Resume data
- Evaluation Results
- pipeline outcomes
- recruiter feedback

### 15.3 Outputs

- representative candidate profile
- category name
- evidence patterns
- common strengths
- common weaknesses
- common risks
- missing evidence notes

### 15.4 Constraints

- representative model is not a real person
- category labels are descriptive only
- no scoring thresholds are defined

---

## 16. Pipeline M - Knowledge Accumulation

### 16.1 Flow

```text
Evaluation Results
  + Recruiter Feedback
  + Phone Screen Notes
  + Interview Notes
  + Offer Outcomes
  + Analytics Reports
  + Talent Map Summaries
  -> Knowledge Generator
  -> Knowledge Drafts
  -> Recruiter Review
  -> Knowledge Base
```

### 16.2 Inputs

- source records
- AI outputs
- recruiter corrections
- accepted/rejected suggestions
- final outcomes

### 16.3 Outputs

- knowledge entries
- source references
- tags
- type suggestion
- quality notes
- prompt/model improvement signals

### 16.4 Constraints

- knowledge must be reviewable
- personal data should be minimized
- source references should remain available

---

## 17. Pipeline N - Feedback And Improvement Loop

### 17.1 Flow

```text
AI Output
  -> Recruiter Review
  -> Accept / Reject / Modify
  -> Feedback Record
  -> Quality Notes
  -> Prompt / Model Improvement Backlog
  -> Future Prompt Version
```

### 17.2 Inputs

- AI output
- reviewer decision
- manual correction
- reason for override
- outcome reference when available

### 17.3 Outputs

- feedback record
- quality note
- prompt improvement candidate
- model comparison signal

### 17.4 Constraints

- feedback does not automatically change prompts
- prompt updates require explicit versioning
- historical AI outputs remain linked to original versions

---

## 18. Cross-Pipeline Audit Flow

```text
AI Request
  -> Input Hash
  -> Provider Call
  -> Raw Output Reference
  -> Parsed Output
  -> Validation Result
  -> AI Request Log
  -> Human Review Log
```

Audit must support:

- debugging
- provider comparison
- prompt regression analysis
- cost and latency analysis
- recruiter trust review

Audit must not expose:

- API keys
- full database URL
- unnecessary raw personal data
- provider secrets

---

## 19. Error Flow

```text
AI Module Failure
  -> Normalize Error
  -> Log Safe Metadata
  -> Return Controlled Error
  -> Preserve Existing Domain Data
  -> Allow Retry / Manual Action
```

Failure categories:

- provider unavailable
- timeout
- invalid JSON
- schema validation failure
- missing required input
- unsafe input
- output rejected by reviewer

AI failure must not corrupt:

- Resume Library
- Candidate Library
- Pipeline
- Evaluation Result history
- Knowledge Base

---

## 20. Explicit Non-Goals

This document does not:

- implement pipelines
- define database tables
- define API routes
- define prompt text
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- introduce autonomous hiring decisions
