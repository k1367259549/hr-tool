# Changelog

## [Unreleased]

### Added
- Resume Evaluation Result Foundation with ResumeEvaluationResult, ResumeEvaluationEvent, DRAFT/REVIEWED lifecycle, per-criterion evidence assessments, optimistic concurrency via revision, evaluation entry points on Resume detail page, UI pages, APIs, and guarded PostgreSQL concurrency tests
- Resume Evaluation Result Foundation architecture document
- Evaluation Template Foundation with EvaluationTemplate, EvaluationTemplateVersion, JobProfileEvaluationAssignment, Draft/Published lifecycle, structured criteria, reviewed Job Profile assignment, UI, APIs, and guarded PostgreSQL concurrency tests
- Evaluation Template Foundation architecture document
- Resume Library Foundation with independent CandidateResume-based Resume records, standalone uploads, non-AI TXT/PDF/DOCX parsing, Resume list/detail pages, duplicate-file signals, safe APIs, and guarded PostgreSQL tests
- Resume Library Foundation architecture document
- Recruiting Pipeline Foundation with CandidateApplication, ApplicationEvent history, manual stage transitions, Pipeline board, Application create/detail pages, Candidate detail application entry, and guarded PostgreSQL concurrency tests
- Recruiting Pipeline Foundation architecture document
- Manual Candidate-Resume linking with recruiter confirmation, safe Resume metadata APIs, transactional link/unlink audit, available Resume search, conflict handling, and Candidate detail UI
- Candidate-Resume Manual Linking architecture document
- Candidate CRM Foundation with Candidate model, audit model, nullable CandidateResume link, manual CRUD APIs, search, filters, pagination, soft archive, restore, and `/feishu/candidates` UI
- Candidate CRM Foundation architecture document
- Documented v0.1 resume binary storage decision for PostgreSQL BYTEA and future object storage migration
- AI Recruiter MVP v0.1 Beta production readiness checklist
- Unified AI infrastructure pipeline for V2 workflows
- Workflow progress and next-action navigation across AI Recruiter
- Feishu Recruiting Workspace skeleton under `/feishu`
- Static V2 pages for candidates, resumes, pipeline, interviews, offers, reports, chat summaries, and Feishu settings
- V2 fixed left navigation for Feishu workspace pages
- V2 product specification document

### Changed
- `/feishu/evaluation-templates` now provides configurable, versioned evaluation standards without AI scoring, weights, thresholds, ranking, or automatic decisions
- Product Spec now reflects implemented Candidate Understanding behavior and separates historical V2 architecture boundaries from current product scope
- CandidateResume now supports independent Resume Library records through nullable `jobProfileId`, `ResumeIntakeSource`, and optional `contentHash`
- Candidate Understanding now tags created Resume records with `CANDIDATE_UNDERSTANDING` and keeps reviewed Job Profile context
- `/feishu/resumes` now shows a real Resume Library instead of a static placeholder
- Candidate detail now shows role-specific Candidate Applications without writing a global current Pipeline stage to Candidate
- `/feishu/pipeline` now shows a real manual Pipeline board instead of a static placeholder
- Candidate-Resume link now uses an atomic `candidateId IS NULL` conditional update and classifies zero-count updates as idempotent, conflict, or not found before writing audit
- Candidate-Resume unlink now uses an atomic `candidateId = current Candidate` conditional update so stale unlink requests cannot clear newer associations
- CandidateAuditAction now includes `RESUME_LINKED` and `RESUME_UNLINKED` for explicit manual Resume linking history
- Candidate detail now refreshes Resume count and audit timeline after manual link or unlink
- Candidate writes and CandidateAudit writes now run in one Prisma interactive transaction
- Candidate UPDATED audit now stores only changed fields, including notes when notes change, without repeating unrelated email, phone, or notes data
- Candidate archive and restore audit now store only status-related fields
- Candidate no-op PATCH now skips database update, activity timestamp changes, and UPDATED audit creation
- Candidate API conflict errors now return response code `CONFLICT` with HTTP 409
- CandidateResume relation now explicitly declares `onDelete: SetNull` in Prisma schema
- Candidate Understanding now rejects unreviewed Job Profiles when loading by ID
- Reviewed Job Profile lists now only include profiles with `reviewedAt != null`
- Marked `/api/ai/resume-evaluate` as a V1 legacy API and clarified that V2 Candidate Understanding has no scoring, ranking, hire recommendation, or reject recommendation
- Made Job Profile and Candidate Insight `reviewedAt` nullable to represent recruiter confirmation time accurately
- `/api/health` now checks the active AI provider configuration instead of only `OPENAI_API_KEY`
- OpenAI-compatible Base URL normalization appends `/v1` when a root relay URL is configured

### Validation
- Evaluation Template validation, service, API, UI helper, schema guard, and guarded real PostgreSQL transaction/concurrency tests
- Resume Library validation, repository, service, API, UI helper, schema guard, and guarded real PostgreSQL tests
- CandidateApplication validation, service, API, UI helper, schema guard, and guarded real PostgreSQL transaction/concurrency tests
- Candidate-Resume concurrency regression tests for atomic link, stale unlink, and real PostgreSQL concurrent linking
- Candidate-Resume linking validation, repository, service, API, UI utility, schema guard, and guarded real PostgreSQL transaction rollback tests
- Candidate transaction, changed-field audit, no-op PATCH, conflict response, and Prisma schema guard tests
- Candidate CRM validation, service, API, reviewed Job Profile, Candidate Understanding, and resume boundary regression tests
- Final PR #1 review validation completed after blocker fixes
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `docker compose build`
- `docker compose up --build -d`
- route smoke test for `/feishu`, `/feishu/job-profile/new`, `/feishu/candidate-understanding/new`, `/feishu/recruit-together`, `/feishu/daily-workspace`, `/feishu/tasks`, and `/log`

## [1.1.0] - 2026-06-30

### Added
- `/api/health` endpoint — returns database and AI configuration status
- `/api/version` endpoint — returns version, git commit, and build time
- Docker healthcheck for app container via `/api/health`
- `GIT_COMMIT` and `BUILD_TIME` injected at Docker build time
- Spreadsheet upload and GPT analysis
- Docker build optimization (npmmirror registry, removed cache-mount hang)
- AI error handler

### Changed
- AI provider configuration
- Prompt loader

### Fixed
- Docker build hang at `npm ci` on Windows Docker Desktop
- `npm ci` BuildKit cache mount unreliable on Windows
- API error messages
