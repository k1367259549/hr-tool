# Task024 - AI Provider Abstraction

Version: V1.0
Status: TODO
Estimated Time: 2~3 hours

---

# Goal

Create an AI Provider abstraction layer.

After this task, the system must support switching AI providers without changing business services.

---

# Context

Task011 created the initial OpenAI integration.

Task024 upgrades the AI layer into a provider-based architecture.

V1 only requires OpenAI implementation, but the interface must allow future providers.

---

# Requirements

Create:

- AI provider interface
- OpenAI provider implementation
- AI provider factory
- AI model configuration
- unified AI request/response types

---

# Files To Create or Modify

```text
src/ai/provider/types.ts
src/ai/provider/openai.ts
src/ai/provider/factory.ts
src/config/ai.config.ts
src/types/ai.ts
src/ai/ai.service.ts
```

---

# Provider Interface

Create a common interface:

```ts
export interface AIProvider {
  generate(input: AIGenerateInput): Promise<AIGenerateResult>;
}
```

---

# Input Type

```ts
export interface AIGenerateInput {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

---

# Output Type

```ts
export interface AIGenerateResult {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs?: number;
}
```

---

# Provider Factory

Create provider factory:

```ts
getAIProvider(providerName: string): AIProvider
```

Supported in V1:

- openai

Unsupported providers must throw clear errors.

---

# AI Config

Create:

```text
src/config/ai.config.ts
```

Must define:

- defaultProvider
- defaultModel
- defaultTemperature
- defaultMaxTokens

---

# OpenAI Provider Requirements

OpenAI provider must:

- read API key from environment variable
- never expose API key
- return unified AIGenerateResult
- include usage data when available
- include latencyMs

---

# Do NOT

Do NOT:

- implement Claude provider
- implement DeepSeek provider
- implement Qwen provider
- modify UI pages
- modify prompt files
- add streaming
- add tool calling

---

# Acceptance Criteria

- AI service uses provider abstraction
- OpenAI works through provider interface
- Business services do not import OpenAI directly
- Provider factory supports OpenAI
- Unsupported provider throws clear error
- No API key exposed
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
