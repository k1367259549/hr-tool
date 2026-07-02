# 14_FEEDBACK_AND_LEARNING_LOOP.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-007 - Feedback And Learning Loop

---

## 1. Purpose

This document defines the recruiter feedback system and learning loop for hr-tool V2.

Feedback improves Learning Assets. Feedback must not rewrite historical records or silently change business decisions.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, define classification thresholds, or modify V1.

---

## 2. Feedback Principles

Feedback must be:

- explicit
- human-authored or human-confirmed
- source-linked
- auditable
- version-aware
- separated from historical AI output

Feedback must not:

- overwrite original AI output
- automatically modify Learning Assets
- silently change Job Profiles
- silently change Evaluation Templates
- create hidden scoring rules

---

## 3. Supported Feedback Types

### 3.1 AI Accepted

Meaning:

- recruiter confirms the AI output is useful as-is

Applies to:

- resume analysis
- candidate evaluation
- risk detection
- questions
- next action suggestions
- reports
- Talent Map analysis

Learning impact:

- may contribute positive evidence to future Learning Asset drafts

Constraint:

- acceptance alone does not automatically activate a Learning Asset

### 3.2 AI Modified

Meaning:

- recruiter keeps part of the AI output but edits content

Captured information:

- original AI output reference
- corrected version
- correction reason
- changed fields

Learning impact:

- identifies prompt, model, parsing, or domain-context improvement opportunities

Constraint:

- original AI output remains unchanged for audit

### 3.3 AI Rejected

Meaning:

- recruiter determines the AI output should not be used

Captured information:

- rejection reason
- evidence issue
- missing context
- hallucination note if applicable

Learning impact:

- prevents the output from becoming a trusted source
- may contribute to prompt/model quality review

Constraint:

- rejection must not delete the source record

### 3.4 AI Incorrect

Meaning:

- recruiter identifies a factual or reasoning error

Captured information:

- incorrect claim
- corrected fact
- source evidence
- error category

Learning impact:

- high-priority signal for prompt/model improvement

Constraint:

- incorrect output cannot become a Learning Asset

### 3.5 Recruiter Explanation

Meaning:

- recruiter explains why they accepted, modified, or rejected AI output

Captured information:

- freeform explanation
- structured reason category
- related source references

Learning impact:

- helps convert feedback into reusable knowledge

Constraint:

- personal opinions must be reviewed before becoming organizational knowledge

### 3.6 Hiring Outcome

Meaning:

- outcome of the recruiting process

Examples:

- hired
- offer declined
- rejected after interview
- withdrew
- moved to talent pool

Learning impact:

- connects earlier Decision Support to final outcomes
- supports Candidate Models, Pipeline Models, and Strategy Models

Constraint:

- one outcome is not a universal rule

### 3.7 Post-Hire Observations

Meaning:

- later observations after a hire joins, if available in future

Examples:

- onboarding fit notes
- performance observations
- role match observations

Learning impact:

- strengthens long-term Recruitment Models

Constraint:

- must be privacy-aware and reviewed before reuse

---

## 4. Feedback Lifecycle

```text
AI Output
  -> Recruiter Review
  -> Feedback Captured
  -> Feedback Classified
  -> Quality Note
  -> Learning Asset Draft
  -> Human Approval
  -> Learning Asset Version
```

Feedback states:

```text
captured
classified
needs_review
approved_for_learning
rejected_for_learning
used_in_asset_version
archived
```

---

## 5. Complete Learning Loop

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
  -> Recruitment Models
  -> Better Decision Support
  -> Job Profile / Strategy Optimization Proposal
  -> Human Approval
```

### 5.1 What Is Learned

The system may learn reviewed patterns about:

- useful resume evidence
- weak evidence or missing evidence
- effective phone screen questions
- effective interview questions
- common risk patterns
- channel performance patterns
- pipeline bottlenecks
- job profile ambiguity
- candidate model drift
- talent market changes

### 5.2 What Is Not Learned

The system must not learn:

- automatic rejection rules
- protected-class inferences
- hidden score thresholds
- hidden classification thresholds
- unreviewed AI output
- unverified one-off opinions
- causal claims from weak correlation

### 5.3 Human Approval Points

Human approval is required before:

- feedback is used for Learning Assets
- Learning Asset drafts become active
- Recruitment Models become active
- Job Profile changes are applied
- Evaluation Template versions are activated
- prompt/model changes affect production behavior
- AI-suggested next actions are executed

---

## 6. Learning Asset Update Rules

Learning Assets are updated through versioning, not mutation of history.

```text
Active Learning Asset v1
  -> New Evidence
  -> Draft Learning Asset v2
  -> Review
  -> Activate v2
  -> Supersede v1
```

Rules:

- historical records keep their original references
- old versions remain interpretable
- rejected drafts are auditable where retained
- active version changes require reviewer approval

---

## 7. Knowledge Evolution Flow

```text
Recruiter Feedback
  -> Verified Knowledge Draft
  -> Review
  -> Knowledge Library
  -> AI Reasoning Context
  -> Better Decision Support
```

Knowledge must preserve:

- source records
- reviewer
- reason for acceptance
- version
- lifecycle state
- archive reason if archived

Knowledge must not:

- include unnecessary personal information
- become active without review
- override domain records

---

## 8. Decision Support Improvement Flow

```text
Feedback
  -> Quality Notes
  -> Learning Asset Drafts
  -> Active Learning Assets
  -> Input Builder Context
  -> Prompt Version Proposal
  -> Decision Support Improvement
```

Improvements may affect:

- input construction
- missing evidence detection
- question suggestions
- report structure
- Talent Map summaries
- Candidate Model comparisons

Improvements must not affect:

- historical AI outputs
- historical Evaluation Results
- recruiter-authored decisions

---

## 9. Audit Requirements

Each feedback and learning event should be auditable.

Audit should answer:

- What AI output was reviewed?
- What source evidence was used?
- Who reviewed it?
- What decision was made?
- What changed?
- Why was it changed?
- Which Learning Asset version used it?
- Which later Decision Support output referenced it?

Audit must not expose:

- API keys
- provider secrets
- unnecessary raw personal data
- full private environment values

---

## 10. Feedback Quality Controls

Feedback quality controls:

- require reason for rejection or incorrect marking
- distinguish correction from opinion
- distinguish missing evidence from negative evidence
- track reviewer confidence
- identify conflicting feedback
- require review before knowledge activation

Conflicting feedback should produce:

- conflict note
- need for additional review
- no automatic Learning Asset update

---

## 11. AI Boundary In Feedback

AI may assist by:

- summarizing feedback
- grouping similar feedback
- identifying repeated correction patterns
- proposing Learning Asset drafts
- suggesting prompt/model improvement candidates

AI must not:

- approve its own feedback
- activate Learning Assets
- rewrite historical outputs
- decide that a recruiter was wrong without review
- remove evidence from audit history

---

## 12. Future Evolution

### 12.1 V3 - AI Recruitment Analyst

Feedback supports:

- report quality improvement
- trend interpretation quality
- channel analysis quality
- model comparison

### 12.2 V4 - AI Recruiting Co-Pilot

Feedback supports:

- better action proposals
- safer workflow suggestions
- improved interview planning
- Talent Map refresh suggestions

All action execution remains human-approved.

### 12.3 V5 - Recruitment Intelligence Platform

Feedback supports:

- governance
- organization-level Learning Assets
- strategic intelligence
- model library lifecycle management

---

## 13. Explicit Non-Goals

This document does not:

- implement feedback storage
- create database tables
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- automate final hiring decisions

---

## 14. Readiness For Future Work

Future implementation can use this document to design:

- feedback capture UI
- feedback service boundaries
- Learning Asset review workflow
- audit model
- model version lifecycle
- prompt/model improvement workflow

Implementation must preserve original AI output and historical records.
