# 04_RECRUITMENT_DOMAIN_MODEL.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-004 — Recruitment Domain Model

---

## 1. Purpose

This document defines the recruitment domain model for hr-tool V2.

It is an architecture document only. It does not define database tables, API routes, scoring standards, Feishu integration details, or implementation code.

The model reuses existing V1 principles wherever possible:

- layered architecture
- backend-only AI calls
- prompt files under `/prompts`
- structured JSON AI outputs
- schema validation before persistence
- no direct database access from UI
- no hardcoded business rules inside UI or API routes

V2 extends V1 from daily recruiting operations into a Feishu Recruiting Workspace. V1 remains stable and continues to own daily logs, reviews, planners, knowledge, settings, and existing AI infrastructure.

---

## 2. Design Principles

### 2.1 Domain First

V2 domain objects should describe recruiting work clearly before implementation decisions are made.

The domain model should support future database, API, AI, and Feishu integration work without requiring a redesign.

### 2.2 Configurable Evaluation

Evaluation must be configurable, versionable, reusable, and empty by default.

The architecture must allow teams to define future evaluation dimensions, but this document intentionally does not define scoring criteria or scoring standards.

### 2.3 AI Ready, Not AI Hardcoded

AI workflows should consume structured domain objects and return structured outputs. AI should not own business truth.

AI can assist with:

- resume parsing
- resume evaluation
- candidate classification
- representative candidate generation
- interview question suggestions
- talent map summaries

AI must not hardcode recruitment rules in prompts or UI.

### 2.4 Libraries As Curated Workspaces

Resume Library and Candidate Library are not just storage buckets. They represent curated workspaces where raw information becomes structured recruiting assets.

---

## 3. Domain Object Overview

Core objects:

```text
Job Profile
Evaluation Template
Resume
Resume Library
Candidate
Candidate Library
Evaluation Result
Pipeline
Phone Screen
Interview
Offer
Talent Map
Representative Candidate Model
```

High-level relationship:

```text
Job Profile
  -> Evaluation Template
  -> Resume Evaluation
  -> Evaluation Result

Resume Library
  -> Resume
  -> Parsed Resume
  -> Evaluation Result
  -> Classification
  -> Candidate Library

Candidate Library
  -> Candidate
  -> Pipeline
  -> Phone Screen
  -> Interview
  -> Offer

Talent Map
  -> Job Profile
  -> Candidate Library
  -> Resume Library
  -> Evaluation Results
  -> Representative Candidate Model
```

---

## 4. Job Profile

Job Profile represents the recruiting target.

It should describe what the organization is hiring for, but it must not define scoring rules directly.

### 4.1 Contents

A Job Profile may contain:

- job title
- department or business unit
- location or work mode
- seniority level
- employment type
- hiring headcount
- job description
- responsibilities
- required qualifications
- preferred qualifications
- compensation range if available
- hiring priority
- hiring owner
- hiring status
- related Pipeline
- related Evaluation Templates
- related Talent Map

### 4.2 Relationships

```text
Job Profile
  has many Evaluation Templates
  has many Resumes through evaluations
  has many Candidates through Pipeline
  has one or more Talent Map views
```

### 4.3 Rules

- Job Profile is the anchor for evaluation context.
- Job Profile provides input context to AI evaluation.
- Job Profile does not own scoring logic.
- Job Profile can evolve over time without invalidating historical Evaluation Results.

---

## 5. Evaluation Template

Evaluation Template is an extensible framework for evaluating resumes and candidates.

It is intentionally empty by default.

### 5.1 Purpose

Evaluation Template provides a reusable structure for future evaluation workflows.

It should support:

- resume evaluation
- phone screen evaluation
- interview evaluation
- offer readiness review
- representative candidate generation

### 5.2 Required Properties

An Evaluation Template should be:

- configurable
- versionable
- reusable
- empty by default
- tied to a Job Profile when needed
- usable across many resumes or candidates
- safe to change without rewriting historical results

### 5.3 Conceptual Structure

A template may include future configurable slots:

- template name
- template version
- evaluation context
- evaluation sections
- expected output schema
- prompt reference
- active or archived status
- owner

This document does not define any concrete scoring criteria.

### 5.4 Versioning

Template versions preserve evaluation history.

```text
Evaluation Template v1
  -> Evaluation Result A
  -> Evaluation Result B

Evaluation Template v2
  -> Evaluation Result C
```

Historical Evaluation Results must reference the template version used at generation time.

---

## 6. Resume

Resume represents candidate-supplied career information.

It must support future original resume storage, parsed resume data, structure-aware chunks, and semantic chunks.

### 6.1 Resume Forms

```text
Original Resume
  -> Parsed Resume
  -> Structure-aware Chunks
  -> Semantic Chunks
```

### 6.2 Original Resume

Original Resume represents the source material.

It may include:

- uploaded file metadata
- raw text extraction
- original file reference
- source channel
- upload timestamp
- owner

### 6.3 Parsed Resume

Parsed Resume represents normalized structured information extracted from the original resume.

It may include:

- candidate name if detected
- contact information if available
- education
- work history
- projects
- skills
- certifications
- languages
- raw extraction confidence

### 6.4 Structure-aware Chunks

Structure-aware chunks preserve resume sections.

Examples:

- education section
- work experience section
- project section
- skills section

These chunks support deterministic display and section-level AI review.

### 6.5 Semantic Chunks

Semantic chunks group meaning rather than document layout.

Examples:

- frontend engineering experience
- HR operations experience
- leadership evidence
- domain knowledge

Semantic chunks may support future retrieval, comparison, summarization, and talent mapping.

This document does not introduce vector storage or RAG implementation.

---

## 7. Resume Library

Resume Library is the workspace where incoming resumes are collected, parsed, evaluated, classified, and converted into candidate assets.

### 7.1 Flow

```text
Resume
  -> Parsed Resume
  -> Evaluation
  -> Classification
  -> Candidate Library
```

### 7.2 Responsibilities

Resume Library should support:

- collecting resumes from upload or future Feishu sources
- tracking parsing status
- keeping original and parsed resume representations connected
- preparing structured data for evaluation
- storing or referencing Evaluation Results
- classifying resumes for candidate conversion

### 7.3 Classification

Classification is a future label or decision layer after evaluation.

Examples:

- potential candidate
- duplicate resume
- missing information
- not aligned with current roles
- worth future talent pool retention

This document does not define classification scoring rules.

---

## 8. Candidate

Candidate represents a person in the recruiting process.

Candidate is not the same as Resume. A Candidate may have multiple resumes over time.

### 8.1 Contents

Candidate may contain:

- name
- contact methods
- current company
- current title
- target roles
- source channel
- owner
- tags
- notes
- linked resumes
- linked evaluations
- current Pipeline status
- phone screens
- interviews
- offers
- talent map membership

### 8.2 Relationships

```text
Candidate
  has many Resumes
  has many Evaluation Results
  belongs to Candidate Library
  participates in Pipeline
  may have Phone Screens
  may have Interviews
  may have Offers
  may appear in Talent Map
```

### 8.3 Rules

- Candidate identity should be resolved carefully in future implementation.
- Candidate should not duplicate all resume content.
- Candidate can exist before a full evaluation is complete.
- Candidate should support both active recruiting and long-term talent pooling.

---

## 9. Candidate Library

Candidate Library is the curated workspace for all known candidates.

It should support active recruitment and long-term talent pool management.

### 9.1 Information Architecture

Candidate Library may organize candidates by:

- active role
- pipeline stage
- source channel
- owner
- tags
- evaluation status
- talent category
- availability
- location
- seniority

### 9.2 Inputs

Candidate Library can receive candidates from:

- Resume Library classification
- manual creation
- future Feishu import
- future chat summary extraction
- future referral intake

### 9.3 Outputs

Candidate Library can feed:

- Pipeline
- Phone Screen
- Interview
- Offer
- Talent Map
- Representative Candidate Model

---

## 10. Evaluation Result

Evaluation Result records an evaluation output generated from a Resume, Candidate, Job Profile, and Evaluation Template.

### 10.1 Purpose

Evaluation Result preserves the outcome of a specific evaluation event.

It may represent:

- AI resume evaluation
- recruiter evaluation
- phone screen evaluation
- interview evaluation
- offer readiness review

### 10.2 Contents

Evaluation Result may contain:

- evaluated object type
- evaluated object reference
- Job Profile reference
- Evaluation Template reference
- template version
- structured output
- raw AI output if generated by AI
- parsed output
- model/provider metadata if AI generated
- generated timestamp
- reviewer or owner

### 10.3 Rules

- Evaluation Result should be append-friendly.
- Historical results should remain interpretable after templates change.
- Evaluation Result should not hardcode global scoring standards.
- Evaluation Result should store enough context for audit and comparison.

---

## 11. Pipeline

Pipeline represents the recruitment stage workflow for a Job Profile and Candidate.

### 11.1 Purpose

Pipeline tracks movement from initial candidate discovery to final outcome.

Possible conceptual stages:

```text
Sourced
Resume Review
Phone Screen
Interview
Offer
Hired
Rejected
Talent Pool
```

These are examples only, not hardcoded standards.

### 11.2 Relationships

```text
Pipeline
  belongs to Job Profile
  contains Candidate stage records
  connects to Phone Screen
  connects to Interview
  connects to Offer
```

### 11.3 Rules

- Pipeline should support configurable stages in future.
- Pipeline movement should be auditable.
- Pipeline should not embed scoring criteria.
- Pipeline status may be synchronized with Feishu in future, but Feishu is not part of this domain definition.

---

## 12. Phone Screen

Phone Screen represents early recruiter-candidate qualification.

### 12.1 Purpose

Phone Screen captures lightweight qualification before formal interviews.

It may include:

- candidate reference
- Job Profile reference
- scheduled time
- owner
- summary
- availability
- compensation expectations
- communication notes
- next step
- related Evaluation Result

### 12.2 AI Touchpoints

Future AI may assist with:

- generating phone screen question suggestions
- summarizing phone screen notes
- extracting risks and follow-up tasks

No scoring standards are defined here.

---

## 13. Interview

Interview represents formal evaluation conversations.

### 13.1 Purpose

Interview captures structured interview events and feedback.

It may include:

- candidate reference
- Job Profile reference
- interview round
- interviewer
- scheduled time
- feedback
- decision
- next step
- related Evaluation Result

### 13.2 AI Touchpoints

Future AI may assist with:

- interview question generation
- feedback summarization
- comparison against Job Profile context
- identifying missing evidence

No scoring criteria are defined here.

---

## 14. Offer

Offer represents final hiring proposal and outcome.

### 14.1 Purpose

Offer tracks the transition from selected candidate to accepted or declined outcome.

It may include:

- candidate reference
- Job Profile reference
- offer status
- compensation package summary
- approval status
- sent date
- accepted or declined date
- onboarding handoff status
- notes

### 14.2 Rules

- Offer belongs to a Candidate and Job Profile.
- Offer should remain separate from Interview.
- Offer workflows may integrate with Feishu approval in future.
- No compensation rule or approval standard is defined here.

---

## 15. Talent Map

Talent Map organizes market and candidate intelligence around a Job Profile or talent segment.

### 15.1 Purpose

Talent Map helps recruiters understand the available talent landscape.

It relates to:

- Job Profile
- Candidate
- Resume
- Evaluation Result
- Representative Candidate Model

### 15.2 Relationship Model

```text
Talent Map
  anchors on Job Profile
  groups Candidates
  references Resumes
  summarizes Evaluation Results
  compares against Representative Candidate Models
```

### 15.3 Uses

Talent Map may support:

- candidate grouping
- market segmentation
- role-specific talent pools
- hiring difficulty analysis
- future search and recommendation workflows

This document does not define ranking rules.

---

## 16. Representative Candidate Model

Representative Candidate Model is a synthesized profile generated from accumulated recruiting data.

It is not a real person. It is a model profile that represents a category of candidates observed in the system.

### 16.1 Examples

Examples:

- Excellent
- Good
- Average
- Reject

These labels are category names only. This document does not define scoring rules or thresholds for them.

### 16.2 What The Models Represent

A Representative Candidate Model may summarize:

- common resume patterns
- common experience level
- common skills or background signals
- typical strengths
- typical risks
- typical interview evidence
- typical pipeline outcome patterns

### 16.3 Generation Framework

Future generation flow:

```text
Job Profile
  -> Candidate Library
  -> Resume Library
  -> Evaluation Results
  -> Pipeline Outcomes
  -> Representative Candidate Model
```

### 16.4 Rules

- Models are generated from accumulated structured data.
- Models should be versioned.
- Models should be grounded in actual system data.
- Models should not replace recruiter judgment.
- Models should not define universal scoring standards.
- Models should be regenerated when enough new evidence accumulates.

---

## 17. Relationship Summary

```text
Job Profile
  -> defines hiring context
  -> references Evaluation Templates
  -> anchors Pipeline and Talent Map

Evaluation Template
  -> provides reusable evaluation framework
  -> produces Evaluation Results through AI or human review

Resume Library
  -> stores Resume assets
  -> supports parsing and chunking
  -> sends evaluated/classified resumes to Candidate Library

Candidate Library
  -> stores Candidate assets
  -> supports active pipeline and long-term talent pooling

Pipeline
  -> tracks Candidate progress for a Job Profile
  -> connects Phone Screen, Interview, and Offer

Talent Map
  -> summarizes talent landscape around Job Profile
  -> uses Candidate, Resume, Evaluation, and Representative Models
```

---

## 18. Explicit Non-Goals

This document does not:

- implement code
- define database tables
- create APIs
- connect Feishu
- define scoring standards
- define scoring criteria
- modify V1
- choose vector database or embedding architecture
- define authentication or multi-user permissions

---

## 19. Implementation Readiness

Future implementation tasks can use this model to design:

- Prisma schema
- service layer modules
- repository boundaries
- API route contracts
- prompt inputs
- AI output schemas
- Feishu synchronization boundaries

The architecture is intentionally stable enough to support implementation without redesigning the core object relationships.
