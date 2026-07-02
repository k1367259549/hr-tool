# 23_EPIC_01_NEXT_BEST_ACTION_ENGINE.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Epic: EPIC-01 - Next Best Action Engine

---

## 1. Goal

Next Best Action Engine is the core reasoning engine of AI Recruiter.

It determines the recruiter's next recommended action from reviewed recruiting context.

It does not execute actions.

---

## 2. Service

Implemented service:

```text
NextBestActionService
```

Responsibilities:

- identify unfinished work
- identify blockers
- identify missing evidence
- recommend next recruiter action
- generate Action Cards
- explain every recommendation

---

## 3. Inputs

The engine consumes `RecruitingContext` from `RecruitingContextService`.

`RecruitingContextService` aggregates:

- Reviewed Job Profile
- Reviewed Candidate Insight
- Recruit Together Records
- Daily Workspace
- Recruitment Tasks
- Recruiter Notes
- Schedule
- Workflow History

---

## 4. Output

The engine outputs Action Cards.

Action Card fields:

- Title
- Priority
- Reason
- Evidence
- Recommended Next Action
- Related Workflow
- Related Candidate
- Related Job
- Due Time
- Confidence
- Status

Internal fields such as source key, source type, category, and quick start link are used by downstream workflows to persist or navigate actions.

---

## 5. Reuse

Workflow-05 AI Recruiter Workspace uses the engine to summarize Today's Suggestions.

Workflow-06 Recruitment Task Center uses the engine to create persistent recruiter tasks.

FEATURE-001 Recruiting Context Engine owns source data aggregation for these workflows.

No separate prioritization logic should be introduced in those workflows.

---

## 6. Constraints

The engine does not implement:

- scoring
- ranking
- hire recommendation
- reject recommendation
- autonomous execution
- automatic scheduling
- automatic email sending
- pipeline movement
- Learning Asset creation

---

## 7. Human Control

Action Cards are Decision Support.

Recruiters must decide whether to accept, modify, dismiss, reschedule, or complete downstream tasks.

Action Cards never modify Job Profiles, Candidate Insights, Recruit Together records, Daily Workspace records, schedules, or Learning Assets automatically.

---

## 8. Review Notes

Recommendations must be:

- explainable
- evidence-backed
- recruiter-controlled
- reusable by workflows
- free of scoring and ranking logic
