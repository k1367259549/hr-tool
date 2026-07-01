# 12_DECISION_SUPPORT_AND_LEARNING_ASSETS.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-007 - Decision Support And Learning Assets

---

## 1. Purpose

This document defines Decision Support capabilities and Learning Assets for hr-tool V2.

The distinction is mandatory:

```text
Decision Support
  -> helps a current recruiter workflow

Learning Asset
  -> preserves reviewed reusable recruiting intelligence
```

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, define classification thresholds, or modify V1.

---

## 2. Decision Support Rules

Decision Support must include:

- purpose
- input
- output
- evidence
- explanation
- confidence
- recruiter interaction
- audit metadata

Decision Support must not:

- become organizational memory automatically
- bypass recruiter review
- modify domain objects without approval
- define hidden scoring rules
- define classification thresholds

---

## 3. Decision Support Capabilities

### 3.1 Resume Analysis

Purpose:

- summarize resume content and identify useful evidence for review

Input:

- Original Resume
- Parsed Resume
- Resume Chunk
- source metadata

Output:

- resume summary
- evidence map
- missing information
- parsing concerns
- duplicate signals

Evidence:

- original resume section references
- parsed resume fields
- chunk references

Explanation:

- explains why each observation is present

Confidence:

- extraction reliability and evidence coverage

Recruiter interaction:

- review, correct, accept, or reject observations

### 3.2 Candidate Evaluation

Purpose:

- assist role-specific candidate review

Input:

- Candidate or Resume
- Job Profile
- Evaluation Template version
- Evaluation Result history

Output:

- Evaluation Result draft
- strengths
- weaknesses
- risks
- missing evidence
- score placeholder
- classification placeholder

Evidence:

- parsed resume fields
- chunks
- prior notes
- interview or phone screen evidence when available

Explanation:

- separates direct evidence, inference, and missing information

Confidence:

- evidence completeness and consistency

Recruiter interaction:

- accept, modify, reject, mark incorrect, or request regeneration

### 3.3 Strengths

Purpose:

- identify evidence-backed strengths for the current role

Input:

- Job Profile
- Candidate or Resume
- Evaluation Result input package

Output:

- strengths
- supporting evidence
- evidence quality notes

Evidence:

- source chunks and domain records

Explanation:

- explains the role context for each strength

Confidence:

- confidence signal based on evidence quality

Recruiter interaction:

- confirm, edit, or reject each strength

### 3.4 Weaknesses

Purpose:

- identify possible gaps that need recruiter verification

Input:

- Job Profile
- Candidate evidence
- missing evidence map

Output:

- weaknesses
- missing evidence
- validation suggestions

Evidence:

- absent, weak, or conflicting evidence

Explanation:

- distinguishes missing evidence from negative evidence

Confidence:

- lower confidence when evidence is incomplete

Recruiter interaction:

- verify, correct, or reject

### 3.5 Risk Detection

Purpose:

- surface recruiting risks for human review

Input:

- Candidate
- Resume
- Evaluation Result
- Phone Screen notes
- Interview notes
- Offer context

Output:

- risk list
- supporting evidence
- uncertainty notes
- follow-up suggestions

Evidence:

- source records, chunks, and notes

Explanation:

- explains risk origin and uncertainty

Confidence:

- reliability of risk signal

Recruiter interaction:

- validate, dismiss, or add follow-up action

### 3.6 Phone Screen Questions

Purpose:

- help recruiters validate missing evidence early

Input:

- Job Profile
- Evaluation Result
- Candidate or Resume context
- missing evidence

Output:

- phone screen questions
- purpose
- evidence gap

Evidence:

- missing or uncertain data points

Explanation:

- explains what each question should clarify

Confidence:

- question relevance to evidence gap

Recruiter interaction:

- edit before use

### 3.7 Interview Questions

Purpose:

- suggest structured interview questions

Input:

- Job Profile
- Evaluation Template version
- Candidate context
- Phone Screen summary
- missing evidence

Output:

- interview questions
- focus areas
- evidence target

Evidence:

- previous Evaluation Results and notes

Explanation:

- explains why each question matters

Confidence:

- alignment with Job Profile and missing evidence

Recruiter interaction:

- interviewer or recruiter edits before use

### 3.8 Next Action Suggestions

Purpose:

- help recruiters decide operational next steps

Input:

- Candidate
- Pipeline
- Evaluation Result
- Phone Screen
- Interview
- Offer

Output:

- next action suggestions
- reason
- urgency signal
- required confirmation

Evidence:

- pipeline status, timestamps, notes, missing evidence

Explanation:

- explains the workflow reason

Confidence:

- relevance and urgency confidence

Recruiter interaction:

- approve, modify, reject, or ignore

### 3.9 Talent Map Analysis

Purpose:

- summarize talent landscape and candidate segments

Input:

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes

Output:

- talent segments
- market observations
- common patterns
- missing data notes

Evidence:

- aggregated candidate and resume evidence

Explanation:

- explains segment formation

Confidence:

- data coverage and consistency

Recruiter interaction:

- approve, rename, merge, or reject segments

### 3.10 Recruitment Reports

Purpose:

- support data-driven recruiting operations

Input:

- RecruitLog
- KPI summaries
- Pipeline history
- Candidate Library
- Evaluation Results
- Interview and Offer outcomes

Output:

- report summary
- bottleneck observations
- channel analysis
- trend observations
- suggested improvements

Evidence:

- operational data and reviewed domain records

Explanation:

- separates facts, interpretation, and missing data

Confidence:

- data completeness and consistency

Recruiter interaction:

- mark useful, wrong, incomplete, or action-worthy

---

## 4. Learning Asset Rules

Learning Assets must define:

- source
- creation process
- update process
- versioning
- ownership
- lifecycle
- archive policy

Learning Assets must always be human-reviewed.

Common lifecycle:

```text
draft
  -> pending_review
  -> active
  -> superseded
  -> archived

draft
  -> rejected
```

Common ownership:

- creator
- reviewer
- owner
- future team owner when multi-user support exists

Common archive reasons:

- outdated
- contradicted by newer evidence
- no longer relevant to active Job Profiles
- duplicate
- privacy or retention requirement
- recruiter rejected as unreliable

---

## 5. Learning Assets

### 5.1 Excellent Candidate Model

Source:

- reviewed Evaluation Results
- Interview outcomes
- Offer outcomes
- hiring outcomes
- recruiter feedback

Creation process:

- synthesized from accumulated reviewed evidence for a Job Profile or talent segment
- recruiter approves before active use

Update process:

- new version proposed when enough reviewed evidence changes the pattern

Versioning:

- versioned by Job Profile or talent segment

Ownership:

- recruiter owner or future hiring team owner

Lifecycle:

- draft, pending_review, active, superseded, archived, rejected

Archive policy:

- archive when role requirements change or model becomes outdated

### 5.2 Average Candidate Model

Source:

- reviewed candidate evaluations
- pipeline outcomes
- interview feedback

Creation process:

- synthesized from repeated patterns among candidates considered typical for a role

Update process:

- updated through reviewed outcome evidence

Versioning:

- versioned by role context and time period

Ownership:

- recruiter or hiring team owner

Lifecycle:

- same as common lifecycle

Archive policy:

- archive if market data or Job Profile changes substantially

### 5.3 Rejected Candidate Model

Source:

- reviewed rejection decisions
- recruiter explanations
- interview evidence
- missing evidence notes

Creation process:

- summarizes patterns seen in rejected candidates without creating automatic rejection rules

Update process:

- updated only from reviewed evidence and documented recruiter rationale

Versioning:

- versioned per Job Profile or talent segment

Ownership:

- recruiter owner

Lifecycle:

- same as common lifecycle

Archive policy:

- archive if it risks becoming a hidden rejection rule or no longer matches current role context

### 5.4 Job Profile Model

Source:

- active and historical Job Profiles
- recruiter corrections
- candidate evaluation outcomes
- Talent Map observations

Creation process:

- identifies reusable patterns in successful Job Profile definitions

Update process:

- explicit version update after recruiter approval

Versioning:

- versioned by role family, department, and time period

Ownership:

- hiring owner or recruiter owner

Lifecycle:

- draft, pending_review, active, superseded, archived

Archive policy:

- archive when role family changes or organization context changes

### 5.5 Talent Map Model

Source:

- Talent Map analysis
- Candidate Library
- Resume Library
- Evaluation Results
- source/channel evidence

Creation process:

- reviewed Talent Map segments become reusable models

Update process:

- refreshed when new reviewed candidate evidence changes the map

Versioning:

- versioned by Job Profile, segment, and time range

Ownership:

- recruiter or talent strategy owner in future

Lifecycle:

- same as common lifecycle

Archive policy:

- archive when data is stale or segment no longer exists

### 5.6 Interview Model

Source:

- reviewed interview questions
- interviewer feedback
- candidate outcomes
- recruiter notes

Creation process:

- identifies question patterns that produce useful evidence

Update process:

- versioned updates from reviewed interview feedback quality

Versioning:

- versioned by role, round, and interview focus

Ownership:

- recruiter or interview owner

Lifecycle:

- draft, pending_review, active, superseded, archived, rejected

Archive policy:

- archive if questions become outdated, biased, unclear, or ineffective

### 5.7 Recruitment Channel Model

Source:

- source/channel metadata
- Resume Library
- Candidate Library
- Pipeline outcomes
- Offer outcomes

Creation process:

- channel patterns are synthesized from reviewed operational data

Update process:

- updated with reviewed channel performance observations

Versioning:

- versioned by channel, role family, and time period

Ownership:

- recruiter or sourcing owner

Lifecycle:

- same as common lifecycle

Archive policy:

- archive when channel behavior changes or data quality is insufficient

### 5.8 Recruitment Strategy Model

Source:

- Recruitment Reports
- pipeline bottlenecks
- channel analysis
- recruiter feedback
- hiring outcomes

Creation process:

- reviewed strategy insights become reusable strategic guidance

Update process:

- updated after repeated reviewed evidence or post-hire observations

Versioning:

- versioned by hiring goal, role family, and time period

Ownership:

- recruiter or hiring strategy owner

Lifecycle:

- draft, pending_review, active, superseded, archived

Archive policy:

- archive if strategy becomes obsolete or contradicted by outcomes

### 5.9 Recruitment Knowledge

Source:

- Knowledge Generator drafts
- recruiter notes
- reviewed AI outputs
- Interview and Offer lessons
- post-hire observations

Creation process:

- human-reviewed knowledge entries become active knowledge

Update process:

- edits create new versions or reviewed revisions

Versioning:

- versioned by content, source, and reviewer

Ownership:

- creator and reviewer

Lifecycle:

- draft, pending_review, verified, active, superseded, archived, rejected

Archive policy:

- archive duplicate, stale, unverified, or privacy-sensitive entries

---

## 6. Decision Support To Learning Asset Conversion

```text
Decision Support Output
  -> Recruiter Review
  -> Feedback
  -> Candidate Outcome / Hiring Outcome
  -> Learning Asset Draft
  -> Human Approval
  -> Active Learning Asset
```

Conversion requires:

- source references
- reviewer decision
- explanation
- confidence signal
- version metadata
- audit trail

Conversion must not:

- overwrite historical records
- hide rejected AI output
- treat one case as universal truth
- create score thresholds

---

## 7. Explicit Non-Goals

This document does not:

- implement code
- create database tables
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- automate final decisions
