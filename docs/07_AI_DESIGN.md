# 07_AI_DESIGN.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the complete AI system design for HR Daily AI V1.

It specifies:

- AI workflows
- Prompt architecture
- Input/output schemas
- Parsing rules
- Failure handling
- Cost and performance constraints

All AI functionality MUST follow this design.

---

# 2. AI Core Principle

AI is a backend service, not a feature inside UI.

Rules:

- UI must NOT call AI directly
- All AI calls must go through Service Layer
- All AI outputs must be structured JSON
- All AI responses must be stored in database
- All AI requests must be traceable

---

# 3. AI Modules

V1 includes three AI capabilities:

1. Daily Review Generator
2. Tomorrow Planner Generator
3. Knowledge Extractor

---

# 4. AI Architecture

```text
Service Layer
    ↓
AI Service
    ↓
Prompt Builder
    ↓
OpenAI API
    ↓
Response Parser
    ↓
Validator
    ↓
Database
```

Rules:

- API routes must never call OpenAI directly
- API routes must never build prompts
- AI Service must return parsed and validated JSON to Service Layer
- Service Layer is responsible for storing AI outputs through repositories

---

# 5. AI Provider

## 5.1 Primary Provider

- OpenAI API

## 5.2 Model Strategy

Default model:

- GPT-4.1 or latest stable model

Fallback:

- Same provider retry mechanism

---

# 6. AI Output Standard

ALL AI outputs MUST follow strict JSON format.

## 6.1 AI Service Envelope

AI Service returns a normalized internal envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "provider": "OpenAI",
    "model": "string",
    "promptFile": "string",
    "promptVersion": "string",
    "inputHash": "string",
    "timestamp": "string"
  }
}
```

## 6.2 Feature Output Rule

The `data` field MUST match the feature-specific schema.

The complete AI record MUST be stored with:

- provider
- model
- promptFile
- promptVersion
- inputHash
- rawOutput
- parsedOutput

## 6.3 Validation Rule

- JSON must be valid
- JSON must match schema before saving
- Invalid output must trigger retry or fallback
- Raw text output is not allowed for core features

---

# 7. AI Feature: Daily Review

## 7.1 Purpose

Analyze daily recruiting performance.

## 7.2 Input

- RecruitLog (single day)
- Optional: last 7 days logs

## 7.3 Prompt Structure

Stored in:

```text
/prompts/review.md
```

Prompt includes:

- role definition
- context data
- output schema requirement
- constraints

## 7.4 Output Schema

```json
{
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "score": 0
}
```

## 7.5 Rules

- Score range: 0-100
- Must be grounded in log data
- No hallucinated metrics allowed
- Must not invent interviews, offers, entries, or resume counts
- Must save both rawOutput and parsedOutput

---

# 8. AI Feature: Tomorrow Planner

## 8.1 Purpose

Generate next-day recruiting plan.

## 8.2 Input

- Today's RecruitLog
- Today's AI Review
- Optional historical logs

## 8.3 Prompt Structure

Stored in:

```text
/prompts/planner.md
```

## 8.4 Output Schema

```json
{
  "date": "string",
  "schedule": [
    {
      "time": "morning",
      "content": "string",
      "priority": "LOW"
    }
  ],
  "priorityTasks": ["string"],
  "goals": ["string"],
  "risks": ["string"],
  "expectedOutcomes": ["string"],
  "priority": "LOW"
}
```

Allowed priority values:

- LOW
- MEDIUM
- HIGH

Allowed schedule time values:

- morning
- afternoon
- evening

## 8.5 Rules

- Must be actionable
- Must not exceed realistic workload
- Must prioritize bottlenecks identified in review
- Must save both rawOutput and parsedOutput
- Must store `logId` and `reviewId` when the plan is generated from a specific log or review

---

# 9. AI Feature: Knowledge Extractor

## 9.1 Purpose

Extract reusable knowledge from logs and reviews.

## 9.2 Input

- RecruitLog
- DailyReview
- Optional DailyPlan

## 9.3 Prompt Structure

Stored in:

```text
/prompts/knowledge.md
```

## 9.4 Output Schema

```json
{
  "items": [
    {
      "title": "string",
      "content": "string",
      "type": "EXPERIENCE",
      "tags": ["string"]
    }
  ]
}
```

Allowed type values:

- EXPERIENCE
- TEMPLATE
- POSITION
- NOTE

## 9.5 Rules

- Extracted knowledge must be reusable
- Extracted knowledge must be grounded in source data
- AI-generated knowledge must store parsedOutput
- If knowledge is extracted from a review or plan, source relationship should be stored

---

# 10. Prompt Design Rules

## 10.1 Prompt Location

All prompts MUST be stored in:

```text
/prompts/
```

## 10.2 Prompt Structure

Each prompt must include:

- Role definition
- Context data format
- Output schema
- Constraints
- Version marker

## 10.3 Example Structure

```text
You are an HR analytics assistant.

Analyze the following RecruitLog:

{{input}}

Return ONLY valid JSON in this format:

{{schema}}

Do not include explanations.
```

## 10.4 Prompt Rules

- No inline prompt strings in code
- No prompt content in UI components
- Prompt templates must be loaded from Markdown files
- Prompt version must be stored with AI-generated database records

---

# 11. AI Service Layer Rules

AI calls MUST be handled in:

```text
src/ai/
```

Responsibilities:

- Load prompt Markdown files
- Construct prompts
- Call OpenAI API
- Retry on failure
- Parse JSON
- Validate schema
- Return structured result to Service Layer

---

# 12. Error Handling

## 12.1 AI Failure Modes

- Timeout
- Invalid JSON
- Empty response
- API error
- Schema validation failure

## 12.2 Handling Strategy

| Error Type | Action |
| --- | --- |
| Timeout | Retry once |
| Invalid JSON | Retry with stricter prompt |
| API error | Return controlled fallback error |
| Empty response | Retry |
| Schema validation failure | Retry with stricter prompt |

## 12.3 Fallback Rules

- AI failure must NOT block log creation
- AI failure must return a controlled error to the API layer
- UI should allow retry
- Partial AI results must not be saved as valid parsedOutput

---

# 13. Performance Constraints

- AI response target: < 10 seconds
- Max retries: 2
- Timeout: 15 seconds per request
- AI APIs must handle timeout explicitly
- Non-AI API performance targets still apply

---

# 14. Cost Control Rules

- No unnecessary AI calls
- Avoid duplicate generation
- Cache results in database
- Use existing DailyReview or DailyPlan when appropriate
- Service Layer must handle idempotency or controlled conflict errors

---

# 15. Security Rules

- API key stored in environment variables
- API key never exposed to frontend
- No logging of raw API key
- No prompt leakage to client
- No direct frontend AI provider requests

---

# 16. Out of Scope (V1)

- Multi-agent system
- LangChain / LangGraph
- RAG / vector database
- Fine-tuning
- Streaming responses
- Tool calling / function calling

---

# 17. Summary

This AI system is designed to:

- Be deterministic
- Be structured
- Be backend-controlled
- Be cheap and fast
- Be reliable for MVP use
- Preserve traceable AI outputs
