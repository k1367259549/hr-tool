# 19_HUMAN_IN_THE_LOOP.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-009 - Human In The Loop

---

## 1. Purpose

This document defines the human-in-the-loop architecture for hr-tool V2 workflow orchestration.

Human review is mandatory for high-impact recruiting decisions, AI-generated judgments, and Learning Asset publication.

This is an architecture document only. It does not implement code, define database tables, create APIs, define prompts, define scoring standards, connect Feishu, modify V1, or redesign existing modules.

---

## 2. Core Principle

AI assists. Recruiters decide.

Workflow:

```text
AI Suggestion / Workflow Proposal
  -> Recruiter Review
  -> Approve / Modify / Reject
  -> Feedback
  -> Continue / Retry / Stop / Convert To Learning Asset Draft
```

Decision Support helps the current workflow. Learning Assets require explicit human approval before they become reusable organizational intelligence.

---

## 3. Review Decision Types

Supported review decisions:

```text
approve
modify
reject
mark_incorrect
request_regeneration
defer
cancel_workflow
archive_source
```

Review decisions should capture:

- reviewer
- timestamp
- reviewed object
- decision
- reason
- corrections if modified
- evidence references
- confidence or quality note
- next action

---

## 4. Mandatory Approval Points

### 4.1 Job Profile Confirmation

Approval required before:

- AI-generated Job Profile draft becomes confirmed hiring context
- Job Profile changes affect Evaluation input
- Job Profile Model proposal influences future drafts

Allowed decisions:

- approve
- modify
- reject
- request missing information

Why:

- Job Profile anchors evaluation context and Talent Map interpretation.

### 4.2 Evaluation Template Activation

Approval required before:

- a template version becomes active
- AI-suggested template structure is used
- prompt or output schema references affect evaluation workflows

Allowed decisions:

- approve
- modify
- reject
- archive

Why:

- templates shape evaluation outputs and must not hide scoring criteria.

### 4.3 AI Parsing Review

Approval required when:

- parsing confidence is low
- required fields are ambiguous
- duplicate signals exist
- AI output includes warnings
- recruiter wants to use parsed data for evaluation

Allowed decisions:

- approve parsed resume
- modify parsed fields
- reject parse
- request regeneration
- continue with manual data

Why:

- parsed resume facts can affect evaluation and candidate identity.

### 4.4 Candidate Creation

Approval required before:

- Resume becomes Candidate
- Resume is linked to existing Candidate
- duplicate candidates are merged in future
- Candidate is added to active Pipeline

Allowed decisions:

- create Candidate
- link to existing Candidate
- keep in Resume Library
- mark duplicate
- archive
- keep for future talent pool

Why:

- Candidate is a person-level record and should not be created automatically from uncertain data.

### 4.5 Evaluation Result Review

Approval required before:

- AI Evaluation Result is used for candidate conversion
- strengths, weaknesses, risks, and questions guide next steps
- Evaluation Result contributes to Learning Asset drafts

Allowed decisions:

- accept
- partially accept
- modify
- reject as invalid
- request regeneration
- add reviewer notes

Why:

- Evaluation Results are Decision Support and may contain incomplete or incorrect reasoning.

### 4.6 Pipeline Movement

Approval required before:

- AI-suggested stage movement
- candidate rejection
- movement to talent pool
- final pipeline outcome

Allowed decisions:

- approve move
- modify target stage
- reject move
- defer
- cancel workflow

Why:

- pipeline movement affects candidate experience and recruiting records.

### 4.7 Phone Screen Questions

Approval required before:

- generated questions are used in a phone screen
- question set becomes reusable knowledge

Allowed decisions:

- approve
- edit
- remove question
- add manual question
- reject generated set

Why:

- questions must be job-related, useful, and free from sensitive/protected-class inference.

### 4.8 Interview Questions

Approval required before:

- generated questions are used in interviews
- questions contribute to Interview Models

Allowed decisions:

- approve
- edit
- remove question
- add manual question
- reject generated set

Why:

- interview questions affect fairness and evidence quality.

### 4.9 Interview Feedback Summary

Approval required before:

- AI summary of interviewer feedback is treated as reviewed
- missing evidence notes affect next steps
- feedback contributes to Candidate Models or Interview Models

Allowed decisions:

- approve summary
- modify summary
- reject summary
- request regeneration

Why:

- AI must not invent interviewer feedback or replace human-authored assessment.

### 4.10 Offer Recommendation

Approval required before:

- offer readiness recommendation influences offer workflow
- offer risk summary is used for next action
- final offer status is recorded

Allowed decisions:

- approve recommendation
- modify recommendation
- reject recommendation
- request more evidence
- proceed manually

Why:

- AI must not approve offers, reject offers, or create compensation rules.

### 4.11 Talent Map Publication

Approval required before:

- Talent Map draft becomes published
- segment names become active
- Talent Map observations feed Representative Models

Allowed decisions:

- approve
- rename segment
- merge segment
- modify observations
- reject
- request regeneration

Why:

- Talent Map output can shape sourcing strategy and must be evidence-backed.

### 4.12 Representative Model Publication

Approval required before:

- Representative Candidate Model becomes active
- Recruitment Model version is used by future Decision Support

Allowed decisions:

- approve model version
- modify model version
- reject model version
- archive old version
- request more evidence

Why:

- Representative Models are Learning Assets and must not become hidden scoring rules.

### 4.13 Learning Asset Publication

Approval required before:

- Decision Support becomes Learning Asset
- Knowledge entry becomes verified or active
- Recruitment Model becomes active
- active Learning Asset is superseded

Allowed decisions:

- approve
- modify
- reject
- archive
- supersede

Why:

- organizational memory must be reviewed, versioned, explainable, and auditable.

---

## 5. Human Review Flow By Workflow

### 5.1 Resume Parsing

```text
AI Parsing Output
  -> Recruiter Review
  -> Approve / Modify / Reject / Regenerate
  -> Resume Parsing Workflow Continues
```

If rejected:

- preserve original AI output
- record reason
- move to manual correction or retry

### 5.2 Evaluation

```text
AI Evaluation Result
  -> Recruiter Review
  -> Accept / Modify / Reject / Regenerate
  -> Candidate Conversion Or Pipeline Decision
```

If modified:

- preserve AI output
- store corrected output separately in future implementation
- create feedback signal

### 5.3 Candidate Conversion

```text
Reviewed Resume + Reviewed Evaluation
  -> Conversion Review
  -> Create Candidate / Link Existing / Keep / Archive / Duplicate
```

No AI output may create a Candidate without recruiter confirmation.

### 5.4 Pipeline

```text
Stage Proposal
  -> Recruiter Review
  -> Move / Modify / Reject / Defer
  -> Pipeline Event
```

Stage movement must be auditable.

### 5.5 Learning Asset

```text
Decision Support + Feedback + Outcome Evidence
  -> Learning Asset Draft
  -> Human Review
  -> Active / Modified / Rejected / Archived
```

No Learning Asset can activate itself.

---

## 6. Feedback Capture

Every review should optionally or mandatorily capture feedback depending on risk.

Mandatory feedback:

- AI marked incorrect
- AI rejected
- candidate rejected after AI recommendation
- Learning Asset rejected
- Talent Map rejected
- Representative Model rejected
- offer recommendation rejected

Recommended feedback:

- AI modified
- question edited
- parsing corrected
- Evaluation Result partially accepted

Feedback fields:

```text
feedbackType
reviewer
reason
correctedFields
sourceEvidence
qualityNote
futureImprovementNote
```

Feedback improves Learning Assets and prompt/model improvement candidates. It must not rewrite historical records.

---

## 7. AI Trigger Rules

AI may be automatically triggered only when prerequisites are satisfied and the result remains reviewable.

### 7.1 Resume Uploaded

Trigger:

```text
ResumeUploaded
  -> ResumeParsingRequested
```

Conditions:

- file/source validated
- resume is not blocked by duplicate review
- AI provider configured

Output:

- Parsed Resume Decision Support

Review:

- required when warnings, low confidence, or before evaluation use

### 7.2 Resume Parsed

Trigger:

```text
ResumeParsed
  -> ResumeAnalyzer
  -> Optional EvaluationRequested
```

Conditions:

- Job Profile exists
- Evaluation Template version selected
- parsed output validated

Output:

- chunks and Evaluation Result draft

Review:

- required before candidate conversion

### 7.3 Evaluation Reviewed

Trigger:

```text
EvaluationReviewed
  -> Optional Candidate Summary
  -> CandidateConversionRequested
```

Conditions:

- review decision accepts or modifies evaluation for workflow use

Output:

- candidate summary Decision Support or conversion workflow proposal

Review:

- required before Candidate creation

### 7.4 Pipeline Stage Changed

Trigger:

```text
PipelineMoved
  -> Optional Next Action Suggestion
```

Conditions:

- candidate active
- Job Profile context available

Output:

- next action suggestions

Review:

- required before action execution

### 7.5 Phone Screen Or Interview Completed

Trigger:

```text
PhoneScreenCompleted / InterviewCompleted
  -> Optional Summary
  -> Optional EvaluationRequested
```

Conditions:

- notes or feedback available
- recruiter allows AI summary

Output:

- summary, risks, missing evidence, optional Evaluation Result

Review:

- required before downstream use

### 7.6 Offer Outcome Recorded

Trigger:

```text
OfferAccepted / OfferDeclined
  -> FeedbackSubmitted
  -> LearningAssetDraftCandidate
```

Conditions:

- reviewed outcome exists
- source references available

Output:

- learning signal, not active Learning Asset

Review:

- required before any Learning Asset activation

### 7.7 Talent Map Approved

Trigger:

```text
TalentMapApproved
  -> RepresentativeModelGenerated
```

Conditions:

- enough reviewed candidate/evaluation/pipeline data
- Talent Map approved

Output:

- Representative Model draft

Review:

- required before publication

---

## 8. Failure Handling And Human Review

### 8.1 AI Timeout

Recovery:

- retry within configured limits
- keep workflow in retry state
- allow recruiter to continue manually
- record safe audit

Human action:

- retry
- continue manually
- cancel

### 8.2 Invalid JSON Or Schema Failure

Recovery:

- reject invalid output
- do not save as valid parsed output
- retry or request manual review

Human action:

- regenerate
- manually enter result
- cancel workflow

### 8.3 Recruiter Rejects AI Output

Recovery:

- preserve original AI output
- capture reason
- stop downstream use
- allow regeneration or manual replacement

Human action:

- reject
- explain
- choose next workflow path

### 8.4 Duplicate Resume

Recovery:

- pause automatic parsing or conversion if needed
- present duplicate signals
- wait for recruiter decision

Human action:

- link to existing Candidate
- mark duplicate
- keep separate
- archive

### 8.5 Missing Job Profile

Recovery:

- block evaluation workflow
- ask recruiter to select or create Job Profile

Human action:

- select Job Profile
- create Job Profile
- cancel evaluation

### 8.6 Cancelled Workflow

Recovery:

- preserve source records
- record cancellation reason
- stop pending AI tasks where possible
- leave domain state unchanged unless already completed through module service

Human action:

- reopen through a new workflow if needed

---

## 9. Audit Requirements

Every human review action must record:

```text
reviewId
workflowId
eventId
reviewedObjectType
reviewedObjectId
reviewer
decision
reason
corrections
stateBefore
stateAfter
timestamp
sourceEvidence
aiProvider if applicable
aiModel if applicable
promptVersion if applicable
```

Audit must support:

- explaining why a workflow advanced
- explaining why an AI output was accepted or rejected
- tracing Learning Asset source evidence
- preserving historical records after corrections
- reviewing prompt/model quality over time

Audit must not expose:

- API keys
- provider secrets
- unnecessary raw resume text
- unnecessary contact data
- full private environment values

---

## 10. Relationship To Learning Assets

Human review is the only bridge from Decision Support to Learning Assets.

```text
Decision Support
  -> Human Review
  -> Feedback
  -> Learning Asset Draft
  -> Human Approval
  -> Active Learning Asset
```

Rules:

- accepted AI output does not automatically become a Learning Asset
- feedback alone does not activate a Learning Asset
- Learning Asset drafts must include source references
- active Learning Assets must be versioned and auditable
- rejected Learning Assets must not guide future Decision Support

---

## 11. Explicit Non-Goals

This document does not:

- implement review UI
- define database schema
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- automate final decisions
- allow AI to approve its own output
