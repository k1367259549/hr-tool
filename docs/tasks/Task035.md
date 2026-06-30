# Task035 - V1 Release and Cleanup

Version: V1.0
Status: TODO
Estimated Time: 3~5 hours

---

# Goal

Finalize HR Daily AI V1 for release.

After this task, the project must be clean, documented, runnable, and ready to tag as `v1.0.0`.

---

# Context

Task034 created GitHub Actions and release workflow.

Task035 is the final stabilization task before V1 release.

---

# Requirements

Perform:

- Code cleanup
- Folder structure review
- Dead code removal
- Documentation review
- Final Docker validation
- Final AI workflow validation
- Final release checklist validation

---

# Files To Review

```text
README.md
MASTER.md
AGENTS.md
docs/
prompts/
src/
prisma/
docker/
.github/
package.json
.env.example
```

---

# Cleanup Requirements

Remove:

- unused files
- unused imports
- unused variables
- debug logs
- temporary comments
- placeholder TODOs that block V1
- dead code

---

# Documentation Requirements

Verify:

- README is accurate
- .env.example is complete
- Docker instructions work
- AI setup instructions are clear
- Task documentation is complete
- Release checklist exists

---

# Functional Validation

Manually test:

- Daily Log CRUD
- Dashboard summary
- AI Review generation
- Tomorrow Planner generation
- Knowledge creation
- Knowledge extraction
- Global Search
- Markdown Export
- Settings status
- Prompt status

---

# Docker Validation

Run:

```bash
docker compose down
docker compose up --build
```

Confirm:

- app starts
- database starts
- migrations work
- main pages load
- AI APIs fail gracefully if key is missing
- AI APIs work if key is configured

---

# Quality Gates

The following commands must pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose build
```

---

# Release Preparation

Prepare version:

```text
v1.0.0
```

Create Git tag after validation:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

# Do NOT

Do NOT:

- add new features
- redesign UI
- change database schema unless fixing blocking issues
- add authentication
- add external integrations
- rewrite architecture

---

# Acceptance Criteria

- All V1 features work
- Docker startup works
- GitHub CI passes
- README is accurate
- No secrets are committed
- No blocking TODO remains
- Codebase follows architecture docs
- Release checklist is complete
- Project is ready for GitHub release

---

# Definition of Done

Task is complete when:

- All quality gates pass
- Manual validation is complete
- Release checklist is checked
- Git tag v1.0.0 is created
- Repository is ready for future V2 development
