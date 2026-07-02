# 25_MILESTONE_01_AI_RECRUITER_MVP_V0_1.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Milestone: MILESTONE-01 - AI Recruiter MVP v0.1

---

## 1. Goal

AI Recruiter MVP v0.1 integrates the completed workflows into one usable recruiting workspace.

No new architecture, workflow, epic, scoring rule, ranking logic, Feishu API integration, or Learning Asset creation is introduced.

---

## 2. Included Workflows

- Workflow-01: Job Understanding
- Workflow-02: Candidate Understanding
- Workflow-03: Recruit Together
- Workflow-04: Recruiting Daily Workspace
- Workflow-05: AI Recruiter Workspace
- Workflow-06: Recruitment Task Center

---

## 3. Primary Entry

Default V2 entry:

```text
/feishu
```

The workspace connects the recruiter to:

- `/feishu/job-profile/new`
- `/feishu/candidate-understanding/new`
- `/feishu/recruit-together`
- `/feishu/daily-workspace`
- `/feishu/tasks`

The side navigation remains available for all V2 placeholder modules, but unfinished modules link back to working flows so the recruiter is not trapped on dead-end pages.

---

## 4. End-To-End Flow

The integrated flow is:

```text
Job Understanding
  -> Candidate Understanding
  -> Recruit Together Phone Screen
  -> Recruit Together Interview Preparation
  -> Daily Workspace Review
  -> Recruitment Task Center
  -> Back To AI Recruiter Workspace
```

The recruiter remains in control at every step.

---

## 5. Shared Components

Shared UI components introduced or reused:

- `ActionCard`
- `EvidenceCard`
- `InsightCard`
- `AttentionCard`
- `TimelineCard`
- `AiResponsePanel`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `ToastProvider`

`RecruiterWorkspaceHome` now uses shared cards for insights, attention, evidence, and activity timeline.

`RecruitmentTaskCenter` now uses shared `ActionCard` for task recommendations.

---

## 6. Shared Services

Shared services used by the milestone:

- `RecruitingContextService`
- `NextBestActionService`
- AI service abstraction
- AI provider abstraction
- JSON schema validators
- repository-backed audit for Recruitment Tasks

Workflow-specific services still own their own persistence and validation.

---

## 7. AI Experience

Implemented AI experience patterns:

- loading indicators on generate/reload actions
- safe error messages
- retry or regenerate actions in AI workflows
- editable AI outputs before save
- success toast after save for supported workflows
- manual review before persisted recruiting context is accepted

Streaming is not implemented in this milestone.

---

## 8. Constraints Preserved

The milestone does not implement:

- scoring
- ranking
- hire recommendation
- reject recommendation
- offer recommendation
- autonomous scheduling
- automatic email sending
- automatic pipeline movement
- Learning Asset publication
- Feishu API connection
- V1 route changes

---

## 9. Milestone Review Checklist

- Navigation connects all completed workflows.
- End-to-end path is visible from `/feishu`.
- Placeholder pages link back to active workflows.
- Shared UI components are used by aggregation pages.
- `RecruitingContextService` remains the source of shared recruiting context.
- `NextBestActionService` remains the source of evidence-backed action cards.
- AI outputs remain editable and recruiter-controlled.
- No new architecture was introduced.
- V1 remains unchanged.

---

## 10. Validation

Required validation:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build --progress=plain
docker compose up --build -d
```

Recommended smoke checks:

```text
/feishu
/feishu/job-profile/new
/feishu/candidate-understanding/new
/feishu/recruit-together
/feishu/daily-workspace
/feishu/tasks
/log
```
