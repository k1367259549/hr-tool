# Task033 - Docker Production Optimization

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Optimize Docker setup for production-like local deployment.

After this task, the Docker environment should be more stable, smaller, and closer to a real deployment setup.

---

# Context

Task032 added API integration tests.

Task033 improves Docker build quality and runtime reliability.

---

# Requirements

Improve:

- Dockerfile
- docker-compose.yml
- .dockerignore
- environment handling
- startup reliability

---

# Files To Create or Modify

```text
docker/Dockerfile
docker/.dockerignore
docker-compose.yml
.env.example
README.md
```

---

# Dockerfile Requirements

Update Dockerfile to use multi-stage build:

- deps
- builder
- runner

Requirements:

- smaller final image
- production dependencies only in final stage
- app runs with non-root user if possible
- Next.js standalone output if supported

---

# docker-compose Requirements

Must include:

- app
- db

Improve:

- healthcheck for db
- restart policy
- persistent volume
- clear environment variables

---

# Database Healthcheck

Add PostgreSQL healthcheck:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
```

---

# .dockerignore

Must exclude:

- node_modules
- .next
- .git
- .env
- coverage
- dist
- *.log

---

# README Update

Add Docker commands:

```bash
docker compose up --build
docker compose down
docker compose logs -f
```

---

# Do NOT

Do NOT:

- change application features
- modify database schema unless required
- add Kubernetes
- add cloud deployment
- add Nginx
- add external services

---

# Acceptance Criteria

- Docker build succeeds
- Docker image is optimized with multi-stage build
- DB healthcheck works
- App starts only after DB is ready or handles retry safely
- Environment variables remain secure
- README includes updated Docker commands
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `docker compose up --build`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

all succeed.
