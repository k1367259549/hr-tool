# Task002 - Docker Environment

Version: V1.0  
Status: TODO  
Estimated Time: 1~2 hours

---

# Goal

Create the Docker environment for HR Daily AI.

After this task, the project must be able to start with Docker.

---

# Context

Task001 initialized the project structure.

Task002 focuses only on Docker setup.

No database schema, API, UI, or AI logic should be implemented in this task.

---

# Requirements

Create Docker support for:

- Next.js app
- PostgreSQL database
- Docker Compose orchestration

---

# Files To Create

```text
docker/Dockerfile
docker/.dockerignore
docker-compose.yml
```

---

# Docker Compose Requirements

The compose file must define two services:

- app
- db

## app service

Requirements:

- Build from `docker/Dockerfile`
- Expose port 3000
- Use environment variables
- Depend on db

## db service

Requirements:

- Use PostgreSQL 16
- Expose port 5432
- Use persistent volume
- Default database name: `hr_daily`
- Default user: `postgres`
- Default password: `postgres`

---

# Environment Variables

Update `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/hr_daily
OPENAI_API_KEY=
```

---

# Dockerfile Requirements

The Dockerfile must:

- Use Node.js 20 Alpine
- Set working directory `/app`
- Install dependencies
- Copy project files
- Build the Next.js app
- Start the app

---

# Commands That Must Work

```bash
docker compose up --build
docker compose down
```

---

# Do NOT

Do NOT:

- create Prisma schema
- run migrations
- create API routes
- create UI pages
- implement AI logic

---

# Deliverables

After completion, the project must include:

- `docker/Dockerfile`
- `docker/.dockerignore`
- `docker-compose.yml`
- `.env.example`

---

# Acceptance Criteria

- Docker build succeeds
- App container starts
- Database container starts
- App is accessible at `http://localhost:3000`
- PostgreSQL is accessible inside Docker network
- No hardcoded secrets except local development defaults

---

# Definition of Done

Task is complete when:

- `docker compose up --build` runs successfully
- Next.js app starts in Docker
- PostgreSQL starts in Docker
- No business features are implemented
- Repository is ready for Task003
