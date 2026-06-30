# Task034 - GitHub Actions and Release Workflow

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the GitHub Actions CI workflow and basic release process.

After this task, every push or pull request must automatically validate the project.

---

# Context

Task033 optimized Docker deployment.

Task034 adds GitHub-based automation for quality control and release preparation.

---

# Requirements

Create:

- CI workflow
- Build validation
- Lint validation
- Type check validation
- Test validation
- Release checklist

---

# Files To Create or Modify

```text
.github/workflows/ci.yml
.github/workflows/release.yml
docs/RELEASE_CHECKLIST.md
README.md
package.json
```

---

# CI Workflow

Create:

```text
.github/workflows/ci.yml
```

Triggered by:

- push
- pull_request

Branches:

- main
- develop

---

# CI Steps

The CI workflow must run:

- npm install
- npm run lint
- npm run typecheck
- npm run test
- npm run build

---

# Docker Build Check

CI should include Docker build validation if feasible:

```bash
docker compose build
```

---

# Release Workflow

Create a lightweight release workflow:

```text
.github/workflows/release.yml
```

Triggered manually:

```text
workflow_dispatch
```

Purpose:

- run validation
- build app
- optionally create release artifact

---

# Release Checklist

Create:

```text
docs/RELEASE_CHECKLIST.md
```

Must include:

- Version number checked
- Docker build succeeds
- Database migration succeeds
- Core pages tested
- AI Review tested
- Planner tested
- Knowledge tested
- Markdown export tested
- No secrets committed
- README updated
- Git tag created

---

# README Update

Add:

- CI status section
- Release process section

---

# Do NOT

Do NOT:

- deploy to cloud
- add paid CI services
- add Kubernetes
- add secrets to workflow files
- auto-publish Docker images
- add complex semantic release tooling

---

# Acceptance Criteria

- CI workflow runs on push
- CI workflow runs on pull request
- Lint is checked
- TypeScript is checked
- Tests are checked
- Build is checked
- Release checklist exists
- README explains release process
- No secrets are exposed
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `docker compose build`

all succeed.
