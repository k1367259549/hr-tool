# 11_RECRUITMENT_INTELLIGENCE_LEARNING.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-007 - Recruitment Intelligence Learning Architecture

---

## 1. Purpose

This document defines the Recruitment Intelligence Learning Architecture for hr-tool V2.

The objective is to transform hr-tool from an AI-assisted ATS into a Recruitment Intelligence Platform. The architecture explains how AI learns from recruiter decisions, hiring outcomes, and accumulated recruiting data without replacing recruiter judgment.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, define classification thresholds, or modify V1.

This document reuses:

- `docs/v2/04_RECRUITMENT_DOMAIN_MODEL.md`
- `docs/v2/05_RECRUITMENT_WORKFLOW.md`
- `docs/v2/06_RESUME_CANDIDATE_DATA_MODEL.md`
- `docs/v2/07_AI_RECRUITMENT_INTELLIGENCE.md`
- `docs/v2/08_AI_MODULES.md`
- `docs/v2/09_AI_DATA_FLOW.md`
- `docs/v2/10_AI_EVOLUTION_ROADMAP.md`

---

## 2. Core Principle

All AI outputs must belong to one of two categories:

```text
AI Output
  -> Decision Support
  -> Learning Asset
```

No AI output may silently become organizational memory.

Decision Support helps recruiters make a current decision. Learning Assets preserve reviewed and reusable organizational intelligence.

The separation is mandatory:

- Decision Support is local, contextual, and temporary until reviewed.
- Learning Assets are reusable, versioned, reviewed, and auditable.
- Human confirmation is required before Decision Support can become a Learning Asset.

---

## 3. Architecture Position

```text
Operational Data
  -> Decision Support
  -> Human Review
  -> Learning Assets
  -> Recruitment Intelligence
  -> Continuous Optimization
```

Operational Data includes:

- Job Profile
- Evaluation Template
- Resume
- Parsed Resume
- Resume Chunk
- Candidate
- Evaluation Result
- Pipeline
- Phone Screen
- Interview
- Offer
- Talent Map
- RecruitLog and KPI history from V1

Decision Support interprets operational data for a current workflow.

Learning Assets preserve reviewed knowledge from repeated decisions and outcomes.

Recruitment Intelligence uses Learning Assets to improve future Decision Support, reports, and strategy recommendations.

---

## 4. Decision Support Definition

Decision Support is AI-generated assistance for a specific recruiter workflow.

It may:

- analyze
- summarize
- compare
- identify patterns
- recommend next steps
- generate questions
- surface risks

It must not:

- become organizational memory automatically
- make final hiring decisions
- automatically reject candidates
- automatically modify Candidate, Job Profile, Pipeline, or Learning Assets
- define hidden scoring rules

Decision Support is always tied to:

- source data
- evidence
- explanation
- confidence signal
- recruiter interaction
- audit metadata

---

## 5. Learning Asset Definition

Learning Assets are reviewed, reusable organizational recruiting knowledge.

They may represent:

- candidate patterns
- job profile patterns
- interview patterns
- channel patterns
- pipeline patterns
- talent market patterns
- recruiting strategy lessons
- verified recruiting knowledge

Learning Assets must be:

- versioned
- explainable
- reviewable
- auditable
- owned by a recruiter or organization role in future
- created only after human confirmation
- updated through explicit lifecycle rules

Learning Assets must not:

- overwrite historical records
- hide recruiter corrections
- contain unreviewed AI output as trusted knowledge
- encode scoring standards or thresholds

---

## 6. Decision Support Capability Map

### 6.1 Resume Analysis

Purpose:

- help recruiters understand a Resume and Parsed Resume quickly

Input:

- Original Resume
- Parsed Resume
- structure-aware chunks
- semantic chunks
- source metadata

Output:

- summary
- key evidence
- missing information
- duplicate signals
- parsing concerns

Evidence:

- resume sections
- source chunks
- parsed fields

Explanation:

- explains which resume evidence supports each observation

Confidence:

- confidence describes extraction or interpretation reliability, not candidate quality

Recruiter interaction:

- recruiter reviews, corrects, or discards analysis

Learning rule:

- analysis does not become a Learning Asset unless converted through review

### 6.2 Candidate Evaluation

Purpose:

- help evaluate a candidate or resume in the context of a Job Profile and Evaluation Template version

Input:

- Candidate or Resume
- Job Profile
- Evaluation Template version
- Evaluation Results
- chunks and evidence map

Output:

- summary
- strengths
- weaknesses
- risks
- missing evidence
- score placeholder
- classification placeholder
- questions

Evidence:

- parsed resume fields
- chunks
- prior interactions
- recruiter notes

Explanation:

- explains why each suggestion was made and what evidence was used

Confidence:

- confidence describes whether evidence is sufficient

Recruiter interaction:

- accept, modify, reject, or mark incorrect

Learning rule:

- only reviewed feedback can contribute to Learning Assets

### 6.3 Strengths

Purpose:

- surface positive evidence for a role-specific context

Input:

- Evaluation Result input package
- Job Profile
- Resume and interview evidence

Output:

- strengths
- supporting evidence
- missing confirmation notes

Evidence:

- specific source chunks or notes

Explanation:

- separates direct evidence from inference

Confidence:

- confidence reflects evidence strength and completeness

Recruiter interaction:

- recruiter confirms whether each strength is valid

Learning rule:

- repeated confirmed strengths may contribute to Candidate Models or Job Profile Models

### 6.4 Weaknesses

Purpose:

- surface possible gaps or concerns needing review

Input:

- Job Profile
- Resume evidence
- Evaluation Result
- interview evidence when available

Output:

- weaknesses
- missing evidence
- suggested validation steps

Evidence:

- absent, weak, or conflicting evidence

Explanation:

- explains whether a weakness is observed or merely not evidenced

Confidence:

- confidence must be lower when evidence is incomplete

Recruiter interaction:

- recruiter confirms, corrects, or rejects the weakness

Learning rule:

- weaknesses do not become rejection rules

### 6.5 Risk Detection

Purpose:

- identify risks that require recruiter attention

Input:

- Resume
- Candidate notes
- Phone Screen notes
- Interview notes
- Offer context

Output:

- risk list
- supporting evidence
- uncertainty
- follow-up questions

Evidence:

- source records and chunks

Explanation:

- explains risk source and uncertainty

Confidence:

- confidence describes risk detection reliability

Recruiter interaction:

- recruiter decides whether risk is real and what to do

Learning rule:

- confirmed risks can contribute to risk pattern Learning Assets after review

### 6.6 Phone Screen Questions

Purpose:

- generate questions for early recruiter qualification

Input:

- Job Profile
- Candidate or Resume
- Evaluation Result
- missing evidence
- risks

Output:

- phone screen questions
- purpose of each question
- evidence gap addressed

Evidence:

- missing or uncertain fields

Explanation:

- explains why each question is suggested

Confidence:

- confidence reflects relevance to the evidence gap

Recruiter interaction:

- recruiter edits before use

Learning rule:

- successful reviewed questions can become Interview Models or Knowledge entries

### 6.7 Interview Questions

Purpose:

- generate structured interview question suggestions

Input:

- Job Profile
- Evaluation Template version
- Candidate context
- Phone Screen notes
- missing evidence

Output:

- interview questions
- focus areas
- evidence targets

Evidence:

- gaps from Evaluation Results and prior notes

Explanation:

- explains what each question should validate

Confidence:

- confidence reflects alignment with the Job Profile and missing evidence

Recruiter interaction:

- interviewer or recruiter edits before use

Learning rule:

- only reviewed question effectiveness can become a Learning Asset

### 6.8 Next Action Suggestions

Purpose:

- propose recruiter next steps for active candidates or roles

Input:

- Candidate
- Pipeline status
- Evaluation Result
- Phone Screen and Interview notes
- Offer status

Output:

- next action suggestions
- reason
- urgency signal
- required human confirmation

Evidence:

- pipeline age
- missing evidence
- pending actions
- recruiter notes

Explanation:

- explains the reason and source of the suggestion

Confidence:

- confidence indicates workflow relevance

Recruiter interaction:

- recruiter approves, edits, rejects, or ignores

Learning rule:

- accepted next-action patterns can inform Pipeline Models after review

### 6.9 Talent Map Analysis

Purpose:

- summarize talent landscape around a Job Profile or segment

Input:

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes

Output:

- talent segments
- common patterns
- market observations
- missing data notes

Evidence:

- candidate and resume sets
- evaluation summaries
- source/channel metadata

Explanation:

- explains segment formation and evidence coverage

Confidence:

- confidence reflects data coverage and consistency

Recruiter interaction:

- recruiter reviews segment names and interpretations

Learning rule:

- approved segments may become Talent Map Models

### 6.10 Recruitment Reports

Purpose:

- summarize recruiting progress, bottlenecks, channels, and trends

Input:

- RecruitLog
- Dashboard KPI
- Pipeline
- Candidate Library
- Evaluation Results
- Interview and Offer outcomes

Output:

- report summary
- bottlenecks
- channel observations
- trend analysis
- suggested improvements

Evidence:

- KPI totals
- stage history
- source/channel data
- outcome data

Explanation:

- separates facts, AI interpretation, and missing data

Confidence:

- confidence reflects data completeness

Recruiter interaction:

- recruiter marks insight as useful, wrong, incomplete, or needs follow-up

Learning rule:

- confirmed insights can become Recruitment Strategy Models or Knowledge entries

---

## 7. Learning Loop

### 7.1 Complete Loop

```text
Job Profile
  -> Resume
  -> Evaluation
  -> Recruiter Review
  -> Phone Screen
  -> Interview
  -> Offer
  -> Hiring Outcome
  -> Recruiter Feedback
  -> Learning Assets
  -> Representative Models
  -> Optimize Job Profile
```

### 7.2 What Is Learned

The system may learn:

- which evidence was useful for a role
- which AI suggestions recruiters accepted
- which AI suggestions were modified or rejected
- which resume signals led to interview follow-up
- which interview questions produced useful evidence
- which channel patterns produced better candidate movement
- which pipeline bottlenecks repeated
- which Job Profile descriptions were unclear
- which Talent Map segments were useful
- which Representative Models became outdated

### 7.3 What Is Not Learned

The system must not learn:

- automatic rejection rules
- hidden score thresholds
- protected-class assumptions
- unreviewed AI conclusions
- private recruiter opinions as organizational truth
- one-off candidate outcomes as universal rules
- unverified correlations as causal rules

### 7.4 Human Approval Points

Human approval is required before:

- confirming Job Profile changes
- activating Evaluation Template versions
- accepting Evaluation Results as reviewed
- converting Resume to Candidate
- changing Pipeline status based on AI suggestion
- publishing Talent Map summaries
- publishing Recruitment Models
- converting Decision Support into Learning Assets
- using feedback to create verified knowledge

---

## 8. Knowledge Evolution

```text
Recruiter Feedback
  -> Verified Knowledge
  -> Knowledge Library
  -> AI Reasoning
  -> Better Decision Support
```

Knowledge must be:

- versioned
- explainable
- reviewable
- auditable
- source-linked
- safe to archive

Knowledge states:

```text
draft
pending_review
verified
active
superseded
archived
rejected
```

Knowledge evolution must preserve prior versions and reviewer notes.

---

## 9. Intelligence Architecture

### 9.1 From Operations To Intelligence

Operational recruiting data becomes intelligence only through review and synthesis.

```text
Operational Data
  -> Decision Support
  -> Human Review
  -> Learning Assets
  -> Recruitment Intelligence
  -> Continuous Optimization
```

### 9.2 Continuous Optimization

Continuous optimization may improve:

- Job Profile clarity
- Evaluation Template completeness
- question quality
- recruiter workflow timing
- Talent Map segmentation
- Recruitment Reports
- channel strategy
- knowledge reuse

Continuous optimization must not:

- silently change business records
- silently change Learning Assets
- make unreviewed hiring decisions
- alter historical Evaluation Results

---

## 10. AI Boundaries

AI should:

- analyze
- summarize
- compare
- identify patterns
- recommend
- explain
- surface missing evidence

AI must not:

- make final hiring decisions
- automatically reject candidates
- automatically advance or remove candidates
- automatically change Learning Assets
- modify Job Profiles without approval
- modify Evaluation Templates without approval
- treat unreviewed output as memory
- create scoring standards
- create classification thresholds

---

## 11. Relationship To Future Evolution

### 11.1 V3 - AI Recruitment Analyst

Learning Assets support:

- reviewed analytics
- channel analysis
- bottleneck detection
- trend interpretation
- report generation

### 11.2 V4 - AI Recruiting Co-Pilot

Learning Assets support:

- next-action proposal quality
- interview plan recommendations
- candidate comparison summaries
- Talent Map refresh suggestions

All actions still require recruiter approval.

### 11.3 V5 - Recruitment Intelligence Platform

Learning Assets support:

- organization-level intelligence
- model library governance
- strategic recruiting reports
- cross-role talent analysis
- policy-aware AI behavior

---

## 12. Explicit Non-Goals

This document does not:

- implement code
- create database tables
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- introduce autonomous hiring decisions
- introduce vector storage or RAG

---

## 13. Readiness For Future Work

Future implementation can use this document to design:

- Decision Support workflows
- Learning Asset lifecycle management
- recruiter feedback collection
- model library governance
- audit requirements
- knowledge evolution workflows

Implementation must preserve the separation between Decision Support and Learning Assets.
