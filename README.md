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

## Environment

Create a local `.env` file from `.env.example`.

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_daily
OPENAI_API_KEY=
```

`OPENAI_API_KEY` is required for AI Review, Tomorrow Planner, and AI Knowledge Extraction. The key is only used on the backend and must not be committed.

For Docker, keep `DATABASE_URL` pointed at `db`. For local Node.js development outside Docker, use the database host reachable from your machine, such as `localhost`.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
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
