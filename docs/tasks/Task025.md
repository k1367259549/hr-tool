# Task025 - Config Center

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a centralized configuration system.

After this task, app configuration, AI configuration, environment configuration, and feature flags must be managed from a single consistent layer.

---

# Context

Task024 created the AI Provider abstraction.

Task025 improves maintainability by preventing scattered configuration logic across the codebase.

---

# Requirements

Create:

- App config
- Environment config
- AI config
- Feature flag config
- Config validation utility

---

# Files To Create or Modify

```text
src/config/app.config.ts
src/config/env.config.ts
src/config/ai.config.ts
src/config/features.config.ts
src/utils/configValidation.ts
src/types/config.ts
```

---

# App Config

Must include:

- appName
- appVersion
- environment

---

# Environment Config

Must safely expose:

- DATABASE_URL
- OPENAI_API_KEY
- NODE_ENV

Rules:

- Secrets must never be exposed to frontend
- Missing required env variables must produce clear errors

---

# AI Config

Must include:

- defaultProvider
- defaultModel
- defaultTemperature
- defaultMaxTokens
- timeoutMs
- maxRetries

---

# Feature Flags

Create feature flags for:

- enableAIReview
- enablePlanner
- enableKnowledgeExtraction
- enableMarkdownExport
- enableGlobalSearch

Default: all enabled.

---

# Validation Rules

Config validation must check:

- DATABASE_URL exists
- OPENAI_API_KEY exists when AI features are enabled
- defaultProvider is supported
- temperature is within valid range
- maxRetries is non-negative

---

# Do NOT

Do NOT:

- create editable settings UI
- store configuration in database
- expose secrets to frontend
- modify business logic beyond importing config
- add authentication

---

# Acceptance Criteria

- All config is centralized
- AI system reads from config layer
- Feature flags exist
- Invalid config produces clear errors
- Secrets are not exposed to client-side code
- No duplicated config constants remain
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `docker compose up --build`

all succeed.
