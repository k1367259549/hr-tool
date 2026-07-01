# 20_SPRINT_01_AI_RECRUITER_MVP_FOUNDATION.md

Version: V2.0 Draft  
System: hr-tool V2 / AI Recruiter  
Sprint: Sprint-01 - AI Recruiter MVP Foundation

---

## 1. Sprint Goal

Build the first usable version of AI Recruiter that can assist a recruiter in understanding jobs and candidates during daily recruiting work.

Sprint-01 starts with Workflow-01:

```text
Workflow-01 - Job Understanding Workflow
```

This workflow helps recruiters understand a job before screening candidates.

---

## 2. Workflow-01 Scope

Implemented workflow:

```text
Recruiter creates a recruiting task
  -> Paste JD
  -> Optional Leader Requirements
  -> Optional Team Background
  -> Generate Job Understanding
  -> Recruiter reviews
  -> Save Job Profile
  -> Workflow completed
```

Route:

```text
/feishu/job-profile/new
```

---

## 3. Implemented Capabilities

The page supports:

- Job Title
- JD
- Leader Requirements
- Team Background
- Hiring Goal
- Notes
- Generate button
- Review panel
- Regenerate
- Cancel
- Save reviewed Job Profile

AI output shape:

- Job Summary
- Core Responsibilities
- Required Competencies
- Preferred Competencies
- Potential Risks
- Hiring Focus
- Interview Focus
- Missing Information
- Suggested Follow-up Questions

---

## 4. Architecture Compliance

This workflow follows the V2 architecture:

- V1 routes remain unchanged.
- AI calls use existing AI abstraction.
- API routes call Service Layer.
- Service Layer calls AI abstraction and repository.
- Prompt lives in `/prompts`.
- JSON schema validation is required.
- Human review is mandatory before saving Job Profile.
- Saved Job Profile records AI provider, model, prompt version, generation time, and workflow id.

---

## 5. Explicit Non-Goals

This workflow does not implement:

- scoring
- candidate ranking
- evaluation criteria
- classification
- candidate evaluation
- Feishu API integration
- resume parsing
- pipeline automation
- Learning Asset publication

---

## 6. Future Follow-Up

Recommended next workflow:

```text
Workflow-02 - Resume Intake And Candidate Understanding
```

Before implementing candidate evaluation, the system should reuse the reviewed Job Profile as the role context.

---

## 7. Workflow-02 Scope

Implemented workflow:

```text
Recruiter selects a reviewed Job Profile
  -> Upload Resume
  -> Resume Parsing
  -> Structure-aware Chunking
  -> Semantic Chunking
  -> Generate Candidate Understanding
  -> Recruiter Review
  -> Save Candidate Insight
  -> Workflow completed
```

Route:

```text
/feishu/candidate-understanding/new
```

Workflow-02 is Decision Support only. It helps recruiters understand a candidate in the context of a reviewed Job Profile. It does not evaluate, score, rank, classify, recommend hiring, or recommend rejection.

## 8. Workflow-02 Implemented Capabilities

The page supports:

- Job Profile selector
- Resume upload
- Candidate source
- Notes
- Generate Candidate Insight
- Review panel
- Regenerate
- Reject and cancel
- Edit
- Save reviewed Candidate Insight

Resume processing supports:

- PDF
- DOCX
- TXT
- original file persistence
- parsed resume text
- parsing status
- parser failure handling
- structure-aware chunks
- semantic chunks

AI output shape:

- Summary
- Insights
- Strengths
- Potential Risks
- Missing Information
- Suggested Phone Screen Questions
- Suggested Interview Questions
- Suggested Next Actions
- Evidence

## 9. Workflow-02 Architecture Compliance

This workflow follows the V2 architecture:

- V1 routes remain unchanged.
- AI calls use existing AI abstraction.
- API routes call Service Layer.
- Service Layer coordinates parsing, chunking, AI generation, and persistence.
- Repository Layer owns Prisma access.
- Prompt lives in `/prompts`.
- JSON schema validation is required.
- Invalid AI JSON is rejected and not saved as Candidate Insight.
- Human review is mandatory before saving Candidate Insight.
- Saved Candidate Insight records workflow id, AI provider, model, prompt version, generation time, Job Profile version, and Resume version.

## 10. Workflow-02 Explicit Non-Goals

This workflow does not implement:

- candidate score
- candidate ranking
- hire recommendation
- reject recommendation
- classification
- evaluation template
- scoring standards
- Feishu API integration
- Candidate Library conversion
- Pipeline movement
- Learning Asset publication

---

## 11. Workflow-03 Scope

Implemented workflow:

```text
Reviewed Job Profile
  -> Reviewed Candidate Insight
  -> Generate Phone Screen Preparation
  -> Recruiter Phone Notes
  -> Generate Interview Preparation
  -> Recruiter Interview Notes
  -> Generate Recruiter Summary
  -> Workflow completed
```

Route:

```text
/feishu/recruit-together
```

Workflow-03 makes AI a recruiting copilot during recruiter interactions. It does not automate recruiting or make final recruiting decisions.

## 12. Workflow-03 Implemented Capabilities

The page supports:

- selecting a reviewed Job Profile
- selecting a reviewed Candidate Insight
- generating Phone Screen Preparation
- editing Phone Screen Preparation
- recording Recruiter Phone Notes
- generating Interview Preparation
- editing Interview Preparation
- recording Recruiter Interview Notes
- generating Recruiter Summary
- editing Recruiter Summary
- saving the completed Recruit Together workflow

Phone Screen Preparation output:

- Conversation Goals
- Suggested Opening
- Key Verification Questions
- Risk Verification Questions
- Information To Confirm
- Conversation Checklist
- Things To Avoid

Phone Notes fields:

- Key Facts
- Candidate Motivation
- Salary Expectation
- Availability
- Communication Quality
- Open Questions
- Free Notes

Interview Preparation output:

- Interview Focus
- Suggested Questions
- Evidence To Verify
- Missing Information
- High Priority Topics
- Possible Follow-up Questions

Interview Notes fields:

- Interview Summary
- Strengths
- Weaknesses
- New Evidence
- Concerns
- Overall Impression

Recruiter Summary output:

- Candidate Timeline
- Confirmed Facts
- Unconfirmed Facts
- Recruiter Notes Summary
- Suggested Next Recruiter Actions
- Open Questions

## 13. Workflow-03 Architecture Compliance

This workflow follows the V2 architecture:

- V1 routes remain unchanged.
- AI calls use existing AI abstraction.
- API routes call Service Layer.
- Service Layer coordinates context loading, AI generation, schema validation, and persistence.
- Repository Layer owns Prisma access.
- Prompts live in `/prompts`.
- Structured JSON schema validation is required.
- Invalid AI JSON is rejected.
- All AI outputs are editable before save.
- Human review is represented by manually editable AI outputs plus recruiter phone/interview notes.
- Saved workflow records workflow id, provider, model, prompt versions, generation times, and human review metadata.

## 14. Workflow-03 Explicit Non-Goals

This workflow does not implement:

- hire recommendation
- reject recommendation
- score
- ranking
- classification
- offer recommendation
- automatic pipeline movement
- Feishu API integration
- Learning Asset publication

---

## 15. Workflow-04 Scope

Implemented workflow:

```text
Today's Recruiting Activities
  -> Collect Today's Work
  -> Generate Daily Recruiting Summary
  -> Generate Recruiting Insights
  -> Generate Tomorrow Priorities
  -> Generate Improvement Suggestions
  -> Recruiter Review
  -> Save Daily Workspace
  -> Workflow completed
```

Route:

```text
/feishu/daily-workspace
```

`/feishu` redirects to `/feishu/daily-workspace`, making Daily Workspace the AI Recruiter daily entry point.

Workflow-04 helps recruiters review today's work, prepare tomorrow's priorities, and reflect on recruiting quality. It does not create Learning Assets automatically.

## 16. Workflow-04 Implemented Capabilities

The page supports:

- selecting the workspace date
- auto-collecting today's V2 recruiting activities
- adding manual Recruiter notes
- generating Daily Summary
- generating Recruiting Insights
- generating Tomorrow Priorities
- generating Improvement Suggestions
- editing all AI outputs
- regenerating outputs
- saving the reviewed Daily Workspace

Collected activity types:

- Reviewed Job Profiles
- Candidate Insights
- Phone Screen records from Recruit Together
- Interview notes from Recruit Together
- Recruiter notes
- Workflow history

Daily Summary output:

- Today's Work Summary
- Jobs Worked On
- Candidates Processed
- Phone Screens Completed
- Interviews Completed
- Key Achievements
- Pending Work

Recruiting Insights output:

- Today's Recruiting Insights
- Repeated Candidate Risks
- Repeated Missing Information
- Job Understanding Improvements
- Candidate Understanding Improvements
- Recruiting Observations
- Evidence Coverage
- Attention Points

Tomorrow Priorities output:

- High Priority Tasks
- Candidates To Contact
- Candidates Waiting Follow-up
- Missing Information To Verify
- Interviews To Prepare
- Recruiter Suggestions

Improvement Suggestions output:

- AI Suggestions
- Prompt Improvement Ideas
- Workflow Improvement Ideas
- Recruiter Efficiency Suggestions
- Potential Product Improvement Notes

Every AI output also includes:

- Summary
- Insights
- Evidence
- Attention
- Suggested Actions
- Confidence
- Audit

## 17. Workflow-04 Architecture Compliance

This workflow follows the V2 architecture:

- V1 routes remain unchanged.
- AI calls use existing AI abstraction.
- API routes call Service Layer.
- Service Layer collects source activity through repositories.
- Repository Layer owns Prisma access.
- Prompts live in `/prompts`.
- Structured JSON schema validation is required.
- Invalid AI JSON is rejected.
- All AI outputs are editable before save.
- Saved workspace records workflow id, provider, model, prompt versions, generation times, and human review metadata.
- `learningAssetsCreated` is explicitly false.

## 18. Workflow-04 Explicit Non-Goals

This workflow does not implement:

- Learning Asset creation
- automatic organizational learning
- Job Profile modification
- Candidate Insight modification
- prompt modification
- workflow modification
- scores
- rankings
- hire recommendation
- reject recommendation
- offer recommendation
- automatic pipeline movement
