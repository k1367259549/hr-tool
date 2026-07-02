# 08_AI_MODULES.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-006 - AI Module Design

---

## 1. Purpose

This document defines the independent AI modules for hr-tool V2.

The modules are designed as reusable recruitment intelligence capabilities. They assist domain services but do not own business decisions.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, or modify V1.

---

## 2. Module Design Rules

Each AI module must:

- be callable only from backend service layer orchestration
- consume structured domain input
- return structured output
- preserve prompt and provider metadata
- support schema validation
- support audit logging
- support recruiter review
- avoid provider-specific assumptions
- avoid hidden scoring standards

Common module lifecycle:

```text
Domain Service
  -> AI Module
  -> Input Builder
  -> Prompt Version
  -> Provider Adapter
  -> Structured Output Parser
  -> Schema Validation
  -> Audit
  -> Domain Service
```

---

## 3. Module Overview

Minimum V2 AI modules:

```text
Job Profile Generator
Resume Parser
Resume Analyzer
Evaluation Engine
Question Generator
Candidate Summarizer
Talent Map Generator
Representative Candidate Generator
Recruitment Analytics
Knowledge Generator
```

Supporting modules:

```text
AI Orchestrator
Prompt Registry
Input Builder Registry
Output Schema Registry
Provider Adapter Registry
Audit Writer
Human Feedback Collector
```

---

## 4. Job Profile Generator

### Purpose

Create a structured Job Profile draft from recruiter input.

### Input

- job title
- job description
- responsibilities
- required qualifications
- preferred qualifications
- department
- location or work mode
- hiring priority
- recruiter notes

### Output

- normalized Job Profile draft
- missing information warnings
- role summary
- evidence references to provided input
- confidence signal for extraction completeness

### Dependencies

- Job Profile domain model
- Prompt Registry
- Input Builder
- Schema Validator
- AI Provider Adapter

### Failure Handling

- if AI fails, recruiter can create Job Profile manually
- invalid output is rejected
- partial output is not treated as confirmed Job Profile
- failure is logged without exposing sensitive input

### Future Extensibility

- reusable Job Profile templates
- role comparison
- Feishu document import
- versioned Job Profile drafts

---

## 5. Resume Parser

### Purpose

Convert original resume content into Parsed Resume and extraction quality signals.

### Input

- original resume text
- file metadata
- source metadata
- language hints if available

### Output

- parsed identity signals
- contact signals
- work history
- education history
- project history
- skills
- certifications
- parsing confidence
- parsing warnings
- missing or ambiguous field notes

### Dependencies

- Resume model
- Parsed Resume model
- privacy filter
- Prompt Registry
- Output Schema Registry
- Provider Adapter

### Failure Handling

- resume remains in Resume Library with `parse_failed` or `needs_review` status
- recruiter can manually correct fields
- raw resume data is not logged
- invalid JSON is rejected

### Future Extensibility

- multi-language resume parsing
- non-AI deterministic extraction pre-step
- versioned parser outputs
- batch parsing

---

## 6. Resume Analyzer

### Purpose

Analyze resume content into structure-aware chunks, semantic chunks, evidence gaps, and duplicate signals.

### Input

- Original Resume
- Parsed Resume
- structure hints
- optional Job Profile context

### Output

- structure-aware chunks
- semantic chunks
- evidence map
- duplicate detection signals
- missing evidence notes
- confidence signals

### Dependencies

- Resume Parser output
- Resume Chunk model
- duplicate signal framework
- privacy filter
- Schema Validator

### Failure Handling

- preserve Parsed Resume even if analysis fails
- mark semantic analysis as unavailable
- allow recruiter to continue without semantic chunks
- log failure metadata only

### Future Extensibility

- retrieval-oriented chunking
- embedding generation in later versions
- representative evidence selection
- talent segment mapping

---

## 7. Evaluation Engine

### Purpose

Generate contextual Evaluation Results for Resume, Parsed Resume, Candidate, Phone Screen, Interview, or Offer readiness context.

### Input

- evaluated object
- Job Profile
- Evaluation Template version
- selected chunks
- prior Evaluation Results when relevant
- recruiter notes

### Output

- AI-generated summary
- strengths
- weaknesses
- risks
- missing evidence
- high-score reasons placeholder
- phone screen questions
- interview questions
- score placeholder
- classification placeholder
- explainability fields
- AI provider metadata

### Dependencies

- Job Profile
- Evaluation Template
- Evaluation Result model
- Prompt Registry
- Input Builder
- Output Schema Registry
- Provider Adapter
- Audit Writer

### Failure Handling

- no Evaluation Result is saved as valid if schema validation fails
- recruiter can retry or perform manual evaluation
- failure audit record is created where appropriate

### Future Extensibility

- multiple evaluation templates
- model comparison
- batch evaluation
- recruiter feedback-driven prompt improvement

### Constraints

- no score standards
- no classification thresholds
- no automatic hiring decisions

---

## 8. Question Generator

### Purpose

Generate targeted phone screen and interview questions based on evidence gaps and role context.

### Input

- Job Profile
- Evaluation Template version
- Parsed Resume
- Evaluation Result
- missing evidence
- risk notes
- Phone Screen or Interview context

### Output

- phone screen question suggestions
- interview question suggestions
- purpose of each question
- related evidence gap
- risk addressed by each question

### Dependencies

- Evaluation Engine
- Job Profile
- Question output schema
- sensitive topic filter

### Failure Handling

- recruiter uses default/manual questions
- failed generation does not block pipeline movement
- invalid question outputs are discarded

### Future Extensibility

- interview round-specific question generation
- interviewer-specific templates
- feedback-based question quality analysis

---

## 9. Candidate Summarizer

### Purpose

Create recruiter-facing candidate summaries from linked resumes, evaluations, notes, and pipeline context.

### Input

- Candidate
- linked Resumes
- latest Parsed Resume
- Evaluation Results
- Pipeline status
- Phone Screen notes
- Interview notes
- recruiter notes

### Output

- candidate summary
- latest status summary
- key evidence
- risks
- missing evidence
- recommended next review actions

### Dependencies

- Candidate Library
- Resume Library
- Evaluation Result
- Pipeline
- Input Builder
- Schema Validator

### Failure Handling

- candidate page can display existing structured data without AI summary
- invalid summary is not persisted as trusted output
- recruiter can manually write notes

### Future Extensibility

- timeline summaries
- role-specific candidate summaries
- talent pool summaries

---

## 10. Talent Map Generator

### Purpose

Generate talent landscape summaries around a Job Profile or talent segment.

### Input

- Job Profile
- Candidate Library subset
- Resume Library subset
- Evaluation Results
- Pipeline outcomes
- source/channel metadata

### Output

- talent segments
- segment descriptions
- common strengths
- common risks
- market observations
- missing data notes
- representative model inputs

### Dependencies

- Talent Map domain model
- Candidate Library
- Resume Library
- Evaluation Result
- Recruitment Analytics

### Failure Handling

- existing candidate data remains available
- Talent Map generation can be retried
- incomplete input is reported explicitly

### Future Extensibility

- time-windowed talent maps
- source-specific talent maps
- market movement summaries
- comparison between Job Profiles

---

## 11. Representative Candidate Generator

### Purpose

Generate versioned, non-person representative candidate profiles from accumulated recruiting data.

### Input

- Job Profile
- Talent Map
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes
- recruiter review feedback

### Output

- representative profile version
- category name
- common evidence patterns
- typical strengths
- typical weaknesses
- typical risks
- missing evidence notes
- confidence signal

### Dependencies

- Talent Map Generator
- Evaluation Results
- Pipeline outcomes
- Representative Candidate Model domain object

### Failure Handling

- do not publish invalid model versions
- recruiter must review before use
- preserve previous approved versions

### Future Extensibility

- version comparison
- drift detection
- role family models
- source/channel-specific representative profiles

### Constraints

- representative models are not real candidates
- category labels do not define scoring thresholds

---

## 12. Recruitment Analytics

### Purpose

Generate operational intelligence about recruiting performance and process quality.

### Input

- RecruitLog
- Dashboard KPI summaries
- Pipeline history
- Candidate Library
- Evaluation Results
- Phone Screen records
- Interview records
- Offer records
- source/channel metadata

### Output

- funnel observations
- hiring bottleneck summaries
- source/channel analysis
- trend summaries
- stale candidate warnings
- interview quality observations
- data completeness warnings

### Dependencies

- V1 dashboard concepts
- Pipeline
- Candidate Library
- Evaluation Result
- Export/reporting layer in future

### Failure Handling

- deterministic KPI calculations still work without AI
- AI-generated interpretations are optional
- missing data is shown as missing, not guessed

### Future Extensibility

- weekly recruiting reports
- monthly recruiting reports
- role-level analytics
- recruiter workflow improvement suggestions

---

## 13. Knowledge Generator

### Purpose

Extract reusable recruiting knowledge from V2 workflows and recruiter feedback.

### Input

- Evaluation Results
- recruiter corrections
- Phone Screen notes
- Interview feedback
- Offer outcomes
- Talent Map summaries
- Recruitment Analytics reports

### Output

- knowledge entries
- source references
- tags
- knowledge type suggestion
- prompt/model improvement notes
- reusable interview or phone screen patterns

### Dependencies

- existing V1 Knowledge Base concept
- Knowledge validation
- source reference model
- human review workflow

### Failure Handling

- invalid generated knowledge is not saved as trusted knowledge
- duplicate knowledge is skipped or merged according to deterministic future rules
- recruiter can create knowledge manually

### Future Extensibility

- knowledge quality scoring placeholder
- role-specific knowledge packs
- prompt improvement queue
- recruitment playbook generation

---

## 14. Supporting Module: AI Orchestrator

Purpose:

- coordinate prompt loading, input building, provider calls, parsing, validation, audit, and feedback capture

Input:

- module request
- domain context
- prompt name and version
- output schema identifier

Output:

- normalized AI module result
- provider metadata
- audit metadata
- validation status

Dependencies:

- Prompt Registry
- Input Builder Registry
- Provider Adapter Registry
- Output Schema Registry
- Audit Writer

Failure handling:

- returns controlled errors
- never leaks secrets
- never saves invalid parsed output as valid

Future extensibility:

- model routing
- fallback provider
- provider comparison
- retry policy
- cost tracking

---

## 15. Supporting Module: Human Feedback Collector

Purpose:

- capture recruiter review outcomes for AI outputs

Input:

- AI output reference
- recruiter decision
- correction note
- reason
- accepted or overridden state

Output:

- feedback record
- prompt/model improvement signal
- audit trail

Dependencies:

- Evaluation Result
- Knowledge Base
- Audit Writer

Failure handling:

- failure to capture feedback must not erase the original AI output
- retry should be possible

Future extensibility:

- sampling review queue
- model quality dashboard
- prompt regression tests

---

## 16. Module Independence Summary

```text
Job Profile Generator
  -> creates structured role context

Resume Parser
  -> creates Parsed Resume

Resume Analyzer
  -> creates chunks and evidence maps

Evaluation Engine
  -> creates Evaluation Result

Question Generator
  -> creates recruiter-editable questions

Candidate Summarizer
  -> creates candidate-level summaries

Talent Map Generator
  -> creates talent landscape intelligence

Representative Candidate Generator
  -> creates non-person model profiles

Recruitment Analytics
  -> creates operational intelligence

Knowledge Generator
  -> creates reusable recruiting knowledge
```

No module should directly call Prisma, render UI, or call external model providers without the AI Orchestrator and Provider Adapter boundary.

---

## 17. Explicit Non-Goals

This document does not:

- implement AI modules
- define TypeScript interfaces
- define database schema
- define API routes
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
