# 08_PROMPT_DESIGN.md

Version: V1.0  
System: HR Daily AI

---

# 1. Purpose

This document defines the standardized prompt design system for all AI features in HR Daily AI V1.

All prompts MUST:

- Be externalized in `/prompts`
- Follow strict structure
- Produce JSON-only output
- Be deterministic as much as possible
- Avoid ambiguity

---

# 2. Prompt System Rules

## 2.1 Location Rule

All prompts must be stored in:

```text
/prompts/
```

## 2.2 Prompt Format Rule

Each prompt file MUST include:

- Role definition
- Input schema
- Output schema
- Constraints
- Version marker
- Example (optional but recommended)

## 2.3 Output Rule

ALL prompts MUST enforce:

- JSON-only output
- No explanations
- No markdown
- No natural language outside JSON

---

# 3. Global Prompt Template

All prompts MUST follow this structure:

```text
# version: 1.0

You are a professional HR analytics AI.

Task:
{{TASK_DESCRIPTION}}

Input:
{{INPUT_DATA}}

Constraints:
- Only use provided data
- Do not hallucinate missing values
- Output MUST be valid JSON

Output Schema:
{{SCHEMA}}

Return ONLY JSON.
```

---

# 4. Prompt: Daily Review

File:

```text
/prompts/review.md
```

## 4.1 Purpose

Analyze daily recruiting performance.

## 4.2 Input

- RecruitLog JSON
- Optional last 7 days RecruitLog JSON

## 4.3 Output Schema

```json
{
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "score": 0
}
```

## 4.4 Prompt

```text
# version: 1.0

You are an HR performance analysis assistant.

Analyze the following daily recruiting log:

{{INPUT}}

Rules:
- Base analysis ONLY on provided data
- Do NOT invent missing metrics
- Do NOT add external knowledge
- Score must be between 0 and 100
- Be concise and structured
- Return arrays for strengths, weaknesses, and suggestions

Return ONLY valid JSON:

{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions": [],
  "score": 0
}
```

---

# 5. Prompt: Tomorrow Planner

File:

```text
/prompts/planner.md
```

## 5.1 Purpose

Generate structured next-day plan.

## 5.2 Input

- RecruitLog
- DailyReview
- Optional historical RecruitLogs

## 5.3 Output Schema

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

## 5.4 Prompt

```text
# version: 1.0

You are an HR planning assistant.

Based on today's recruiting performance and analysis:

{{INPUT}}

Generate a realistic plan for tomorrow.

Rules:
- Do not over-schedule
- Prioritize weak areas
- Must be actionable
- Must match recruiter workflow reality
- Use only LOW, MEDIUM, or HIGH for priority
- Use only morning, afternoon, or evening for schedule time
- Include schedule, priorityTasks, goals, risks, expectedOutcomes, and priority

Return ONLY valid JSON:

{
  "date": "",
  "schedule": [],
  "priorityTasks": [],
  "goals": [],
  "risks": [],
  "expectedOutcomes": [],
  "priority": "MEDIUM"
}
```

---

# 6. Prompt: Knowledge Extractor

File:

```text
/prompts/knowledge.md
```

## 6.1 Purpose

Extract reusable HR knowledge.

## 6.2 Input

- RecruitLog
- DailyReview
- Optional DailyPlan

## 6.3 Output Schema

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

## 6.4 Prompt

```text
# version: 1.0

You are an HR knowledge extraction assistant.

Extract reusable knowledge from the following data:

{{INPUT}}

Rules:
- Only extract useful reusable insights
- No duplication
- Must be actionable
- Must be concise
- Only use EXPERIENCE, TEMPLATE, POSITION, or NOTE as type
- Return an empty items array if no reusable knowledge exists

Return ONLY valid JSON:

{
  "items": []
}
```

---

# 7. Prompt Quality Rules

## 7.1 Anti-Hallucination Rule

Prompts must explicitly forbid:

- guessing missing values
- adding external knowledge
- fabricating metrics
- inventing interviews, offers, entries, or resume counts

## 7.2 Determinism Rule

Given same input:

- output should be stable
- randomness must be minimized
- no creative variation allowed

## 7.3 Structure Rule

All outputs:

- MUST be JSON
- MUST match schema
- MUST be parseable
- MUST contain no markdown
- MUST contain no prose outside the JSON object

---

# 8. Prompt Versioning

Each prompt file MUST support:

- version comment at top
- backward compatibility consideration

Example:

```text
# version: 1.0
```

Prompt version must be stored in AI-generated database records as `promptVersion`.

---

# 9. Performance Considerations

- Prompts must be short and precise
- Avoid unnecessary context
- Reduce token usage
- Avoid long explanations in prompt

---

# 10. Out of Scope (V1)

- Prompt chaining frameworks (LangChain, etc.)
- Multi-agent prompt orchestration
- Self-reflective prompting loops
- Prompt fine-tuning systems
- Dynamic prompt generation systems

---

# 11. Summary

This system ensures:

- predictable AI behavior
- structured output
- low hallucination risk
- maintainable prompt system
- Codex-friendly implementation
