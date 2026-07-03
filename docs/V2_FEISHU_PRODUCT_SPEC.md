# V2_FEISHU_PRODUCT_SPEC.md

Version: V2.0 Draft
System: Feishu Recruiting AI

---

## 1. V2 Product Positioning

Feishu Recruiting AI V2 is the next architecture layer of `hr-tool`.

V1 focuses on a recruiter's daily personal workflow:

- daily recruiting logs
- AI daily review
- tomorrow planning
- knowledge base
- spreadsheet analysis
- settings and AI configuration status

V2 shifts the product toward a Feishu-centered recruiting operating system. Its core goal is to connect candidate records, resumes, hiring stages, interviews, offers, and Feishu collaboration into one structured workflow.

V2 is not a replacement for V1. V2 is an expansion layer that keeps V1 stable while introducing Feishu-oriented recruiting modules.

---

## 2. Relationship Between Feishu V2 And V1

V1 remains the stable foundation.

The following V1 routes must continue to work and must not be broken by V2 work:

```text
/log
/review
/planner
/knowledge
/settings
```

V2 starts from a separate entry point:

```text
/feishu
```

V2 may reuse existing platform capabilities:

- AI provider abstraction
- prompt loading
- JSON parsing
- standard API responses
- logger and audit patterns
- shared UI components
- Docker deployment

V2 must not bypass existing architecture rules:

```text
UI -> API Route -> Service Layer -> Repository Layer -> Prisma -> PostgreSQL
```

V2 Feishu integration must be backend-only. No frontend component may call Feishu APIs or AI providers directly.

---

## 3. Candidate CRM

Candidate CRM is the central V2 data module.

Purpose:

- create and manage candidate profiles
- track candidate source and ownership
- keep contact and recruiting context in one place
- connect resumes, pipeline stages, interviews, and offers to one candidate record

Candidate CRM should eventually support:

- candidate name
- phone or email
- current company
- target position
- source channel
- tags
- owner
- current pipeline stage
- latest activity
- related resumes
- related interviews
- related offers

Initial route:

```text
/feishu/candidates
```

Current implementation scope:

- Candidate database model
- Candidate audit model
- manual Candidate CRUD
- search, filters, pagination, soft archive, restore, resume counts, and audit timeline
- CandidateResume can optionally link to Candidate through nullable `candidateId`
- recruiter-confirmed manual Candidate-Resume linking and unlinking from Candidate detail pages
- link and unlink operations are transaction-safe and write CandidateAudit records
- Resume linking APIs return safe metadata only and do not expose original resume binaries or parsed full resume text
- no Feishu contact synchronization
- no automatic Candidate creation from resumes
- no automatic Candidate-Resume linking
- no automatic Resume matching or transfer
- no Interview or Offer model
- Candidate detail shows role-specific Candidate Applications, but Candidate itself does not own a single current Pipeline stage

---

## 4. Resume Library And Parsing

The Resume module manages independent Resume Library records and structured parsing.

Purpose:

- upload independent resume files
- extract resume text without AI
- keep parsing status, source, notes, and duplicate signals
- display safe Candidate and initial Job Profile summaries when they exist
- prepare normalized data for future AI evaluation and recruiter review

Current Resume Library supports:

- file upload validation
- supported file type checks
- resume text extraction
- PDF, DOCX, and TXT up to 10MB
- search, filters, pagination, and linked/unlinked views
- exact-file duplicate signals through non-unique SHA-256 `contentHash`
- editable candidate source and notes

Initial route:

```text
/feishu/resumes
```

Current implementation scope:

- real Resume Library list, upload, and detail pages
- `CandidateResume` remains the compatibility model name but now represents an independent Resume Library record
- `jobProfileId` is nullable and only stores initial processing context when present
- `intakeSource` distinguishes Resume Library uploads from Candidate Understanding uploads
- original files remain in PostgreSQL BYTEA for the beta
- no download or delete
- no automatic Candidate creation
- no automatic Candidate-Resume linking
- no automatic duplicate merge
- no AI evaluation or multi-job evaluation result in this milestone

---

## 5. Candidate Understanding And Resume Analysis

Candidate Understanding and Resume Analysis are V2 decision-support workflows.

Purpose:

- understand resume content in the context of a reviewed Job Profile
- produce structured evaluation output
- help recruiters identify strengths, risks, missing information, evidence, and interview questions

Expected AI output shape:

```json
{
  "summary": "string",
  "strengths": ["string"],
  "risks": ["string"],
  "missingInformation": ["string"],
  "evidence": ["string"],
  "interviewQuestions": ["string"]
}
```

Rules:

- V2 must not generate candidate scores, rankings, hire recommendations, reject recommendations, or automatic pipeline movement.
- The legacy V1 `/api/ai/resume-evaluate` endpoint is separate from V2 Candidate Understanding and may keep its V1 `matchScore` response for backward compatibility.
- AI calls must happen on the backend only.
- API keys must come from environment variables only.
- Prompts must live in `/prompts`.
- AI output must be JSON.
- Parsed output must be schema validated before use.
- AI must not invent candidate experience or missing job requirements.

Current implementation scope:

- architecture specification only
- no Feishu API integration
- no persistence model change

---

## 6. Recruiting Pipeline

Pipeline is the V2 hiring stage workflow.

Purpose:

- track each candidate through recruiting stages
- expose stage-level visibility
- support funnel analysis
- prepare for Feishu status synchronization

Potential stages:

```text
New
Resume Screen
Phone Screen
Interview
Offer
Hired
Rejected
```

Future Pipeline features:

- stage board
- candidate stage movement
- stage history
- conversion metrics
- bottleneck detection
- Feishu event synchronization

Initial route:

```text
/feishu/pipeline
```

Current implementation scope:

- CandidateApplication model connecting Candidate and reviewed JobProfile
- ApplicationEvent model for minimal stage history
- manual Application stage movement only
- stage board, create page, and detail page under `/feishu/pipeline`
- PostgreSQL partial unique index preventing duplicate active Candidate + JobProfile applications
- atomic conditional stage updates to prevent stale concurrent movement
- no drag and drop
- no Interview record implementation
- no Offer entity implementation
- no scoring, ranking, hire recommendation, reject recommendation, automatic stage movement, or real Feishu synchronization

---

## 7. Interview Records

The Interview module tracks scheduling, feedback, and interview outcomes.

Purpose:

- record interview rounds
- store interview feedback
- connect interview records to Candidate CRM and Pipeline
- prepare for Feishu calendar and message integration

Future interview data may include:

- candidate ID
- position
- interview round
- interviewer
- scheduled time
- interview result
- feedback summary
- risks
- next step

Initial route:

```text
/feishu/interviews
```

Current implementation scope:

- page skeleton only
- no calendar integration
- no interview CRUD
- no database schema change

---

## 8. Offer Management

Offer management tracks final hiring decisions and offer outcomes.

Purpose:

- manage offer creation and status
- track approval, send, accept, reject, and onboarding handoff states
- connect Offer records to Candidate CRM and Pipeline
- prepare for Feishu approval workflows

Potential Offer statuses:

```text
Draft
Pending Approval
Approved
Sent
Accepted
Rejected
Withdrawn
Onboarding
```

Initial route:

```text
/feishu/offers
```

Current implementation scope:

- page skeleton only
- no approval flow
- no Offer database model
- no Feishu approval integration

---

## 9. Feishu Integration Boundary

V2 must treat Feishu as an external integration boundary.

Feishu integration must be isolated behind backend services or provider wrappers. UI components must never call Feishu APIs directly.

Recommended future location:

```text
src/integrations/feishu
```

Provider responsibilities:

- tenant token handling
- app access token handling
- API client wrapper
- request retries
- rate limit handling
- Feishu error normalization
- response normalization
- webhook signature validation if needed

Backend-only rules:

- Feishu app secrets must come from environment variables.
- Feishu secrets must never be returned to the frontend.
- Feishu secrets must never be logged.
- Feishu sync failures must return controlled API errors.

Initial route for configuration status:

```text
/feishu/settings
```

Current implementation scope:

- settings page skeleton only
- no real Feishu authentication
- no token exchange
- no webhook endpoint
- no Feishu Open API call

---

## 10. MVP Scope

V2 MVP should be intentionally small.

Included in MVP:

- `/feishu` entry
- V2 navigation
- Candidate CRM Foundation
- Resume Library Foundation
- Pipeline Foundation
- Interview skeleton
- Offer skeleton
- Feishu Settings skeleton
- Candidate Understanding workflow entry
- backend-only AI provider usage
- no secrets exposed to frontend

Deferred from MVP:

- full Feishu API integration
- Feishu OAuth
- webhook processing
- advanced Candidate CRM automation
- advanced ATS features
- complex permission model
- multi-user role system
- custom workflow builder
- external file storage

---

## 11. Later Version Scope

Future versions may add:

- real Feishu app configuration
- Feishu tenant token lifecycle management
- Feishu Base/Bitable synchronization
- Feishu contact or group integration
- Feishu calendar integration for interviews
- Feishu approval integration for offers
- advanced Candidate lifecycle workflows
- richer Resume Library management after independent upload and manual linking are stable
- Resume x Job Profile evaluation result
- configurable Pipeline stages after the manual foundation is stable
- Interview feedback forms
- Offer approval and onboarding handoff
- Recruiting report workspace
- Feishu chat summary workspace
- recruiting analytics across V1 and V2 data
- AI interview question generation
- AI-supported candidate comparison without automatic ranking
- AI pipeline bottleneck analysis
- audit logs for Feishu sync operations

Any future database changes must use Prisma migrations and must not break V1 data.

---

## 12. Technical Architecture

Route layer:

```text
src/app/feishu
```

Module layer:

```text
src/modules/candidate
src/modules/resume
src/modules/pipeline
src/modules/interview
src/modules/offer
src/modules/report
src/modules/chat-summary
src/modules/feishu
```

Current V2 routes:

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

Future backend flow:

```text
UI
  -> API Route
  -> V2 Service
  -> Repository
  -> Prisma
  -> PostgreSQL
```

Future Feishu flow:

```text
V2 Service
  -> Feishu Provider
  -> Feishu Open API
  -> Normalizer
  -> Repository
```

Future AI flow:

```text
V2 Service
  -> Prompt Loader
  -> AI Service
  -> JSON Parser
  -> Schema Validator
  -> Repository
```

---

## 13. Current Task Boundaries

This architecture task only defines V2 direction and route/module boundaries.

Do not implement in this task:

- real Feishu API calls
- Feishu authentication
- Feishu webhook endpoints
- V1 route rewrites
- V1 service rewrites
- Resume persistence
- Pipeline board behavior
- Interview scheduling logic
- Offer workflow logic

Definition of done:

- V2 product spec exists.
- V1 pages remain untouched.
- Project builds successfully.

---

## 14. Current Page Skeleton Completion

The current V2 page skeleton stage has been completed.

Completed routes:

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

Completed UI structure:

- V2 home page with module entry cards
- V2 navigation for switching between Feishu pages
- Candidate CRM list, create, and detail pages
- Resume Library list, upload, and detail pages
- Candidate Understanding entry card
- Recruiting Pipeline board, Application create page, and Application detail page
- Interview records placeholder page
- Offer management placeholder page
- Recruiting report placeholder page
- Feishu chat summary placeholder page
- Feishu integration settings placeholder page

Current stage guarantees:

- no real Feishu API calls
- no direct database access from V2 pages
- no V1 page or API rewrite
- no V2 candidate score, ranking, hire recommendation, or reject recommendation
- Candidate CRUD is manual and recruiter-controlled
- Candidate and Resume remain separate; current linking is manual, recruiter-confirmed, audited, and never automatic
- Chinese HR recruiting scenario copy
- route-level skeletons remain for deferred non-Candidate modules

Future implementation stages should extend V2 data models only through separate approved schema tasks.
