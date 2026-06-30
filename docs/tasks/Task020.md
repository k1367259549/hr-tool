# Task020 - Settings Page

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create a basic Settings page for system and AI configuration display.

After this task, the user must be able to view key configuration status from the UI.

---

# Context

Task019 enhanced the Dashboard.

Task020 adds a simple Settings page to improve transparency and maintainability.

V1 Settings is mostly read-only. It should not introduce complex configuration persistence.

---

# Requirements

Implement the page:

```text
/settings
```

---

# Navigation Update

Add Settings to sidebar navigation:

- Settings

---

# Page Sections

The Settings page must include:

- Application Info
- AI Configuration
- Database Status
- Environment Status
- Developer Info

---

# Application Info

Display:

- App name
- Version
- Environment

---

# AI Configuration

Display:

- AI provider
- Configured model
- API key status
- Prompt directory status

Rules:

- Never display the actual API key
- Only display whether the key is configured

---

# Database Status

Display:

- Database provider
- Connection status

---

# Environment Status

Display:

- NODE_ENV
- DATABASE_URL status
- OPENAI_API_KEY status

Rules:

- Never expose full DATABASE_URL
- Never expose secrets

---

# Files To Create or Modify

```text
src/app/settings/page.tsx
src/app/api/settings/status/route.ts
src/services/settings.service.ts
src/types/settings.ts
src/components/layout/Sidebar.tsx
```

---

# API Endpoint

## Get Settings Status

```http
GET /api/settings/status
```

Response example:

```json
{
  "success": true,
  "data": {
    "appName": "HR Daily AI",
    "version": "1.0.0",
    "environment": "development",
    "ai": {
      "provider": "OpenAI",
      "apiKeyConfigured": true
    },
    "database": {
      "provider": "PostgreSQL",
      "connected": true
    }
  },
  "error": null
}
```

---

# Do NOT

Do NOT:

- expose secrets
- create editable AI configuration
- create user accounts
- add authentication
- add billing
- add multi-user settings
- modify AI provider logic

---

# Acceptance Criteria

- Settings page loads
- Sidebar includes Settings
- API returns safe configuration status
- API does not expose secrets
- Database connection status is shown
- AI key configured status is shown
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
