# 10_AI_EVOLUTION_ROADMAP.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-006 - AI Evolution Roadmap

---

## 1. Purpose

This document defines the AI evolution roadmap for hr-tool.

The roadmap moves from AI-assisted recruiting workflows toward a broader recruitment intelligence platform while preserving human review, auditability, explainability, and model independence.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, or modify V1.

---

## 2. Evolution Principles

AI evolution must be:

- recruiter-assistive
- human-reviewed
- model-independent
- auditable
- explainable
- schema-driven
- prompt-versioned
- privacy-aware
- service-layer controlled

AI evolution must not:

- replace recruiter decisions
- define hidden scoring standards
- hardcode provider-specific assumptions
- bypass domain services
- expose secrets or sensitive data
- silently overwrite human judgment

---

## 3. Stage Overview

```text
V1 - AI Daily Assistant
  -> V2 - AI Recruitment Assistant
  -> V3 - AI Recruitment Analyst
  -> V4 - AI Recruiting Co-Pilot
  -> V5 - Recruitment Intelligence Platform
```

These stages describe product and architecture maturity. They do not require replacing the existing system at each stage.

---

## 4. V1 - AI Daily Assistant

### 4.1 Product Role

V1 AI assists the recruiter with daily operational reflection and planning.

### 4.2 Existing Capabilities

- Daily Review
- Tomorrow Planner
- Knowledge Extraction
- Weekly and monthly review concepts
- spreadsheet analysis
- AI provider abstraction
- prompt loading
- JSON parsing
- schema validation
- AI request logging

### 4.3 Architecture Characteristics

- single-user MVP
- backend-only AI calls
- prompt files under `/prompts`
- structured JSON outputs
- service-layer orchestration
- no direct frontend AI calls

### 4.4 Limitations

- AI context is mostly daily-log based
- no candidate-centric data model
- no full resume pipeline
- no pipeline intelligence
- no Talent Map
- no Representative Candidate Model

### 4.5 Exit Criteria

V1 is ready to feed V2 when:

- V1 pages remain stable
- AI provider abstraction works
- settings safely show AI status
- AI failures are handled gracefully
- Docker startup is reliable

---

## 5. V2 - AI Recruitment Assistant

### 5.1 Product Role

V2 AI assists recruiters across candidate-centric workflows.

V2 is not a chatbot and not an autonomous recruiter. It is a recruitment intelligence layer inside the Feishu Recruiting Workspace.

### 5.2 Core Capabilities

- Job Profile structuring
- Resume parsing
- structure-aware chunking
- semantic chunking
- candidate evaluation
- strength and weakness analysis
- risk detection
- phone screen questions
- interview questions
- candidate summaries
- human review loop

### 5.3 Domain Scope

V2 uses:

- Job Profile
- Evaluation Template
- Resume
- Parsed Resume
- Resume Chunk
- Evaluation Result
- Candidate
- Candidate Library
- Pipeline
- Phone Screen
- Interview
- Offer
- Talent Map
- Representative Candidate Model

### 5.4 Architecture Requirements

- AI modules are independent and reusable
- AI modules are called through service-layer orchestration
- provider adapters are isolated
- prompt versions are recorded
- outputs are schema validated
- recruiters review AI outputs
- audit records are created

### 5.5 Human Review Requirements

Recruiters must review:

- parsed resume uncertainty
- evaluation output
- risk detection
- candidate conversion
- generated questions
- Talent Map segments
- Representative Candidate Models

### 5.6 Exit Criteria

V2 is mature when:

- Resume Library and Candidate Library are stable
- Evaluation Results are traceable and reviewable
- AI questions and summaries are useful with human editing
- AI errors do not block workflow
- prompt/model metadata is consistently recorded
- no provider-specific assumptions exist in business services

---

## 6. V3 - AI Recruitment Analyst

### 6.1 Product Role

V3 AI analyzes recruiting performance and talent patterns across accumulated data.

The system becomes stronger at explaining recruitment operations, not just processing individual resumes.

### 6.2 Core Capabilities

- recruitment reports
- hiring bottleneck analysis
- channel analysis
- role-level trend analysis
- interview quality analysis
- recruiter workflow insights
- talent distribution summaries
- prompt/model quality review

### 6.3 Data Requirements

V3 needs accumulated structured data:

- Candidate Library history
- Resume Library history
- Evaluation Result history
- Pipeline stage history
- Phone Screen and Interview notes
- Offer outcomes
- recruiter feedback on AI outputs
- Knowledge Base entries

### 6.4 Architecture Additions

- analytics input builders
- report schema registry
- reviewed report storage
- source reference tracking
- model comparison metadata
- prompt improvement backlog

### 6.5 Human Review Requirements

Recruiters review:

- generated reports
- bottleneck interpretations
- channel quality observations
- interview quality insights
- knowledge generated from reports

### 6.6 Exit Criteria

V3 is mature when:

- reports are grounded in system data
- missing data is explicitly surfaced
- recruiters can accept, reject, or correct insights
- insights can feed Knowledge Base and process improvement
- analytics remains separate from hidden candidate scoring rules

---

## 7. V4 - AI Recruiting Co-Pilot

### 7.1 Product Role

V4 AI coordinates multi-step recruiting assistance while keeping recruiter approval mandatory.

The AI begins to propose workflows, but not execute final decisions autonomously.

### 7.2 Core Capabilities

- multi-step candidate review assistance
- next-action recommendation drafts
- role-specific candidate comparison summaries
- interview plan generation
- follow-up plan generation
- Talent Map refresh suggestions
- Representative Candidate Model drift detection

### 7.3 Architecture Additions

- task orchestration layer
- controlled action proposal queue
- approval workflow for AI-suggested actions
- richer audit trail
- model fallback strategy
- prompt regression test suite

### 7.4 Human Review Requirements

Recruiters must approve:

- stage movement suggestions
- follow-up communication drafts
- candidate shortlist recommendations
- Talent Map refreshes
- representative model publication

### 7.5 Constraints

- no autonomous rejection
- no autonomous offer decision
- no unreviewed candidate status changes
- no sensitive communication sent without approval

### 7.6 Exit Criteria

V4 is mature when:

- AI proposals are reviewable and reversible
- action audit is complete
- business logic remains outside prompts
- prompt/model changes are tested before activation

---

## 8. V5 - Recruitment Intelligence Platform

### 8.1 Product Role

V5 is a recruitment intelligence platform that connects candidate data, operational data, knowledge, market observations, and AI-assisted analysis.

### 8.2 Core Capabilities

- organization-level recruiting intelligence
- cross-role Talent Maps
- long-term talent pool strategy
- representative candidate model library
- model/provider benchmarking
- privacy-aware knowledge governance
- strategic hiring reports
- configurable AI policies

### 8.3 Architecture Additions

- organization-level configuration
- permission and governance layer
- AI policy registry
- provider routing strategy
- advanced audit and compliance reporting
- long-term analytics storage
- optional retrieval architecture if approved separately

### 8.4 Human Review Requirements

Human review remains mandatory for:

- hiring decisions
- candidate rejection
- offer decisions
- policy changes
- prompt version activation
- representative model publication
- external communication

### 8.5 Constraints

- strategic intelligence must separate data facts from AI interpretations
- representative models must remain non-person profiles
- model-independent architecture must remain intact

---

## 9. Prompt Evolution Roadmap

### 9.1 V2

- prompt files are versioned
- prompt inputs are structured
- prompt outputs are schema validated
- prompt metadata is audited

### 9.2 V3

- prompt quality notes are collected
- recruiter feedback informs prompt improvement candidates
- prompt versions can be compared through historical outputs

### 9.3 V4

- prompt regression tests are introduced
- prompt activation requires validation
- high-risk prompt changes require review

### 9.4 V5

- prompt governance exists
- prompt policies can vary by organization or workflow
- prompt/model benchmarking supports provider switching

---

## 10. Model Evolution Roadmap

### 10.1 V2

- one active provider at a time
- provider adapter abstraction
- no provider-specific business logic

### 10.2 V3

- provider comparison metadata
- report quality comparison
- cost and latency analysis

### 10.3 V4

- fallback provider strategy
- model routing by module risk and cost
- output consistency checks

### 10.4 V5

- model governance
- private model support
- organization-level provider policies
- compliance-aware model selection

---

## 11. Data Evolution Roadmap

### 11.1 V2

- Resume Library
- Candidate Library
- Evaluation Result review loop
- Pipeline context
- Talent Map foundation

### 11.2 V3

- analytics-ready event history
- report output history
- recruiter feedback history
- prompt/model improvement notes

### 11.3 V4

- approved AI action proposal history
- workflow orchestration history
- model drift and prompt regression history

### 11.4 V5

- governance records
- organization-level analytics
- long-term talent intelligence
- optional retrieval infrastructure if separately approved

---

## 12. Knowledge Evolution Roadmap

### 12.1 V2

- extract reusable knowledge from candidate evaluations and recruiter corrections
- preserve source references
- require review before trusted use

### 12.2 V3

- extract knowledge from reports, bottlenecks, and channel analysis
- create role-specific knowledge packs
- track knowledge usefulness

### 12.3 V4

- use knowledge to support action proposals
- identify recurring workflow issues
- connect knowledge to prompt improvement

### 12.4 V5

- governed organizational recruiting knowledge
- reusable playbooks
- strategic hiring intelligence
- privacy-aware knowledge retention

---

## 13. Risk Management Roadmap

### 13.1 V2 Risks

- resume parsing hallucination
- overconfident evaluation
- sensitive data exposure
- unreviewed AI suggestions

Controls:

- schema validation
- human review
- explainability fields
- safe logging

### 13.2 V3 Risks

- misleading analytics from incomplete data
- overgeneralized trends
- channel bias

Controls:

- missing data reporting
- source evidence references
- recruiter feedback
- report review state

### 13.3 V4 Risks

- action automation risk
- recruiter overreliance
- workflow drift

Controls:

- action approval queue
- reversible actions
- mandatory audit
- no autonomous final decisions

### 13.4 V5 Risks

- governance complexity
- privacy and compliance exposure
- cross-organization assumptions

Controls:

- policy registry
- permission design
- privacy minimization
- compliance review

---

## 14. Milestone Gates

### 14.1 V2 Gate

Before V2 AI implementation expands:

- domain model approved
- resume/candidate model approved
- AI module boundaries approved
- data flow approved
- prompt architecture approved
- human review model approved

### 14.2 V3 Gate

Before AI Analyst capabilities:

- enough structured Evaluation Results exist
- Pipeline history is reliable
- recruiter feedback is captured
- analytics data quality is understood

### 14.3 V4 Gate

Before Co-Pilot capabilities:

- action proposal review is designed
- audit and rollback are designed
- prompt regression testing exists
- model fallback strategy exists

### 14.4 V5 Gate

Before platform capabilities:

- governance requirements are defined
- privacy model is approved
- organization/multi-user architecture is approved
- provider policy architecture is approved

---

## 15. Explicit Non-Goals

This roadmap does not:

- implement AI features
- define database schema
- define API routes
- define prompt text
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- approve autonomous hiring decisions

---

## 16. Summary

The AI evolution path keeps hr-tool grounded in recruiter control:

```text
V1: AI helps with daily work.
V2: AI assists candidate-centric recruiting workflows.
V3: AI analyzes recruitment operations.
V4: AI proposes multi-step recruiting actions for approval.
V5: AI supports organization-level recruitment intelligence.
```

At every stage, AI remains model-independent, explainable, auditable, and subject to human review.
