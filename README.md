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

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Docker

```bash
docker compose up --build
docker compose down
docker compose logs -f
```

The Docker environment starts the Next.js app on port `3000` and PostgreSQL on port `5432`.
