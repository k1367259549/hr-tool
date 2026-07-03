# 15_V2_IMPLEMENTATION_PLAN.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-008 - V2 Implementation Plan

---

## 1. Purpose

This document turns the approved hr-tool V2 architecture into executable implementation phases.

It is a planning and documentation task only. It does not implement code, modify database schema, create APIs, connect Feishu, define prompts, define scoring standards, or modify V1 behavior.

This plan is based on:

- `ARCHITECTURE_PRINCIPLES.md`
- `docs/v2/04_RECRUITMENT_DOMAIN_MODEL.md`
- `docs/v2/05_RECRUITMENT_WORKFLOW.md`
- `docs/v2/06_RESUME_CANDIDATE_DATA_MODEL.md`
- `docs/v2/07_AI_RECRUITMENT_INTELLIGENCE.md`
- `docs/v2/08_AI_MODULES.md`
- `docs/v2/09_AI_DATA_FLOW.md`
- `docs/v2/10_AI_EVOLUTION_ROADMAP.md`
- `docs/v2/11_RECRUITMENT_INTELLIGENCE_LEARNING.md`
- `docs/v2/12_DECISION_SUPPORT_AND_LEARNING_ASSETS.md`
- `docs/v2/13_RECRUITMENT_MODELS.md`
- `docs/v2/14_FEEDBACK_AND_LEARNING_LOOP.md`
- existing V1 documentation and current codebase structure

---

## 2. Current System Assessment

### 2.1 Frontend Structure

The current application uses Next.js App Router with a layered V1 application shell.

Current major routes include:

```text
/
/dashboard
/log
/upload
/review
/planner
/knowledge
/search
/settings
/feishu
/feishu/candidates
/feishu/resumes
/feishu/pipeline
/feishu/interviews
/feishu/offers
/feishu/report
/feishu/chat-summary
/feishu/settings
```

Reusable frontend structure:

```text
src/app
src/components/layout
src/components/shared
src/features
src/modules
```

V1 feature UI lives under `src/features`. V2 Feishu skeleton pages already use `src/app/feishu` and `src/modules/feishu`.

Current V2 includes the AI Recruiter MVP workspace, Candidate CRM Foundation, Recruiting Pipeline Foundation, Resume Library Foundation, Evaluation Template Foundation, and Resume Evaluation Result Foundation. Candidate CRM now connects through API routes, services, repositories, Prisma, and PostgreSQL. Deferred modules such as Interview, Offer, Report, Chat Summary, and Feishu Settings remain placeholders and do not connect to Feishu APIs.

Candidate CRM now also includes recruiter-confirmed manual Candidate-Resume linking. Candidate and Resume remain separate domain objects; linking and unlinking are explicit recruiter actions, transaction-safe, audited, and do not expose resume binaries or parsed full resume text through list/link APIs.

Recruiting Pipeline Foundation now adds CandidateApplication and ApplicationEvent as the role-specific Pipeline owner. Candidate does not store a global current stage. Stage movement is manual, transaction-safe, audited, and protected by a PostgreSQL partial unique index that allows only one active Candidate + JobProfile application at a time.

Resume Library Foundation now keeps the historical `CandidateResume` table name while upgrading its business meaning to an independent Resume Library record. Resume records can exist without Candidate or Job Profile, store `intakeSource` and `contentHash`, support non-AI parsing, and expose `/feishu/resumes`, `/feishu/resumes/new`, and `/feishu/resumes/[id]`.

Evaluation Template Foundation now adds configurable, versioned recruiting standards through `EvaluationTemplate`, `EvaluationTemplateVersion`, and `JobProfileEvaluationAssignment`. Templates support Draft and Published versions, reviewed Job Profile assignment, immutable Published history, and structured criteria without scores, weights, thresholds, rankings, automatic rejection, or hiring recommendations.

### 2.2 Backend And API Structure

The current backend uses Next.js Route Handlers under:

```text
src/app/api
```

Existing API groups include:

- log
- dashboard
- review
- planner
- knowledge
- search
- settings
- prompts
- upload spreadsheet
- export
- health
- version
- resume evaluation

The project already follows the standard response format through shared response utilities.

### 2.3 Service Layer

Business orchestration lives under:

```text
src/services
```

Current services include log, dashboard, review, planner, knowledge, search, settings, prompt, export, spreadsheet, AI-backed review workflows, and audit.

V2 implementation should continue this rule:

```text
UI -> API Route -> Service Layer -> Repository Layer -> Prisma -> PostgreSQL
```

API routes must validate inputs and call services. They must not contain business logic or call Prisma directly.

### 2.4 Repository And Data Layer

Current repository files live under:

```text
src/repositories
```

Existing repositories include RecruitLog, DailyReview, DailyPlan, Knowledge, Search, Spreadsheet, SpreadsheetAnalysis, and AIRequestLog.

Prisma schema currently supports V1 and spreadsheet analysis:

- RecruitLog
- DailyReview
- DailyPlan
- Knowledge
- AIRequestLog
- UploadedSpreadsheet
- SpreadsheetAnalysis

V2 recruitment domain tables now include Job Profile, Candidate Resume, Candidate Insight, Recruit Together workflow records, Daily Recruiting Workspace records, Recruitment Tasks, Candidate CRM Foundation records, Recruiting Pipeline Foundation records, Evaluation Template Foundation records, and Resume Evaluation Result Foundation records.

Candidate CRM Foundation adds:

- `CandidateStatus`
- `CandidateAuditAction`
- `Candidate`
- `CandidateAudit`
- nullable `CandidateResume.candidateId`
- manual link audit actions `RESUME_LINKED` and `RESUME_UNLINKED`

Candidate records remain separate from Resume records. CandidateStatus is not a Pipeline stage.

Recruiting Pipeline Foundation adds:

- `ApplicationStage`
- `ApplicationEventType`
- `CandidateApplication`
- `ApplicationEvent`
- a PostgreSQL partial unique index for active Candidate + JobProfile applications

Pipeline stage belongs to CandidateApplication, not Candidate.

Resume Library Foundation adds:

- `ResumeIntakeSource`
- nullable `CandidateResume.jobProfileId`
- optional `CandidateResume.contentHash`
- indexes for content hash, parsing status, file type, and intake source

`CandidateResume` is retained as a compatibility model name. It now represents a Resume Library record and does not require Candidate or Job Profile ownership.

Evaluation Template Foundation adds:

- `EvaluationTemplateStatus`
- `EvaluationTemplateVersionStatus`
- `EvaluationTemplate`
- `EvaluationTemplateVersion`
- `JobProfileEvaluationAssignment`
- one Draft per Template enforced by a PostgreSQL partial unique index
- one active assignment per Job Profile enforced by a PostgreSQL partial unique index

Evaluation Template content is stored in versions and assigned to reviewed Job Profiles. It is not written into JobProfile, CandidateResume, Candidate, CandidateApplication, or CandidateInsight.

### 2.5 AI Provider Abstraction

The current AI layer lives under:

```text
src/ai
src/config
```

Reusable AI capabilities already exist:

- provider abstraction
- OpenAI provider
- OpenAI-compatible relay provider
- provider factory
- AI config
- environment config
- prompt loader
- JSON parser
- schema validation files
- AI request audit logging

The current AI provider supports:

```text
AI_PROVIDER=openai
AI_PROVIDER=openai-compatible
```

V2 must reuse this provider abstraction. Business services must not import provider SDKs directly.

### 2.6 Prompt Structure

All prompts live under:

```text
prompts
```

Existing prompt files include:

- `review.md`
- `planner.md`
- `knowledge.md`
- `weekly-review.md`
- `monthly-review.md`
- `resume-evaluation.md`
- `spreadsheet-analysis.md`

V2 prompt files should be added only when the corresponding AI implementation phase begins. TASK-008 does not create prompts.

### 2.7 Docker And CI

The project has Docker support:

- root `.dockerignore`
- `docker/Dockerfile`
- `docker-compose.yml`
- PostgreSQL service
- app service
- healthchecks
- `.env` loading for app service

CI exists under:

```text
.github/workflows/ci.yml
.github/workflows/release.yml
```

Validation commands already include:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```

Future V2 tasks must keep Docker and CI green.

---

## 3. V2 Implementation Principles

### 3.1 V1 Must Remain Stable

V2 is an expansion layer. It must not break:

```text
/log
/review
/planner
/knowledge
/settings
```

V1 services, repositories, APIs, prompts, and database records remain stable unless a task explicitly approves a safe compatibility change.

### 3.2 No Hardcoded Scoring Standards

V2 may include score placeholders and classification placeholders, but it must not define:

- scoring standards
- score thresholds
- classification thresholds
- pass/fail rules
- automatic hiring decision logic

### 3.3 AI Outputs Are Decision Support Or Learning Assets

Every AI output must belong to one category:

```text
Decision Support
  -> helps recruiters complete current recruiting decisions

Learning Assets
  -> reviewed reusable organizational recruiting intelligence
```

Decision Support must not become organizational memory automatically.

### 3.4 Human Review Is Mandatory

Recruiters must review AI-generated:

- parsed resume uncertainty
- evaluation outputs
- risk detection
- candidate conversion suggestions
- phone screen questions
- interview questions
- Talent Map summaries
- Representative Models
- Learning Asset drafts

### 3.5 Model-Independent AI Layer

V2 must support model replacement without changing business logic.

Business services call AI modules through stable interfaces. Provider-specific SDK logic stays inside provider adapters.

### 3.6 Configuration Over Hardcoding

The following should be configurable or versioned:

- AI provider
- model name
- prompt file and prompt version
- Evaluation Template
- template version
- pipeline stages in future
- Learning Asset lifecycle states in future

### 3.7 Architecture Before Features

V2 implementation should proceed from foundation to domain model to workflow to AI. Do not implement AI workflows before the domain records, review states, and audit paths can support them.

---

## 4. Recommended Implementation Phases

### Phase 1 - V2 Foundation

Goal:

- Establish the V2 workspace shell and route boundaries without business logic.

Deliverables:

- V2 route group under `/feishu`
- V2 layout and navigation
- placeholder pages for all approved workspace modules
- module index files under `src/modules`
- README and CHANGELOG updates

Dependencies:

- existing Next.js app shell
- shared UI components

Affected files/directories:

```text
src/app/feishu
src/modules
src/components/layout
README.md
CHANGELOG.md
docs/V2_FEISHU_PRODUCT_SPEC.md
```

Risks:

- accidentally mixing V2 navigation with V1 behavior
- adding placeholder UI that implies real Feishu connectivity

Acceptance criteria:

- all V2 routes load
- V1 routes still load
- no database access from V2 pages
- no AI calls from V2 pages
- no Feishu API calls
- build, lint, typecheck, test, and Docker checks pass

### Phase 2 - Job Profile

Goal:

- Implement the first V2 domain anchor for hiring context.

Deliverables:

- Job Profile conceptual schema task
- Prisma migration after schema approval
- repository, service, API, types, validation
- Job Profile list and detail/create/edit UI
- no scoring criteria

Dependencies:

- Phase 1
- approved V2 schema design task

Affected files/directories:

```text
prisma/schema.prisma
src/modules/job-profile
src/app/api/v2/job-profiles
src/app/feishu/job-profiles or src/app/feishu/settings-approved route decision
src/services
src/repositories
src/types
src/utils
```

Risks:

- embedding scoring logic into Job Profile
- duplicating V1 log position fields instead of designing a V2 hiring context

Acceptance criteria:

- Job Profiles can be created, listed, viewed, updated, and archived
- APIs use service layer
- repository owns Prisma access
- no scoring standards introduced
- V1 unaffected

### Phase 3 - Evaluation Template

Goal:

- Add reusable, versionable, empty-by-default evaluation framework.

Deliverables:

- delivered Evaluation Template, Template Version, and Job Profile Assignment implementation
- delivered ACTIVE/ARCHIVED Template lifecycle and DRAFT/PUBLISHED Version lifecycle
- delivered repository, service, API, validation, and UI
- delivered reviewed Job Profile assignment and assignment history
- delivered partial unique indexes for one Draft per Template and one active assignment per Job Profile
- deferred Resume Evaluation Result and AI evaluation to later milestones

Resume Evaluation Result Foundation adds:

- `ResumeEvaluationStatus`
- `ResumeEvaluationEventType`
- `ResumeEvaluationResult`
- `ResumeEvaluationEvent`
- composite unique context key `(resumeId, jobProfileId, templateVersionId, jobProfileVersion)`
- optimistic concurrency via `revision` field
- DRAFT/REVIEWED lifecycle with event history

Dependencies:

- Phase 2

Affected files/directories:

```text
src/features/evaluation-template
src/app/feishu/evaluation-templates
src/app/api/evaluation-templates
src/app/api/evaluation-template-versions
src/app/api/job-profiles/[id]/evaluation-template-assignment
src/services
src/repositories
src/types
prisma/schema.prisma
```

Risks:

- defining criteria or thresholds too early
- treating template content as fixed business rules

Acceptance criteria:

- templates are configurable, reusable, and versionable
- templates can remain empty
- historical version references are possible
- no scoring criteria or thresholds exist
- Published versions are immutable
- assignment only targets reviewed Job Profiles and Published Versions

### Phase 4 - Resume Library

Goal:

- Implement resume intake as a library separate from Candidate.

Delivered foundation:

- CandidateResume compatibility model upgraded to independent Resume Library semantics
- nullable `jobProfileId`
- `ResumeIntakeSource`
- `contentHash` duplicate signal
- original resume metadata and PostgreSQL BYTEA storage
- non-AI parsing for TXT, PDF, and DOCX
- parsing status and safe parsing errors
- source metadata and notes
- Resume Library list, upload, and detail UI
- Resume Library APIs with search, filters, pagination, metadata update, and safe DTO boundaries

Remaining future deliverables:

- Resume x Job Profile evaluation result
- existing Resume selection for AI evaluation
- object storage migration after policy approval

Dependencies:

- Phase 1
- approved V2 schema design

Affected files/directories:

```text
src/modules/resume-library
src/app/feishu/resumes
src/app/api/v2/resumes
src/services
src/repositories
src/types
src/utils
prisma/schema.prisma
```

Risks:

- automatically creating Candidate records too early
- storing sensitive raw resume data in unsafe logs
- overbuilding file storage before requirements are approved

Foundation acceptance criteria:

- resumes can remain in Resume Library without Candidate conversion
- original metadata and status are preserved
- duplicate signals are reviewable and do not block upload
- Resume Library upload does not call AI
- no Feishu integration required
- no download, delete, automatic Candidate creation, automatic Candidate linking, scoring, ranking, or matching

### Phase 5 - Candidate Library

Goal:

- Implement person-level candidate records separately from resumes.

Delivered foundation:

- Candidate model
- Candidate audit model
- nullable CandidateResume link
- Candidate Library list, create, detail, edit, archive, and restore UI
- Candidate API with search, filters, pagination, soft archive, restore, and standard errors
- audit timeline
- contact masking on list page
- no automatic resume-to-candidate conversion
- no automatic resume linking

Remaining future deliverables:

- link Resume to Candidate with recruiter confirmation
- target Job Profile references
- candidate pipeline status placeholder per Job Profile

Dependencies:

- Phase 2
- Phase 4

Affected files/directories:

```text
src/app/feishu/candidates
src/app/api/candidates
src/features/candidate-crm
src/services
src/repositories
src/types
prisma/schema.prisma
```

Risks:

- merging Resume and Candidate into one object
- creating universal candidate status instead of role-contextual status
- automatic duplicate merge

Foundation acceptance criteria:

- Candidate and Resume remain separate
- Candidate can link multiple Resumes
- Candidate can exist without Resume
- CandidateResume can exist without Candidate
- conversion and linking require explicit recruiter action and are not automated
- manual Candidate-Resume linking uses recruiter confirmation, transaction-safe audit, and safe metadata DTOs only
- V1 Candidate-free workflows remain unaffected

### Phase 6 - Evaluation Result

Goal:

- Add the audit-friendly result object that connects Job Profile, Evaluation Template version, and evaluated object.

Deliverables:

- Evaluation Result model implementation
- evaluated object reference strategy
- AI metadata placeholders
- review metadata
- feedback placeholders
- UI for reviewing and correcting an Evaluation Result

Dependencies:

- Phase 2
- Phase 3
- Phase 4 or Phase 5

Affected files/directories:

```text
src/modules/evaluation-result
src/app/api/v2/evaluation-results
src/services
src/repositories
src/types
prisma/schema.prisma
```

Risks:

- treating AI output as final truth
- losing template version context
- storing score values without explaining that no standard exists

Acceptance criteria:

- Evaluation Result references Job Profile and Evaluation Template version
- reviewed/corrected/overridden states are supported
- original AI output can remain separate from reviewed output in future
- no final hiring decision automation exists

### Phase 7 - AI Resume Parsing

Goal:

- Convert resume content into parsed structure and chunks through backend-only AI modules.

Deliverables:

- Resume Parser module
- prompt file and schema for resume parsing
- parser service orchestration
- structure-aware chunks
- semantic chunk placeholders
- parsing confidence and warnings
- parse failure handling

Dependencies:

- Phase 4
- existing AI provider abstraction
- Evaluation Result audit conventions where useful

Affected files/directories:

```text
src/modules/ai-intelligence
src/modules/resume-library
src/ai/schemas
src/services
src/app/api/v2/resumes/*/parse
prompts
```

Risks:

- sending excessive raw personal data to logs
- trusting invalid JSON
- frontend AI calls
- creating vector/RAG infrastructure prematurely

Acceptance criteria:

- AI calls happen only in backend services
- prompt lives in `/prompts`
- output is JSON and schema validated
- parse failures are controlled
- raw resume text is not logged

### Phase 8 - AI Evaluation

Goal:

- Generate contextual Decision Support Evaluation Results for resumes or candidates.

Deliverables:

- Evaluation Engine module
- evaluation prompt and schema
- input builder using Job Profile, Template Version, Parsed Resume, and chunks
- AI metadata and audit logging
- recruiter review UI

Dependencies:

- Phase 2
- Phase 3
- Phase 6
- Phase 7

Affected files/directories:

```text
src/modules/ai-intelligence
src/modules/evaluation-result
src/app/api/v2/evaluations/generate
src/ai/schemas
src/services
prompts
```

Risks:

- hardcoding score standards in prompt or service
- treating classification placeholder as a threshold
- overconfident AI output

Acceptance criteria:

- output includes summary, strengths, weaknesses, risks, missing evidence, questions, placeholders, and explainability fields
- recruiter review is required before workflow use
- invalid AI JSON is rejected
- no autonomous candidate rejection

### Phase 9 - Phone Screen And Interview Questions

Goal:

- Support recruiter-editable question generation and early interview workflow records.

Deliverables:

- Phone Screen module
- Interview module
- question generation service
- question suggestions tied to evidence gaps
- phone screen and interview records
- feedback summary placeholders

Dependencies:

- Phase 5
- Phase 6
- Phase 8

Affected files/directories:

```text
src/modules/phone-screen
src/modules/interview
src/modules/ai-intelligence
src/app/feishu/interviews
src/app/api/v2/phone-screens
src/app/api/v2/interviews
```

Risks:

- generated questions touching sensitive or protected-class topics
- AI inventing phone screen or interview feedback
- question suggestions being treated as mandatory scripts

Acceptance criteria:

- generated questions are editable
- each question explains purpose and evidence gap
- AI does not invent answers or feedback
- records remain reviewable and auditable

### Phase 10 - Pipeline And Offer

Goal:

- Track recruiting stage movement and offer workflow without autonomous decisions.

Deliverables:

- Pipeline module
- configurable stage foundation
- stage history
- Offer module
- offer status tracking
- next action suggestions as Decision Support only

Dependencies:

- Phase 2
- Phase 5
- Phase 9

Affected files/directories:

```text
src/modules/pipeline
src/modules/offer
src/app/feishu/pipeline
src/app/feishu/offers
src/app/api/v2/pipeline
src/app/api/v2/offers
```

Risks:

- automatically moving candidates based on AI output
- encoding fixed pipeline stages as universal truth
- implementing offer approval rules without requirements

Acceptance criteria:

- stage movement is recruiter-controlled
- stage history is auditable
- Offer decisions remain human decisions
- no autonomous offer approval or rejection

Current Pipeline Foundation delivered:

- CandidateApplication links Candidate and reviewed JobProfile
- one active Candidate + JobProfile application enforced by partial unique index
- manual stage transition API and UI
- ApplicationEvent stage history
- no Interview records, Offer entity, drag-and-drop board, scoring, ranking, hire recommendation, reject recommendation, or Feishu sync

### Phase 11 - Talent Map

Goal:

- Build role-centered talent landscape views from reviewed candidate, resume, evaluation, and pipeline data.

Deliverables:

- Talent Map module
- segment draft and review workflow
- data completeness warnings
- Talent Map Generator as optional AI Decision Support
- source-linked summaries

Dependencies:

- Phase 2
- Phase 5
- Phase 6
- Phase 10

Affected files/directories:

```text
src/modules/talent-map
src/modules/ai-intelligence
src/app/api/v2/talent-maps
src/services
src/repositories
```

Risks:

- hidden candidate ranking
- weak data coverage being presented as market truth
- Talent Map summaries becoming unreviewed Learning Assets

Acceptance criteria:

- Talent Map output is evidence-backed
- missing data is explicit
- recruiter reviews segments
- no ranking thresholds exist

### Phase 12 - Representative Models And Recruitment Analytics

Goal:

- Convert reviewed operational patterns into versioned Learning Assets and recruitment intelligence.

Deliverables:

- Representative Model module
- Recruitment Model Library foundation
- Recruitment Analytics module
- review and activation lifecycle
- source references
- versioning
- archive policy

Dependencies:

- Phase 6
- Phase 10
- Phase 11
- review feedback foundation

Affected files/directories:

```text
src/modules/representative-models
src/modules/recruitment-analytics
src/modules/review-feedback
src/modules/ai-intelligence
src/app/feishu/report
```

Risks:

- Learning Assets bypassing human approval
- representative models becoming hidden scoring rules
- analytics overclaiming from incomplete data

Acceptance criteria:

- every Learning Asset has lifecycle, version, owner, reviewer, and source references
- Decision Support conversion requires human approval
- historical records are not overwritten
- no score thresholds or classification thresholds exist

### Phase 13 - Feishu Integration

Goal:

- Add Feishu as an external provider boundary after V2 domain workflows are stable.

Deliverables:

- Feishu provider module
- credential status display
- token lifecycle design and implementation after approval
- sync logs
- selected Feishu source ingestion
- webhook handling only if separately approved

Dependencies:

- stable V2 domain objects
- security review
- integration requirements

Affected files/directories:

```text
src/modules/feishu-provider
src/integrations/feishu or approved provider directory
src/app/feishu/settings
src/app/api/v2/feishu
src/config
```

Risks:

- exposing Feishu secrets
- letting UI call Feishu directly
- syncing external data into wrong domain objects
- introducing integration complexity before internal workflow stability

Acceptance criteria:

- Feishu secrets are backend-only
- UI displays safe status only
- provider normalizes Feishu errors
- sync never bypasses service layer
- V1 remains unaffected

---

## 5. Module Boundary Design

### 5.1 `job-profile`

Owns hiring context.

Responsibilities:

- Job Profile CRUD
- role context validation
- archive and status lifecycle
- future Job Profile AI draft review

Does not own:

- scoring rules
- evaluation output
- pipeline movement

### 5.2 `evaluation-template`

Owns reusable evaluation framework and versions.

Responsibilities:

- template drafts
- template versions
- activation/archive lifecycle
- output schema reference

Does not own:

- score standards
- candidate decisions

### 5.3 `resume-library`

Owns resume artifacts before person-level curation.

Responsibilities:

- original resume metadata
- parsed resume versions
- chunk references
- parsing status
- duplicate signals

Does not own:

- Candidate identity as final truth
- automatic candidate conversion

### 5.4 `candidate-library`

Owns person-level recruiting records.

Responsibilities:

- Candidate profile
- linked Resumes
- tags, notes, owner
- target Job Profiles
- long-term talent pool usage

Does not own:

- original resume storage as the only source of truth
- Evaluation Template logic

### 5.5 `evaluation-result`

Owns evaluation event records and review lifecycle.

Responsibilities:

- evaluated object reference
- Job Profile reference
- Evaluation Template version reference
- AI output envelope
- recruiter review metadata
- correction and override states

Does not own:

- final hiring decision automation
- scoring standards

### 5.6 `pipeline`

Owns candidate movement through recruiting stages per Job Profile.

Responsibilities:

- pipeline stage records
- stage history
- next action state
- stage-level visibility

Does not own:

- interview feedback content
- offer approval rules
- automatic AI stage movement

### 5.7 `phone-screen`

Owns early qualification records.

Responsibilities:

- phone screen notes
- availability and communication summaries
- next step notes
- related Evaluation Result

Does not own:

- final candidate evaluation
- interview records

### 5.8 `interview`

Owns formal interview records.

Responsibilities:

- interview round
- interviewer feedback
- scheduled context
- feedback summaries
- related Evaluation Result

Does not own:

- offer decisions
- automatic feedback generation as truth

### 5.9 `offer`

Owns offer workflow records.

Responsibilities:

- offer status
- offer notes
- sent/accepted/declined timeline
- onboarding handoff status

Does not own:

- compensation policy
- autonomous offer decisions

### 5.10 `talent-map`

Owns role or segment-level talent landscape views.

Responsibilities:

- candidate grouping
- segment review
- data completeness warnings
- source-linked observations

Does not own:

- candidate ranking thresholds
- automatic rejection logic

### 5.11 `representative-models`

Owns versioned Recruitment Model Library assets.

Responsibilities:

- Candidate Models
- Job Profile Models
- Channel Models
- Interview Models
- Pipeline Models
- Strategy Models
- Talent Market Models

Does not own:

- raw operational records
- unreviewed AI output
- hidden scoring standards

### 5.12 `ai-intelligence`

Owns provider-independent AI module orchestration.

Responsibilities:

- Job Profile Generator
- Resume Parser
- Resume Analyzer
- Evaluation Engine
- Question Generator
- Candidate Summarizer
- Talent Map Generator
- Representative Candidate Generator
- Recruitment Analytics
- Knowledge Generator

Does not own:

- business decisions
- Prisma access
- UI rendering
- provider SDK logic outside adapters

### 5.13 `review-feedback`

Owns recruiter feedback and learning loop records.

Responsibilities:

- AI accepted / modified / rejected / incorrect feedback
- correction reasons
- quality notes
- Learning Asset conversion candidates
- audit trail

Does not own:

- direct prompt mutation
- automatic Learning Asset activation

### 5.14 `feishu-provider`

Owns Feishu external integration boundary.

Responsibilities:

- safe credential status
- token handling
- API client wrapper
- error normalization
- sync orchestration support

Does not own:

- V2 domain decisions
- direct UI calls
- AI logic

---

## 6. First Implementation Milestone

### Milestone 1 - V2 Foundation And Navigation

This is the recommended first real coding milestone after TASK-008.

Scope:

- V2 route group
- V2 layout
- Feishu Recruiting Workspace shell
- left-side V2 navigation
- placeholder pages
- module entry cards
- README update
- CHANGELOG update

Routes:

```text
/feishu
/feishu/candidates
/feishu/resumes
/feishu/pipeline
/feishu/interviews
/feishu/offers
/feishu/report
/feishu/chat-summary
/feishu/settings
```

Out of scope:

- database
- AI
- Feishu API
- Candidate CRUD
- Resume parsing
- Pipeline behavior
- authentication
- V1 rewrites

Acceptance criteria:

- all new routes are accessible
- V2 navigation works
- pages clearly say they are placeholders
- V1 routes remain unaffected
- no new database schema
- no API calls from V2 pages
- no Feishu calls
- no frontend AI calls
- Docker, build, lint, typecheck, and test checks pass

Current codebase note:

- A V2 skeleton already exists in the current working tree. The next coding task should verify, refine, and commit this foundation if it has not already been formally accepted.

---

## 7. Backlog

### P0

- TASK-009 - V2 Foundation And Navigation formal acceptance
- V2 schema design task for Job Profile, Evaluation Template, Resume, Candidate, Evaluation Result, Pipeline, Phone Screen, Interview, Offer
- Job Profile CRUD
- Evaluation Template version foundation
- Resume Library without AI parsing
- Candidate Library explicit resume linking without automation
- Evaluation Result review lifecycle

### P1

- Resume parsing backend AI workflow
- Parsed Resume and Resume Chunk review UI
- AI Evaluation Engine
- recruiter review and correction UI
- Resume Library to Candidate Library conversion workflow
- Phone Screen records
- Interview records
- question generation as Decision Support
- Pipeline stage history

### P2

- Offer tracking
- Talent Map foundation
- Candidate summaries
- Recruitment Analytics reports
- Knowledge Generator for reviewed V2 outputs
- review feedback quality notes
- Representative Model drafts

### Later

- Feishu provider integration
- Feishu sync
- Feishu webhooks
- advanced analytics
- model comparison
- prompt regression tests
- provider fallback routing
- vector database or retrieval system if separately approved
- multi-user permissions
- governance and policy layer

---

## 8. Explicit Non-Goals

Do not implement yet:

- scoring standards
- classification thresholds
- autonomous candidate rejection
- autonomous offer decisions
- Feishu sync
- vector database
- memory server
- advanced analytics
- multi-user permission system unless separately approved
- autonomous stage movement
- automatic Learning Asset activation
- prompt editor
- Feishu OAuth or webhooks
- external file storage service
- RAG
- embeddings
- production ATS replacement workflow

---

## 9. Architecture Principle Check

### Phase 1 - V2 Foundation

Follows the architecture principle by preserving V1 and introducing no AI output. It creates UI boundaries only.

### Phase 2 - Job Profile

Supports future Decision Support by creating hiring context, but does not define scoring standards. Job Profile changes remain human-controlled.

### Phase 3 - Evaluation Template

Keeps evaluation configurable and versionable. Templates are empty by default and do not encode hidden thresholds.

### Phase 4 - Resume Library

Creates operational data for future Decision Support. It keeps raw resume processing separate from Candidate identity and avoids automatic conversion.

### Phase 5 - Candidate Library

Creates curated person-level operational data. Candidate records support recruiter decisions but do not become Learning Assets automatically.

### Phase 6 - Evaluation Result

Creates the audit and review container for Decision Support. AI output remains reviewable and can be accepted, modified, rejected, or marked incorrect.

### Phase 7 - AI Resume Parsing

Produces Decision Support for parsing and evidence extraction. It does not create final candidate decisions or reusable memory without review.

### Phase 8 - AI Evaluation

Produces Decision Support only. Strengths, weaknesses, risks, and questions must be evidence-backed, explainable, and human-reviewed.

### Phase 9 - Phone Screen And Interview Questions

Produces recruiter-editable Decision Support. Questions are suggestions, not mandatory scripts or decision rules.

### Phase 10 - Pipeline And Offer

Keeps workflow action under recruiter control. AI may suggest next actions, but cannot move candidates or approve offers autonomously.

### Phase 11 - Talent Map

Transforms reviewed operational data into talent landscape Decision Support. It does not create hidden rankings or market truth.

### Phase 12 - Representative Models And Recruitment Analytics

Creates Learning Assets only after human review. Assets are versioned, source-linked, explainable, auditable, and safe to archive.

### Phase 13 - Feishu Integration

Treats Feishu as an integration boundary. Feishu data flows through services into domain objects and does not bypass review, audit, or domain ownership.

---

## 10. Codex Execution Guidance

Future Codex tasks should follow these rules:

- Work one task at a time.
- Keep each task independently commit-ready.
- Prefer small commits with clear scope.
- Read relevant `/docs` architecture files before changing code.
- Preserve V1 behavior unless the task explicitly approves a V1 change.
- Never access Prisma from UI.
- Never bypass the Service Layer.
- Keep AI calls backend-only.
- Keep prompts under `/prompts`.
- Do not introduce dependencies without clear justification.
- Do not define scoring standards or classification thresholds.
- Do not create Feishu integration before a specific Feishu task is approved.
- Update docs when architecture changes.
- Run self review before marking a task complete.
- Run quality gates appropriate to the task:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```

For feature tasks that affect runtime behavior, also run:

```bash
docker compose up --build
```

Self review checklist:

- requirements satisfied
- V1 unaffected
- service layer respected
- repository boundary respected
- no frontend AI calls
- no secrets exposed
- no hidden scoring rules
- docs updated if needed
- tests added or updated if applicable
- ready for milestone review

---

## 11. Next Task Recommendation

Recommended next coding task:

```text
TASK-009 - V2 Foundation And Navigation
```

TASK-009 should formalize the V2 workspace shell, route group, navigation, placeholder pages, README update, CHANGELOG update, and validation checks.

Do not implement TASK-009 inside TASK-008.
