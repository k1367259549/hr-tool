# 24_FEATURE_001_RECRUITING_CONTEXT_ENGINE.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Feature: FEATURE-001 - Recruiting Context Engine

---

## 1. Goal

Recruiting Context Engine is the shared context layer for AI Recruiter workflows.

It creates one versioned `RecruitingContext` object so downstream workflows do not collect recruiting data independently.

This feature does not call AI, execute actions, create Learning Assets, score candidates, rank candidates, or redesign the database.

---

## 2. Service

Implemented service:

```text
RecruitingContextService
```

Responsibilities:

- aggregate reviewed Job Profiles
- aggregate reviewed Candidate Insights
- aggregate Recruit Together records
- aggregate Daily Workspace records
- aggregate Recruitment Tasks
- aggregate Recruiter Notes
- aggregate Schedule items
- produce Workflow History
- produce Pending Actions summary
- produce audit metadata
- expose placeholders for Talent Map, Learning Assets, and Analytics

---

## 3. Output

The service returns:

```text
RecruitingContext
```

Core fields:

- `contextVersion`
- `generatedAt`
- `recruiter`
- `today`
- `jobs`
- `candidates`
- `tasks`
- `schedule`
- `notes`
- `workflowHistory`
- `reviewedInsights`
- `pendingActions`
- `audit`

Future placeholders:

- `talentMap`
- `learningAssets`
- `analytics`

---

## 4. Architecture Relationship

`RecruitingContextService` is the single source of recruiting context.

```text
Repositories
  -> RecruitingContextService
  -> RecruitingContext
  -> NextBestActionService
  -> Workspace / Task Center
```

`NextBestActionService` now consumes `RecruitingContext` and focuses on generating Action Cards.

No workflow should duplicate context aggregation logic.

---

## 5. Audit

The context audit records:

- context version
- generation timestamp
- source record counts
- constraints

Constraints are explicit:

- no AI calls
- no scoring or ranking
- no autonomous actions
- no Learning Assets are created

---

## 6. Explicit Non-Goals

This feature does not implement:

- AI generation
- prompt changes
- database redesign
- Feishu API integration
- scoring
- ranking
- hire recommendation
- reject recommendation
- autonomous scheduling
- Learning Asset creation

---

## 7. Review Notes

RecruitingContext is designed to be reused by future workflows as the stable input object for AI prompts and recruiter-facing reasoning.

Future prompt builders should receive `RecruitingContext` instead of manually loading source records.
