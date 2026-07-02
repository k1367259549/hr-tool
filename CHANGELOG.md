# Changelog

## [Unreleased]

### Added
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
