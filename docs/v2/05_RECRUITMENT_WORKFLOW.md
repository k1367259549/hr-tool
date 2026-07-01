# 05_RECRUITMENT_WORKFLOW.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-004 — Recruitment Workflow

---

## 1. Purpose

This document redesigns the complete recruitment workflow for hr-tool V2.

It is an architecture document only. It does not implement code, define database tables, create APIs, connect Feishu, define scoring standards, or modify V1.

The workflow reuses V1 concepts where they remain useful:

- structured daily recruiting data
- backend-only AI workflows
- prompt-based AI analysis
- JSON-only AI outputs
- schema validation
- service layer orchestration
- repository layer persistence in future implementation

V2 expands these concepts from daily work tracking into a full recruitment workspace.

---

## 2. Workflow Overview

The V2 recruitment workflow has nine major stages:

```text
1. Job Profile Setup
2. Evaluation Template Preparation
3. Resume Intake
4. Resume Parsing And Library Processing
5. AI Evaluation And Classification
6. Candidate Library Curation
7. Pipeline Execution
8. Phone Screen / Interview / Offer
9. Talent Map And Representative Candidate Learning
```

High-level flow:

```text
Job Profile
  -> Evaluation Template
  -> Resume Library
  -> Resume Parsing
  -> Evaluation Result
  -> Classification
  -> Candidate Library
  -> Pipeline
  -> Phone Screen
  -> Interview
  -> Offer
  -> Talent Map
  -> Representative Candidate Model
```

---

## 3. Stage 1 — Job Profile Setup

### 3.1 Goal

Define the hiring context.

### 3.2 Inputs

- job description
- hiring owner
- department
- target role
- hiring priority
- location or work mode
- headcount

### 3.3 Outputs

- Job Profile
- initial recruiting context for AI workflows
- anchor for Pipeline and Talent Map

### 3.4 AI Touchpoints

AI may assist with:

- normalizing job description text
- extracting responsibilities and qualifications
- summarizing role context
- identifying missing job profile information

AI must not define scoring standards.

---

## 4. Stage 2 — Evaluation Template Preparation

### 4.1 Goal

Prepare an extensible evaluation framework for the Job Profile.

### 4.2 Inputs

- Job Profile
- optional reusable template
- optional historical templates

### 4.3 Outputs

- Evaluation Template
- template version
- expected AI output schema reference

### 4.4 Rules

- Template is configurable.
- Template is versionable.
- Template is reusable.
- Template is empty by default.
- Template does not define scoring criteria in this architecture task.

### 4.5 AI Touchpoints

AI may assist with:

- suggesting missing template sections
- checking template completeness
- converting recruiter notes into structured template drafts

Human review remains required before template activation.

---

## 5. Stage 3 — Resume Intake

### 5.1 Goal

Collect resumes from multiple future sources.

### 5.2 Inputs

- uploaded resume
- pasted resume text
- future Feishu document source
- future referral source
- future chat summary source

### 5.3 Outputs

- Resume record in Resume Library
- original resume reference
- intake metadata

### 5.4 Rules

- Intake should preserve the original resume.
- Intake should not immediately create a Candidate unless identity confidence is sufficient.
- Intake should not directly enter Pipeline without classification.

### 5.5 AI Touchpoints

AI is optional at intake. Basic validation should not require AI.

---

## 6. Stage 4 — Resume Parsing And Library Processing

### 6.1 Goal

Transform raw resume input into structured data.

### 6.2 Flow

```text
Resume
  -> Parsed Resume
  -> Structure-aware Chunks
  -> Semantic Chunks
```

### 6.3 Outputs

- parsed resume fields
- section-level chunks
- semantic chunks
- parsing quality signal

### 6.4 AI Touchpoints

AI may assist with:

- extracting structured resume fields
- normalizing work history
- identifying missing information
- generating semantic chunks

Rules:

- Parsed output must be valid JSON.
- Parsed output must be schema validated.
- AI must not invent missing resume information.

---

## 7. Stage 5 — AI Evaluation And Classification

### 7.1 Goal

Evaluate resume/candidate fit against a Job Profile using an Evaluation Template.

### 7.2 Inputs

- Job Profile
- Evaluation Template
- Parsed Resume
- Resume chunks

### 7.3 Outputs

- Evaluation Result
- classification suggestion
- follow-up questions
- missing evidence summary

### 7.4 AI Touchpoints

AI may assist with:

- summarizing candidate fit
- identifying strengths
- identifying risks
- generating interview questions
- suggesting classification labels

### 7.5 Rules

- AI calls must happen in backend services.
- Prompts must be loaded from `/prompts`.
- Output must be JSON.
- Output must be schema validated.
- Evaluation Results must reference the Evaluation Template version.
- No scoring standards are defined here.

---

## 8. Stage 6 — Candidate Library Curation

### 8.1 Goal

Convert evaluated resumes into curated candidate assets.

### 8.2 Inputs

- Resume
- Parsed Resume
- Evaluation Result
- classification

### 8.3 Outputs

- Candidate
- Candidate Library entry
- linked Resume
- linked Evaluation Result

### 8.4 Rules

- Candidate and Resume remain separate objects.
- Candidate may have multiple resumes.
- Candidate Library supports both active recruiting and long-term talent pool use.
- Candidate identity resolution should be explicit in future implementation.

### 8.5 AI Touchpoints

AI may assist with:

- candidate summary generation
- duplicate candidate detection suggestions
- talent tags
- follow-up task suggestions

AI suggestions should not automatically overwrite recruiter decisions.

---

## 9. Stage 7 — Pipeline Execution

### 9.1 Goal

Move candidates through the recruiting process for a Job Profile.

### 9.2 Flow

```text
Candidate Library
  -> Pipeline
  -> Phone Screen
  -> Interview
  -> Offer
  -> Outcome
```

### 9.3 Outputs

- pipeline stage history
- current candidate stage
- next action
- recruiting funnel visibility

### 9.4 AI Touchpoints

AI may assist with:

- next-step suggestions
- bottleneck summaries
- stale candidate detection
- pipeline health summaries

No stage movement should be fully automated without recruiter confirmation in early versions.

---

## 10. Stage 8 — Phone Screen

### 10.1 Goal

Qualify candidate availability, motivation, communication, and basic fit before formal interviews.

### 10.2 Inputs

- Candidate
- Job Profile
- Evaluation Result
- recruiter notes

### 10.3 Outputs

- Phone Screen record
- summary
- next step
- optional Evaluation Result

### 10.4 AI Touchpoints

AI may assist with:

- phone screen question generation
- note summarization
- risk extraction
- follow-up task generation

---

## 11. Stage 9 — Interview

### 11.1 Goal

Capture structured interview events and feedback.

### 11.2 Inputs

- Candidate
- Job Profile
- prior Evaluation Results
- Phone Screen summary
- interviewer feedback

### 11.3 Outputs

- Interview record
- feedback summary
- next step
- optional Evaluation Result

### 11.4 AI Touchpoints

AI may assist with:

- interview question generation
- feedback summarization
- missing evidence detection
- comparison with Job Profile context

AI must not invent interviewer feedback.

---

## 12. Stage 10 — Offer

### 12.1 Goal

Track the final hiring proposal and candidate decision.

### 12.2 Inputs

- Candidate
- Job Profile
- Interview results
- recruiter notes
- approval context

### 12.3 Outputs

- Offer record
- offer status
- candidate decision
- onboarding handoff status

### 12.4 AI Touchpoints

AI may assist with:

- offer risk summary
- candidate concern summary
- onboarding handoff summary
- recruiter follow-up checklist

AI must not generate compensation rules or approval standards.

---

## 13. Stage 11 — Talent Map

### 13.1 Goal

Organize accumulated candidate and market intelligence around a Job Profile or talent segment.

### 13.2 Inputs

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes

### 13.3 Outputs

- Talent Map view
- talent segments
- market observations
- candidate grouping
- representative model inputs

### 13.4 AI Touchpoints

AI may assist with:

- grouping candidate patterns
- summarizing market observations
- identifying common strengths and risks
- comparing accumulated candidates against role context

No ranking thresholds are defined here.

---

## 14. Stage 12 — Representative Candidate Model

### 14.1 Goal

Generate synthetic representative profiles from accumulated data.

### 14.2 Inputs

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes
- Talent Map segments

### 14.3 Outputs

- Representative Candidate Model
- versioned model profile
- category summary

Example categories:

- Excellent
- Good
- Average
- Reject

These categories are examples only. This document does not define scoring thresholds or criteria.

### 14.4 AI Touchpoints

AI may assist with:

- synthesizing category profiles
- summarizing common signals
- identifying evidence patterns
- generating recruiter-facing explanations

AI-generated models must remain grounded in accumulated system data.

---

## 15. Complete AI Touchpoint Map

```text
Job Profile
  -> AI role context normalization

Evaluation Template
  -> AI structure suggestions

Resume
  -> AI parsing
  -> AI chunking

Evaluation Result
  -> AI resume evaluation
  -> AI follow-up questions

Candidate Library
  -> AI candidate summary
  -> AI duplicate suggestions

Pipeline
  -> AI next-step suggestions
  -> AI bottleneck summaries

Phone Screen
  -> AI question suggestions
  -> AI note summary

Interview
  -> AI question suggestions
  -> AI feedback summary

Offer
  -> AI risk summary
  -> AI handoff checklist

Talent Map
  -> AI segment summary

Representative Candidate Model
  -> AI model synthesis
```

---

## 16. Feishu Boundary In Workflow

Feishu can be introduced later as an external collaboration source.

Possible future Feishu inputs:

- documents
- chat summaries
- calendar events
- approval status
- Base/Bitable records

Feishu must not change the domain workflow. It should feed or sync domain objects through backend integration services.

```text
Feishu Source
  -> Feishu Provider
  -> Normalizer
  -> V2 Service
  -> Domain Object
```

No real Feishu API is connected in this task.

---

## 17. V1 Compatibility

V2 workflow must not modify V1 behavior.

V1 remains responsible for:

- daily logs
- dashboard summaries
- daily AI review
- tomorrow planner
- knowledge base
- settings
- spreadsheet analysis

V2 may reuse V1 infrastructure but should keep its domain workflow independent.

---

## 18. Explicit Non-Goals

This document does not:

- implement code
- design database tables
- create APIs
- connect Feishu
- define scoring standards
- define scoring criteria
- change V1 workflows
- introduce authentication
- introduce vector storage
- define a final ATS workflow

---

## 19. Future Implementation Sequence

Recommended implementation order:

1. Define V2 database schema from the domain model.
2. Add repository and service layers for Job Profile, Resume, Candidate, and Pipeline.
3. Add read/write APIs behind service layer.
4. Add UI forms and lists.
5. Add AI parsing/evaluation workflows using prompt files.
6. Add Evaluation Template versioning.
7. Add Talent Map and Representative Candidate Model workflows.
8. Add Feishu provider and sync logs.

Each implementation stage should pass build, lint, typecheck, Docker startup, and route/API checks before moving forward.
