# 13_RECRUITMENT_MODELS.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-007 - Recruitment Models

---

## 1. Purpose

This document expands Representative Candidate Models into a complete Recruitment Model Library for hr-tool V2.

Recruitment Models are Learning Assets. They are not raw AI outputs, not hidden rules, and not automatic decision engines.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, define classification thresholds, or modify V1.

---

## 2. Recruitment Model Library

```text
Recruitment Model Library
  -> Candidate Models
  -> Job Profile Models
  -> Recruitment Channel Models
  -> Interview Models
  -> Pipeline Models
  -> Recruitment Strategy Models
  -> Talent Market Models
```

All models must be:

- generated from reviewed data
- reviewed before activation
- versioned
- explainable
- auditable
- owned
- safe to archive

All models must not:

- represent final hiring truth
- replace recruiter decisions
- define scoring standards
- define classification thresholds
- automatically update themselves

---

## 3. Candidate Models

### 3.1 What They Represent

Candidate Models represent recurring candidate patterns observed for a Job Profile, role family, or talent segment.

Examples:

- Excellent Candidate Model
- Good Candidate Model
- Average Candidate Model
- Rejected Candidate Model
- Future Talent Pool Candidate Model

These labels are descriptive categories only. They do not define thresholds.

### 3.2 Data Sources

- Candidate Library
- Resume Library
- Parsed Resume
- Evaluation Results
- Phone Screen notes
- Interview feedback
- Offer outcomes
- hiring outcomes
- recruiter feedback

### 3.3 Update Strategy

- collect reviewed evidence
- propose model draft
- recruiter reviews draft
- activate as new version
- keep previous versions
- archive outdated models

### 3.4 Business Value

- helps recruiters understand role-specific candidate patterns
- supports better interview preparation
- improves consistency of Decision Support
- helps build Talent Map intelligence

### 3.5 Boundaries

- no automatic candidate rejection
- no automatic candidate ranking
- no hidden score thresholds

---

## 4. Job Profile Models

### 4.1 What They Represent

Job Profile Models represent reusable patterns in how an organization defines roles.

They may capture:

- common role context
- recurring responsibility patterns
- missing information patterns
- reusable role-family structure
- clarified language from recruiter corrections

### 4.2 Data Sources

- Job Profiles
- Evaluation Templates
- recruiter corrections
- Candidate Evaluation outcomes
- Talent Map observations
- Recruitment Reports

### 4.3 Update Strategy

- compare Job Profile drafts and outcomes
- identify repeated missing information
- propose model update
- recruiter approves new version

### 4.4 Business Value

- improves future Job Profile creation
- reduces ambiguous role descriptions
- improves quality of evaluation input
- supports consistent hiring context

### 4.5 Boundaries

- AI cannot modify Job Profiles without approval
- Job Profile Models do not define scoring rules

---

## 5. Recruitment Channel Models

### 5.1 What They Represent

Recruitment Channel Models represent observed patterns in sourcing channels.

Examples:

- channel volume pattern
- channel candidate profile pattern
- channel pipeline movement pattern
- channel data quality pattern

### 5.2 Data Sources

- source/channel metadata
- Resume Library
- Candidate Library
- Pipeline history
- Interview outcomes
- Offer outcomes
- RecruitLog and Dashboard KPI summaries

### 5.3 Update Strategy

- aggregate reviewed source/channel evidence
- compare across time windows
- propose new channel model version
- recruiter or sourcing owner approves

### 5.4 Business Value

- supports sourcing strategy
- identifies channel data quality issues
- helps explain funnel differences by channel

### 5.5 Boundaries

- channel models do not automatically decide where to source
- weak data coverage must be explicit

---

## 6. Interview Models

### 6.1 What They Represent

Interview Models represent reusable interview patterns for role-specific evidence gathering.

They may include:

- useful question patterns
- weak question patterns
- common evidence gaps
- feedback completeness patterns
- round-specific focus areas

### 6.2 Data Sources

- generated interview questions
- recruiter edits
- interviewer feedback
- Evaluation Results
- Candidate outcomes
- post-hire observations when available

### 6.3 Update Strategy

- track reviewed question usefulness
- identify questions that produce useful evidence
- propose model revision
- reviewer approves new version

### 6.4 Business Value

- improves interview quality
- reduces repeated missing evidence
- helps interviewers focus on role-relevant evidence

### 6.5 Boundaries

- models do not replace interviewer judgment
- models must avoid sensitive or protected-class questions

---

## 7. Pipeline Models

### 7.1 What They Represent

Pipeline Models represent recurring process patterns in candidate movement.

They may capture:

- common bottlenecks
- stale candidate patterns
- stage handoff issues
- repeated missing actions
- timing patterns

### 7.2 Data Sources

- Pipeline stage history
- Candidate Library
- Phone Screen records
- Interview records
- Offer records
- RecruitLog activity
- recruiter feedback

### 7.3 Update Strategy

- analyze reviewed process reports
- identify repeated bottlenecks
- propose process model version
- recruiter or process owner approves

### 7.4 Business Value

- improves operational visibility
- supports next-action suggestions
- helps identify workflow friction

### 7.5 Boundaries

- Pipeline Models do not automatically move candidates
- AI suggestions require approval

---

## 8. Recruitment Strategy Models

### 8.1 What They Represent

Recruitment Strategy Models represent reusable strategic guidance derived from reviewed recruiting evidence.

They may capture:

- role-family sourcing strategy
- interview sequencing strategy
- channel allocation guidance
- follow-up timing patterns
- talent pool strategy

### 8.2 Data Sources

- Recruitment Reports
- Talent Map Models
- Channel Models
- Pipeline Models
- hiring outcomes
- recruiter feedback

### 8.3 Update Strategy

- collect verified strategic insights
- propose strategy model draft
- review against current hiring context
- activate as versioned model

### 8.4 Business Value

- supports planning beyond individual candidates
- helps convert operations into strategy
- enables V3/V4/V5 intelligence stages

### 8.5 Boundaries

- strategy models are guidance only
- they do not define final hiring policies

---

## 9. Talent Market Models

### 9.1 What They Represent

Talent Market Models represent observed market and talent distribution patterns for a role or segment.

They may capture:

- common background distribution
- common skill clusters
- availability signals
- source/channel patterns
- market gaps
- competition notes when available

### 9.2 Data Sources

- Talent Map
- Candidate Library
- Resume Library
- Evaluation Results
- channel metadata
- recruiter observations

### 9.3 Update Strategy

- refresh from reviewed Talent Map updates
- compare market observations over time
- approve new model versions

### 9.4 Business Value

- improves hiring difficulty understanding
- supports realistic Job Profile refinement
- informs sourcing and interview strategy

### 9.5 Boundaries

- market models are not external market truth
- missing data must be explicit

---

## 10. Model Relationships

```text
Candidate Models
  -> inform Talent Map Models
  -> inform Interview Models

Job Profile Models
  -> inform Candidate Evaluation
  -> inform Recruitment Strategy Models

Recruitment Channel Models
  -> inform Recruitment Strategy Models
  -> inform Pipeline Models

Interview Models
  -> inform Evaluation quality
  -> inform Candidate Models

Pipeline Models
  -> inform Next Action Suggestions
  -> inform Recruitment Reports

Talent Market Models
  -> inform Job Profile refinement
  -> inform Talent Map Analysis

Recruitment Strategy Models
  -> inform planning and reporting
```

Model relationships must be source-linked and auditable.

---

## 11. Model Versioning

Every Recruitment Model should support:

- model name
- model category
- version
- source scope
- source time window
- owner
- reviewer
- created timestamp
- active status
- superseded version reference
- archive reason

This section is conceptual guidance only, not a database schema.

---

## 12. Model Lifecycle

```text
draft
  -> pending_review
  -> active
  -> superseded
  -> archived

draft
  -> rejected
```

Rules:

- only active models influence Decision Support
- rejected models remain available for audit if retained
- archived models do not guide new AI reasoning
- superseded models remain interpretable for historical outputs

---

## 13. Model Governance

Recruitment Models require:

- human approval
- source evidence
- explanation
- confidence signal
- change history
- archive policy
- privacy review where needed

Model updates must not:

- rewrite historical Evaluation Results
- hide rejected model drafts
- silently change active Decision Support behavior
- create hidden scoring standards

---

## 14. Explicit Non-Goals

This document does not:

- implement a model registry
- create database tables
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- automate hiring decisions
