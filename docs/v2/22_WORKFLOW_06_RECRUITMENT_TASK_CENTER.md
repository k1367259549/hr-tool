# 22_WORKFLOW_06_RECRUITMENT_TASK_CENTER.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Workflow: Workflow-06 - Recruitment Task Center

---

## 1. Goal

Recruitment Task Center is the AI Recruiter's action orchestration center.

It answers:

```text
What should I do next?
Why?
What evidence supports it?
What is the recommended next action?
```

It manages recruiter actions, not ATS records.

---

## 2. Implemented Route

```text
/feishu/tasks
```

API:

```text
GET /api/recruitment-tasks
PATCH /api/recruitment-tasks
GET /api/recruitment-tasks/:id/audit
```

---

## 3. Task Sources

Tasks are generated from reviewed or recruiter-controlled V2 outputs:

- Job Understanding / Job Profile
- Candidate Understanding / Candidate Insight
- Recruit Together
- Daily Workspace
- Recruiter Notes

Source records are not modified when tasks are generated.

---

## 4. Task Categories

Supported categories:

- Phone Screen
- Interview Preparation
- Leader Confirmation
- Follow-up
- Missing Information
- Candidate Review
- Job Clarification
- Recruiter Reminder

---

## 5. Task Fields

Each task contains:

- Title
- Priority
- Priority Reason
- Reason
- Evidence
- Related Workflow
- Related Candidate
- Related Job
- Due Time
- Recommended Next Action
- Status
- Quick Start link

Priorities are:

- High
- Medium
- Low

Priority is explainable and evidence-backed. No score is created.

---

## 6. Human Control

Recruiter actions:

- Accept
- Modify
- Dismiss
- Reschedule
- Complete
- Start
- Defer

Nothing executes automatically. A task action only updates the task record and audit trail.

---

## 7. Audit

Task audit records:

- task creation
- priority change
- status change
- completion
- manual override
- before value
- after value
- actor
- timestamp

Audit does not expose secrets and does not modify source Workflow records.

---

## 8. Explicit Non-Goals

Workflow-06 does not implement:

- auto scheduling interviews
- auto rejecting candidates
- auto sending emails
- auto creating offers
- auto moving pipeline
- ATS redesign
- scoring
- ranking
- hiring recommendation
- rejection recommendation
- Learning Asset creation

---

## 9. Architecture Compliance

The implementation follows existing architecture:

- UI calls API routes.
- API routes call Service Layer.
- Service Layer orchestrates task generation and action handling.
- Task generation reuses `NextBestActionService`.
- Repository Layer owns Prisma access.
- Previous Workflow logic is reused as source data.
- V1 routes remain unchanged.
