# 21_SPRINT_02_AI_RECRUITER_WORKSPACE.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Sprint: Sprint-02 - AI Recruiter Workspace

---

## 1. Workflow-05 Scope

Implemented workflow:

```text
Recruiter opens AI Recruiter Workspace
  -> Review today's jobs
  -> Review candidate action groups
  -> Review evidence-backed AI suggestions
  -> Adjust today's schedule
  -> Add recruiter notes
  -> Open the next workflow with one click
  -> Generate Daily Workspace at end of day
```

Route:

```text
/feishu
```

Workflow-05 is the daily home workspace for AI Recruiter. It organizes the recruiter's working day around actions, not charts or ATS administration.

---

## 2. Implemented Capabilities

The homepage supports:

- greeting, current date, recruiter name, and recruiting overview
- Today's Jobs
- Today's Candidates grouped by action
- AI Today's Suggestions
- Today's Schedule with manual adjustment
- Quick Actions
- Recent Activity timeline
- Recruiter Notes
- End-of-Day shortcut to Workflow-04
- future placeholders for Talent Map, Learning Assets, and Recruitment Analytics

Quick Actions link to:

- `/feishu/job-profile/new`
- `/feishu/candidate-understanding/new`
- `/feishu/recruit-together`
- `/feishu/daily-workspace`
- `/feishu/resumes`

---

## 3. Architecture Compliance

This workflow follows the V2 architecture:

- V1 routes remain unchanged.
- `/feishu` is an orchestration homepage.
- UI calls `/api/recruiter-workspace`.
- API routes call the Service Layer.
- Service Layer aggregates existing Workflow outputs.
- Repository Layer owns Prisma access.
- Recruiter Notes and Schedule are stored in V2-specific tables.
- AI Today's Suggestions are generated from reusable Next Best Action Cards.
- No frontend AI calls are introduced.

---

## 4. Reused Workflow Outputs

Workflow-05 reuses:

- Workflow-01 Job Profile
- Workflow-02 Candidate Insight
- Workflow-03 Recruit Together records
- Workflow-04 Daily Workspace records

It does not duplicate Job Understanding, Candidate Understanding, Recruit Together, or Daily Workspace generation logic.

---

## 5. Explicit Non-Goals

Workflow-05 does not implement:

- ATS redesign
- Candidate CRUD
- scoring
- ranking
- hiring recommendation
- rejection recommendation
- offer recommendation
- automatic pipeline movement
- Feishu API integration
- Talent Map generation
- Learning Asset creation
- autonomous organizational learning

---

## 6. Review Notes

The homepage answers:

```text
Who?
What?
When?
Why?
```

All suggested actions remain recruiter-controlled. Notes are stored for later retrieval and search support, but they do not become Learning Assets automatically.
