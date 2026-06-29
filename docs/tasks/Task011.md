# Task011 - AI Provider and Prompt Loader

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create the backend AI foundation.

After this task, the system must be able to call OpenAI from the backend and load prompt files from `/prompts`.

---

# Context

Task010 completed the Dashboard page.

Task011 prepares the AI infrastructure for AI Review, Tomorrow Planner, and Knowledge extraction.

No AI feature UI should be implemented in this task.

---

# Requirements

Create:

- OpenAI provider
- AI service wrapper
- Prompt loader
- JSON parser
- AI error handling utilities

---

# Files To Create

```text
src/ai/provider/openai.ts
src/ai/ai.service.ts
src/ai/parser/jsonParser.ts
src/ai/prompts/promptLoader.ts
src/types/ai.ts
prompts/review.md
prompts/planner.md
prompts/knowledge.md
```

---

# Environment Variables

Use:

```env
OPENAI_API_KEY=
```

Rules:

- Never expose API key to frontend
- Never log API key
- Throw clear error if key is missing

---

# OpenAI Provider Requirements

The provider must support:

```ts
generateText(input: {
  prompt: string;
  model?: string;
  temperature?: number;
}): Promise<string>
```

---

# Prompt Loader Requirements

The loader must:

- Read prompt files from `/prompts`
- Support replacing variables such as `{{INPUT}}`
- Throw readable error if prompt file is missing

---

# JSON Parser Requirements

The parser must:

- Parse AI output into JSON
- Reject invalid JSON
- Return typed result if possible

---

# Default Prompt Files

Create placeholder prompt files:

- `prompts/review.md`
- `prompts/planner.md`
- `prompts/knowledge.md`

Each prompt must instruct AI to return JSON only.

---

# Do NOT

Do NOT:

- implement Review API
- implement Review UI
- implement Planner API
- implement Knowledge API
- call AI from frontend
- store AI results yet

---

# Acceptance Criteria

- OpenAI provider compiles
- Prompt loader works
- JSON parser works
- Missing API key is handled
- Missing prompt file is handled
- No frontend AI calls exist
- No TypeScript errors
- No lint errors

---

# Definition of Done

Task is complete when:

- `npm run build`
- `npm run lint`
- `npm run typecheck`

all succeed.
