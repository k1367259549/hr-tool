# Changelog

## [Unreleased]

### Added
- AI Recruiter MVP v0.1 Beta production readiness checklist
- Unified AI infrastructure pipeline for V2 workflows
- Workflow progress and next-action navigation across AI Recruiter
- Feishu Recruiting Workspace skeleton under `/feishu`
- Static V2 pages for candidates, resumes, pipeline, interviews, offers, reports, chat summaries, and Feishu settings
- V2 fixed left navigation for Feishu workspace pages
- V2 product specification document

### Changed
- `/api/health` now checks the active AI provider configuration instead of only `OPENAI_API_KEY`
- OpenAI-compatible Base URL normalization appends `/v1` when a root relay URL is configured

### Validation
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `docker compose build`
- `docker compose up --build -d`

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
