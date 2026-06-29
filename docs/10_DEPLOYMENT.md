# 10_DEPLOYMENT.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the deployment architecture for HR Daily AI V1.

It covers:

- Local development environment
- Docker setup
- Database deployment
- Build process
- GitHub workflow
- CI pipeline (minimal)

V1 targets: **single-command local deployment**

---

# 2. Deployment Philosophy

V1 deployment must follow:

- Zero manual setup after clone
- One command startup
- Fully containerized environment
- No cloud dependency required

---

# 3. System Architecture (Deployment View)

```text
+----------------------+
|   Docker Compose     |
+----------------------+
        |
        |----------------------|
        |                      |
+---------------+      +----------------+
| Next.js App   |      | PostgreSQL DB  |
| (Container)   |      | (Container)    |
+---------------+      +----------------+
```

---

# 4. Docker Architecture

## 4.1 Services

Required services:

- app (Next.js)
- postgres (PostgreSQL)

## 4.2 docker-compose.yml

File:

```text
docker/docker-compose.yml
```

Example:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: hr_daily_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hr_daily
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: hr_daily_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/hr_daily
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  db_data:
```

---

# 5. Dockerfile

File:

```text
docker/Dockerfile
```

Example:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

# 6. Local Development Flow

## 6.1 Start Project

Run from repository root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## 6.2 Stop Project

```bash
docker compose -f docker/docker-compose.yml down
```

## 6.3 Reset Database

```bash
docker compose -f docker/docker-compose.yml down -v
```

---

# 7. Environment Variables

Required:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hr_daily
OPENAI_API_KEY=your_key_here
```

Optional:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=HR Daily AI
```

Rules:

- `.env` must never be committed
- `.env.example` must document required variables without real secrets
- `OPENAI_API_KEY` must remain backend-only

---

# 8. GitHub Workflow

## 8.1 CI Pipeline

File:

```text
.github/workflows/ci.yml
```

## 8.2 CI Steps

Pipeline must include:

- Install dependencies
- Type check
- Lint check
- Build

Example CI:

```yaml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run build
```

---

# 9. Build Requirements

Must pass:

```bash
npm run build
npm run lint
npm run typecheck
```

---

# 10. Database Deployment

Rules:

- PostgreSQL runs inside Docker
- No external DB required in V1
- Prisma migrations run inside container or local dev
- All schema changes must go through Prisma Migrate

Migration commands:

```bash
npx prisma migrate dev
npx prisma generate
```

---

# 11. Production Deployment (V1 Scope)

## 11.1 Scope Limitation

V1 does NOT require:

- Kubernetes
- Cloud deployment
- Auto-scaling
- Load balancing
- CDN optimization

## 11.2 Target

- Local Docker only
- GitHub-based code storage

---

# 12. Security Rules

- No secrets in codebase
- API keys only in environment variables
- `.env` must never be committed
- No public exposure of database credentials
- No frontend exposure of `OPENAI_API_KEY`

---

# 13. Performance Constraints

- App startup < 10 seconds (local Docker target)
- Database connection stable on startup
- No blocking initialization logic

---

# 14. Common Failure Handling

## 14.1 App Fails to Start

Check:

- Node modules installed
- Docker build logs
- Build command output

## 14.2 DB Connection Fails

Check:

- `DATABASE_URL`
- `postgres` container running
- Docker network resolution

## 14.3 AI Fails

Check:

- `OPENAI_API_KEY`
- API quota
- Backend logs

---

# 15. Out of Scope (V1)

- Kubernetes deployment
- AWS / GCP / Azure integration
- Serverless deployment
- Auto-scaling infrastructure
- Multi-region deployment

---

# 16. Summary

This deployment system ensures:

- One-command startup
- Fully containerized architecture
- Zero external dependencies
- Deterministic local environment
- Codex-friendly reproducibility
