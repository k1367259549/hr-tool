# HR Daily AI

HR Daily AI is an AI-first recruiting operations system for structured daily logs, recruiting analytics, AI reviews, tomorrow planning, and long-term recruiting knowledge.

## Tech Stack

- Next.js 15 App Router
- React 18+
- TypeScript strict mode
- TailwindCSS
- shadcn/ui
- Prisma
- PostgreSQL
- OpenAI API
- Docker and Docker Compose

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

For AI Recruiter MVP v0.1 daily use, Docker is the recommended startup path:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

```text
http://localhost:3000/feishu
```

## Environment

Create a local `.env` file from `.env.example`.

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_daily
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2000
```

`OPENAI_API_KEY` is required for AI Review, Tomorrow Planner, and AI Knowledge Extraction. The key is only used on the backend and must not be committed.

For Docker, keep `DATABASE_URL` pointed at `db`. For local Node.js development outside Docker, use the database host reachable from your machine, such as `localhost`.

## AI API Setup

AI features require a backend-only API key. Use `OPENAI_API_KEY` for the official OpenAI provider, or `AI_API_KEY` with `AI_PROVIDER=openai-compatible` for an OpenAI-compatible relay. The app only displays whether the key is configured and never exposes the key itself.

See [docs/AI_API_SETUP.md](docs/AI_API_SETUP.md) for setup, Docker restart steps, verification, and troubleshooting.

## Resume Evaluation API

The backend provides an OpenAI-powered resume evaluation endpoint. The API key is read from `OPENAI_API_KEY` on the server only and is never exposed to the browser.

```http
POST /api/ai/resume-evaluate
Content-Type: application/json
```

Request body:

```json
{
  "resumeText": "Candidate resume text...",
  "jobDescription": "Job description text..."
}
```

Successful response:

```json
{
  "success": true,
  "data": {
    "summary": "Short evaluation summary.",
    "strengths": ["Relevant experience"],
    "risks": ["Missing required certification"],
    "matchScore": 82,
    "interviewQuestions": ["Can you describe your most relevant project?"]
  },
  "error": null
}
```

If `OPENAI_API_KEY` is missing or the model returns invalid JSON, the endpoint returns the standard API error format without leaking secrets.

## AI Recruiter MVP v0.1

AI Recruiter starts at:

```text
/feishu
```

The current V2 MVP connects the completed recruiter workflows into one workspace:

```text
/feishu/job-profile/new
/feishu/candidate-understanding/new
/feishu/recruit-together
/feishu/daily-workspace
/feishu/tasks
```

The recruiter flow is:

```text
Job -> Resume -> Candidate -> Phone -> Interview -> Daily Review -> Next Action
```

The workspace uses backend services only. AI keys remain server-side, AI outputs are editable before save, and no scoring, ranking, hire recommendation, rejection recommendation, automatic pipeline movement, or Learning Asset publication is implemented.

Additional V2 placeholder routes remain available for future modules:

```text
/feishu/candidates
/feishu/resumes
/feishu/pipeline
/feishu/interviews
/feishu/offers
/feishu/report
/feishu/chat-summary
/feishu/settings
```

See [docs/V2_FEISHU_PRODUCT_SPEC.md](docs/V2_FEISHU_PRODUCT_SPEC.md) and [docs/v2/25_MILESTONE_01_AI_RECRUITER_MVP_V0_1.md](docs/v2/25_MILESTONE_01_AI_RECRUITER_MVP_V0_1.md) for V2 scope, workflow continuity, and milestone validation.

### AI Recruiter Quick Start

1. Configure backend AI settings in `.env`.
   For slower relay providers, tune `AI_TIMEOUT_MS` instead of changing workflow code.
2. Start Docker with `docker compose up --build`.
3. Open `/feishu`.
4. Create a Job Understanding from a JD.
5. Upload a TXT, PDF, or DOCX resume in Candidate Understanding.
6. Continue into Recruit Together, Daily Workspace, and Task Center.

Each AI output must be reviewed and saved by the recruiter. The app does not automatically persist AI output before review.

### Release Notes v0.1 Beta

- Connected AI Recruiter workflows from Workspace to Task Center.
- Added shared workflow progress and recommended next-action navigation.
- Unified V2 AI calls through one AI service pipeline with prompt registry, prompt builder, schema validation, retry, and observability.
- Verified Docker startup, database connectivity, and V2 route reachability.

### Known Limitations v0.1 Beta

- Feishu API integration is not connected.
- ATS, CRM, Pipeline, Offer, Analytics, and Learning Assets are not implemented.
- AI generation depends on the configured provider and network availability.
- Resume parsing supports TXT, PDF, and DOCX only.
- AI outputs may be incomplete or wrong and require recruiter review.
- There is no authentication or multi-user permission model in this beta.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```

## CI Status

GitHub Actions validates pushes and pull requests to `main` and `develop`.

The CI workflow runs:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `docker compose build`

## Docker

```bash
docker compose up --build
docker compose down
docker compose logs -f
```

The Docker environment starts the Next.js app on port `3000` and PostgreSQL on port `5432`.

## Release Process

1. Complete `docs/RELEASE_CHECKLIST.md`.
2. Run the required validation commands locally.
3. Trigger the manual `Release` workflow in GitHub Actions with the target version.
4. Create a Git tag after validation succeeds.

The release workflow validates the app and uploads a source artifact. It does not deploy to cloud services or publish Docker images.
