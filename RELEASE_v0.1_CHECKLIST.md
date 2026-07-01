# AI Recruiter MVP v0.1 Release Checklist

Use this checklist before tagging or sharing the v0.1 Beta for daily recruiting use.

## Environment

- [ ] `.env` exists in the repository root on the deployment machine.
- [ ] `.env` is not committed.
- [ ] `DATABASE_URL` points to the Docker `db` service for Docker runs.
- [ ] AI provider is selected with `AI_PROVIDER`.
- [ ] `AI_TIMEOUT_MS` is set high enough for the selected provider/model.
- [ ] API key is configured only in backend environment variables.
- [ ] No API key appears in README, docs, logs, frontend code, or workflow files.

## Docker

- [ ] `docker compose build` succeeds.
- [ ] `docker compose up --build -d` starts the app and database.
- [ ] `docker compose ps` shows `hr_daily_app` healthy.
- [ ] `docker compose ps` shows `hr_daily_db` healthy.
- [ ] `docker compose down` stops the stack cleanly.

## AI

- [ ] `/api/settings/status` shows AI status `ready`.
- [ ] `/api/health` shows AI `configured` when the active provider is ready.
- [ ] Missing API key returns an actionable error.
- [ ] Invalid AI JSON is retried once and then fails gracefully.
- [ ] AI outputs remain editable before save.
- [ ] No AI workflow automatically persists unreviewed output.

## Database

- [ ] Prisma migrations run during container startup.
- [ ] App can connect to PostgreSQL.
- [ ] No pending migration blocks startup.
- [ ] V1 routes still read/write existing data.

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `docker compose build`

## Smoke Test

- [ ] `/feishu` opens.
- [ ] `/feishu/job-profile/new` opens.
- [ ] `/feishu/candidate-understanding/new` opens.
- [ ] `/feishu/recruit-together` opens.
- [ ] `/feishu/daily-workspace` opens.
- [ ] `/feishu/tasks` opens.
- [ ] `/log` opens.
- [ ] Job Understanding can generate and save a reviewed Job Profile.
- [ ] Candidate Understanding can generate and save a reviewed Candidate Insight.
- [ ] Recruit Together can generate phone prep, interview prep, recruiter summary, and save.
- [ ] Daily Workspace can generate and save reviewed daily output.
- [ ] Task Center can sync tasks and return to Workspace.

## Known Issues

- [ ] Feishu API is not connected in v0.1 Beta.
- [ ] ATS, CRM, Pipeline, Offer, Analytics, and Learning Assets are intentionally not implemented.
- [ ] AI reliability depends on provider availability and network access.
- [ ] Resume parsing is limited to TXT, PDF, and DOCX.
- [ ] No authentication or multi-user permission model exists yet.

## Release Decision

- [ ] Ready for v0.1 Beta daily use.
- [ ] Ready for Claude Review.
