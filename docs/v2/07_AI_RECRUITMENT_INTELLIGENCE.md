# 07_AI_RECRUITMENT_INTELLIGENCE.md

Version: V2.0 Draft
System: hr-tool V2 / Feishu Recruiting Workspace
Task: TASK-006 - AI Recruitment Intelligence Architecture

---

## 1. Purpose

This document defines the AI Recruitment Intelligence Architecture for hr-tool V2.

The goal is not to build an AI chatbot. The goal is to design an AI Recruitment Intelligence Layer that assists recruiters across the full recruitment lifecycle, accumulates organizational recruiting knowledge, and supports data-driven decision making.

This is an architecture and documentation task only. It does not implement code, create database tables, define APIs, define prompts, connect Feishu, define scoring standards, or modify V1.

This design reuses:

- `docs/v2/04_RECRUITMENT_DOMAIN_MODEL.md`
- `docs/v2/05_RECRUITMENT_WORKFLOW.md`
- `docs/v2/06_RESUME_CANDIDATE_DATA_MODEL.md`
- existing V1 layered architecture
- existing V1 AI rules: backend-only AI calls, prompt files, JSON outputs, schema validation, auditability

---

## 2. Architecture Position

The AI Recruitment Intelligence Layer sits beside the business service layer. It does not replace the business layer.

```text
----------------------+
| UI / V2 Workspace   |
+----------------------+
          |
          v
+----------------------+
| API Routes           |
+----------------------+
          |
          v
+----------------------+
| V2 Service Layer     |
+----------------------+
          |
          +--------------------------+
          |                          |
          v                          v
+----------------------+    +-----------------------------+
| Repository Layer     |    | AI Intelligence Layer        |
+----------------------+    +-----------------------------+
          |                          |
          v                          v
+----------------------+    +-----------------------------+
| PostgreSQL / Prisma  |    | Provider / Prompt / Parser  |
+----------------------+    +-----------------------------+
```

Rules:

- Business services own workflow decisions.
- AI modules generate suggestions, summaries, structured extraction, and intelligence.
- AI outputs must be reviewed, validated, and auditable.
- AI modules must be model-independent.
- AI must not define hiring truth or final decisions.

---

## 3. Design Principles

### 3.1 Assist, Do Not Replace

AI assists recruiters with analysis, extraction, summarization, and question generation. Recruiters remain responsible for decisions.

### 3.2 Model Independence

The architecture must support multiple model families without changing business logic:

- GPT-class providers
- Claude-class providers
- Gemini-class providers
- Qwen-class providers
- DeepSeek-class providers
- private LLM providers
- OpenAI-compatible relay providers

No business service may depend on provider-specific SDK objects.

### 3.3 Structured Outputs

AI outputs must be structured, parseable, schema validated, and safe to audit.

### 3.4 Prompt Versioning

Prompts are versioned assets. Historical AI outputs must remain traceable to the prompt version used when they were generated.

### 3.5 Explainability

Every AI output should include:

- why the output was produced
- evidence used
- confidence signal
- missing evidence
- risks
- future improvement notes when applicable

### 3.6 Auditability

Every AI action should preserve enough metadata for future review:

- feature or module
- provider
- model
- prompt file
- prompt version
- input hash
- output schema version
- token usage if available
- latency if available
- success or failure
- reviewer decision when applicable

### 3.7 No Hidden Scoring Rules

This architecture may define score placeholders and classification placeholders, but it must not define scoring standards, score thresholds, classification thresholds, or pass/fail rules.

---

## 4. AI Responsibility Map

### 4.1 Job Profile

Purpose:

- normalize hiring context
- extract responsibilities and requirements from recruiter-provided text
- identify missing Job Profile information

Inputs:

- job title
- job description
- responsibilities
- required and preferred qualifications
- department, location, seniority, headcount, priority

Outputs:

- structured Job Profile draft
- missing information list
- recruiter-facing role summary

Recruiter interaction:

- recruiter reviews and edits the draft
- recruiter confirms the Job Profile before it is used for evaluation

Constraints:

- AI must not invent requirements
- AI must not define scoring criteria
- Job Profile remains the domain anchor

### 4.2 Evaluation Template

Purpose:

- assist with creating reusable evaluation structure
- identify missing template sections
- connect a template to expected structured output

Inputs:

- Job Profile
- reusable template drafts
- recruiter notes
- historical template metadata if available

Outputs:

- template draft suggestions
- completeness warnings
- schema compatibility notes

Recruiter interaction:

- recruiter activates or edits template versions
- recruiter decides whether a template is reusable for a Job Profile

Constraints:

- template is empty by default
- no scoring criteria are defined here
- template version must be recorded by Evaluation Results

### 4.3 Resume Parsing

Purpose:

- convert original resume content into structured Parsed Resume data

Inputs:

- original resume file metadata
- extracted resume text
- source metadata

Outputs:

- parsed candidate identity signals
- contact signals
- work history
- education
- projects
- skills
- certifications
- parsing confidence signal
- parsing warnings

Recruiter interaction:

- recruiter reviews uncertain parsed fields
- recruiter corrects parsing errors

Constraints:

- AI must not invent missing resume facts
- raw resume text should not be logged
- sensitive data must be handled carefully

### 4.4 Resume Structure-Aware Chunking

Purpose:

- preserve original document sections for display, evaluation, and evidence tracing

Inputs:

- original resume text
- parsed resume sections
- file layout hints if available

Outputs:

- section chunks
- section type
- section title
- order
- source location if available
- extraction confidence

Recruiter interaction:

- recruiter can inspect source sections used by AI
- recruiter can correct section boundaries later

Constraints:

- chunking is not ranking
- chunking must preserve evidence traceability

### 4.5 Resume Semantic Chunking

Purpose:

- group resume evidence by meaning instead of document layout

Inputs:

- Parsed Resume
- structure-aware chunks
- Job Profile context when needed

Outputs:

- semantic topics
- evidence snippets
- source chunk references
- confidence signals

Recruiter interaction:

- recruiter can use semantic chunks to inspect why an evaluation mentioned a topic

Constraints:

- no vector database is required by this architecture task
- semantic chunks must reference source evidence

### 4.6 Candidate Evaluation

Purpose:

- evaluate a Resume, Parsed Resume, Candidate, Phone Screen, or Interview in a specific context

Inputs:

- Job Profile
- Evaluation Template version
- evaluated object
- relevant chunks
- previous Evaluation Results when appropriate

Outputs:

- Evaluation Result
- summary
- strengths
- weaknesses
- risks
- missing evidence
- score placeholder
- classification placeholder
- suggested questions
- explainability fields

Recruiter interaction:

- recruiter reviews, accepts, corrects, or overrides AI output
- recruiter notes why an AI judgment was useful or wrong

Constraints:

- no score standards or thresholds
- historical results must remain tied to prompt and template versions
- AI output must be schema validated

### 4.7 Strength / Weakness Analysis

Purpose:

- identify evidence-backed strengths and weaknesses in a context

Inputs:

- Evaluation Result input package
- Job Profile context
- resume chunks and interview evidence

Outputs:

- strengths with evidence
- weaknesses with evidence
- missing evidence list

Recruiter interaction:

- recruiter verifies whether evidence is meaningful
- recruiter can add manual notes

Constraints:

- AI must separate observed evidence from inference
- weak evidence must be labeled as low confidence

### 4.8 Risk Detection

Purpose:

- surface potential recruiting risks for review

Inputs:

- resume evidence
- Candidate notes
- Phone Screen notes
- Interview notes
- Offer context when available

Outputs:

- risk list
- risk evidence
- uncertainty notes
- recommended follow-up questions

Recruiter interaction:

- recruiter validates whether a risk is real
- recruiter decides whether and how to follow up

Constraints:

- risks are suggestions, not rejection reasons
- sensitive or protected-class inference must be avoided

### 4.9 Phone Screen Questions

Purpose:

- generate targeted phone screen questions based on missing evidence and Job Profile context

Inputs:

- Job Profile
- Evaluation Result
- Parsed Resume
- missing evidence
- risk notes

Outputs:

- phone screen question suggestions
- reason for each question
- evidence gap addressed by each question

Recruiter interaction:

- recruiter selects, edits, or discards questions

Constraints:

- questions must be job-related
- questions must not ask for sensitive protected information

### 4.10 Interview Questions

Purpose:

- generate interview questions for structured candidate evaluation

Inputs:

- Job Profile
- Evaluation Template version
- Evaluation Result
- prior Phone Screen summary
- missing evidence

Outputs:

- interview question suggestions
- evidence target for each question
- suggested interview focus areas

Recruiter interaction:

- recruiter edits questions before use
- interviewer feedback remains human-authored unless summarized later

Constraints:

- AI must not invent interview feedback
- AI-generated questions are recommendations only

### 4.11 Recruitment Analytics

Purpose:

- analyze recruiting operations, funnel health, and bottlenecks

Inputs:

- RecruitLog
- Dashboard KPI data
- Pipeline history
- Candidate Library
- Evaluation Results
- source/channel metadata

Outputs:

- bottleneck summaries
- channel analysis
- trend summaries
- process health observations
- report drafts

Recruiter interaction:

- recruiter reviews reports
- recruiter marks insights useful, wrong, or incomplete

Constraints:

- analytics must be grounded in available data
- missing data must be explicitly reported

### 4.12 Talent Map

Purpose:

- summarize talent landscape around a Job Profile or talent segment

Inputs:

- Job Profile
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes

Outputs:

- talent segments
- common background patterns
- common strengths and risks
- market observations
- representative model inputs

Recruiter interaction:

- recruiter reviews segment names and observations
- recruiter can correct or merge segments

Constraints:

- Talent Map does not rank candidates by hidden thresholds
- output must remain explainable and evidence-backed

### 4.13 Representative Candidate Models

Purpose:

- synthesize non-person profiles from accumulated recruiting evidence

Inputs:

- Job Profile
- Talent Map
- Candidate Library
- Resume Library
- Evaluation Results
- Pipeline outcomes

Outputs:

- representative candidate profile versions
- common evidence patterns
- typical strengths
- typical weaknesses
- typical risks
- category explanations

Recruiter interaction:

- recruiter approves or rejects generated model versions
- recruiter can annotate quality issues

Constraints:

- models are not real people
- labels such as Excellent, Good, Average, and Reject are category names only
- no thresholds are defined

### 4.14 Knowledge Accumulation

Purpose:

- capture reusable recruiting knowledge from daily work and V2 workflows

Inputs:

- Evaluation Results
- recruiter corrections
- Phone Screen notes
- Interview notes
- Offer outcomes
- Pipeline bottlenecks
- Talent Map summaries

Outputs:

- knowledge entries
- reusable question patterns
- risk patterns
- hiring process lessons
- prompt/model improvement notes

Recruiter interaction:

- recruiter confirms whether knowledge is reusable
- recruiter edits or rejects generated knowledge

Constraints:

- generated knowledge must preserve source references
- private personal information must not be unnecessarily copied

---

## 5. Prompt Architecture

This section defines prompt architecture, not prompt content.

```text
Prompt Definition
  -> Prompt Version
  -> Input Builder
  -> Model Provider
  -> Structured Output
  -> Schema Validation
  -> Audit Record
  -> Human Review
```

### 5.1 Prompt Definition

A prompt definition is a named task asset stored outside business logic.

Rules:

- prompts live under `/prompts`
- prompt content is not embedded in UI or services
- prompt name and purpose are stable
- prompt content may evolve through versions

### 5.2 Prompt Version

Prompt version identifies the exact prompt behavior used for an AI output.

Historical AI outputs must record:

- prompt file
- prompt version
- input builder version
- output schema version

### 5.3 Input Builder

Input Builder constructs structured model input from domain objects.

Responsibilities:

- select relevant fields
- remove or minimize sensitive fields
- include source references
- include missing evidence markers
- respect token budgets
- produce deterministic input packages where possible

Input Builder must not:

- define hiring decisions
- hide business rules in prompt input
- insert scoring thresholds

### 5.4 Model Provider

Model Provider is an abstraction over the selected AI provider.

Responsibilities:

- accept normalized generation input
- return normalized generation result
- capture usage and latency where available
- normalize provider errors

Provider-specific SDKs must stay behind provider adapters.

### 5.5 Structured Output

AI output should be structured and feature-specific.

Examples of output categories:

- parsed resume structure
- evaluation result
- question suggestions
- candidate summary
- talent map summary
- representative model draft

### 5.6 Schema Validation

Schema validation is mandatory before persistence or workflow use.

Invalid outputs must:

- not be saved as valid parsed output
- return controlled errors
- allow retry or regeneration
- preserve failure audit data where appropriate

### 5.7 Audit

Audit must record enough metadata for future review without exposing secrets or raw sensitive content unnecessarily.

Audit should include:

- module name
- provider
- model
- prompt version
- input hash
- schema version
- success/failure
- error code
- latency
- token usage if available

---

## 6. AI Memory Boundaries

This architecture defines memory boundaries only. It does not implement memory.

### 6.1 Session Memory

Scope:

- current user interaction
- temporary UI state
- draft generation context

Use:

- help the recruiter continue a single task

Restrictions:

- not treated as long-term truth
- not used to make automatic decisions

### 6.2 Project Memory

Scope:

- current project or workspace configuration
- active Job Profiles
- active Evaluation Templates
- active prompt versions

Use:

- consistent evaluation context within the workspace

Restrictions:

- must be explicit and inspectable

### 6.3 Recruitment Memory

Scope:

- Candidate Library
- Resume Library
- Pipeline history
- Evaluation Results
- Phone Screen and Interview records
- Offer outcomes

Use:

- recruiting context and historical comparison

Restrictions:

- must be grounded in domain records
- recruiter corrections must be preserved

### 6.4 Knowledge Memory

Scope:

- reusable Knowledge Base entries
- prompt/model improvement notes
- reusable question patterns
- process lessons

Use:

- guide future reports, prompts, and workflows

Restrictions:

- knowledge must have source references
- knowledge should be reviewed before being treated as reusable

### 6.5 Historical Analysis Memory

Scope:

- aggregated recruiting trends
- channel performance history
- bottleneck patterns
- representative candidate model versions

Use:

- analytics and long-term intelligence

Restrictions:

- must separate data facts from AI interpretation
- must not create hidden scoring standards

---

## 7. Recruitment Intelligence Outputs

### 7.1 Recruitment Reports

Generated from:

- RecruitLog
- Pipeline history
- Candidate Library
- Evaluation Results
- Interview and Offer records

Output:

- summary
- key movements
- bottlenecks
- risks
- follow-up recommendations
- missing data notes

### 7.2 Talent Distribution

Generated from:

- Talent Map
- Candidate Library
- Resume Library
- Evaluation Results

Output:

- segments
- common backgrounds
- common skill patterns
- evidence coverage
- missing market information

### 7.3 Hiring Bottlenecks

Generated from:

- Pipeline stage history
- RecruitLog KPIs
- candidate aging signals
- interview/offer delays

Output:

- bottleneck stage suggestions
- evidence
- impact explanation
- suggested recruiter review actions

### 7.4 Channel Analysis

Generated from:

- source/channel metadata
- Resume Library
- Candidate Library
- Pipeline outcomes

Output:

- channel volume
- channel quality observations
- conversion observations
- data completeness warnings

### 7.5 Representative Candidate Models

Generated from:

- Job Profile
- Talent Map
- Evaluation Results
- Pipeline outcomes
- recruiter review feedback

Output:

- versioned representative profiles
- evidence patterns
- category descriptions
- confidence and missing evidence notes

### 7.6 Recruitment Trends

Generated from:

- historical RecruitLog
- pipeline history
- Candidate Library changes
- source/channel data

Output:

- trend summaries
- directional changes
- anomalies
- missing data notes

### 7.7 Interview Quality

Generated from:

- interview records
- interviewer feedback
- Evaluation Results
- candidate outcomes

Output:

- feedback completeness notes
- repeated missing evidence
- interview question quality observations
- follow-up suggestions

### 7.8 Recruiter Insights

Generated from:

- recruiter corrections
- accepted/rejected AI suggestions
- pipeline actions
- knowledge entries

Output:

- workflow improvement notes
- prompt/model improvement candidates
- recurring manual correction patterns

---

## 8. Human-In-The-Loop Standard

Every AI decision follows this lifecycle:

```text
AI Suggestion
  -> Recruiter Review
  -> Accept / Reject / Modify
  -> Feedback
  -> Audit
  -> Future Improvement
```

Why this is mandatory:

- recruiting decisions affect people
- resume data can be incomplete or misleading
- AI may hallucinate, overgeneralize, or overemphasize surface signals
- organizational hiring context changes over time
- recruiter expertise must remain visible

Review outcomes:

- accepted
- partially accepted
- modified
- rejected
- invalid
- needs regeneration

Feedback should record:

- reason
- corrected fields
- evidence issue
- model/prompt issue
- candidate outcome reference if available

---

## 9. Explainability Standard

Every AI output should include an explanation envelope appropriate to the module.

Minimum explainability fields:

- `why`: reasoning summary
- `evidence`: source records or chunks used
- `confidence`: confidence signal, not a hiring score
- `missingEvidence`: what was not available
- `risks`: potential issues needing human review
- `futureImprovement`: optional note for prompt/model/data improvement

Rules:

- evidence should reference source objects when possible
- confidence is about output reliability, not candidate quality
- missing evidence must not be silently treated as negative evidence
- risk detection must not become automatic rejection

---

## 10. Model Independence

### 10.1 Provider Boundary

Business services call AI modules through a stable interface:

```text
Business Service
  -> AI Module
  -> AI Orchestrator
  -> Provider Adapter
  -> External or Private Model
```

### 10.2 Provider Adapter Responsibilities

Provider adapters handle:

- credentials
- base URL
- model name
- request format
- response extraction
- usage metadata
- provider-specific errors

Provider adapters must not contain recruiting business logic.

### 10.3 Provider Families

The architecture should support:

- GPT providers
- Claude providers
- Gemini providers
- Qwen providers
- DeepSeek providers
- private LLM providers
- OpenAI-compatible relay providers

### 10.4 Stable Internal Contract

The internal contract should preserve:

- input text or structured messages
- model configuration
- output content
- provider metadata
- usage metadata
- latency
- normalized error

Changing a provider should not require changes to:

- Candidate Service
- Resume Service
- Evaluation Service
- Pipeline Service
- Talent Map Service
- UI components

---

## 11. Safety And Privacy Rules

AI architecture must:

- avoid logging raw resume text
- avoid logging contact information
- never log API keys
- never expose provider credentials to frontend
- avoid protected-class inference
- preserve recruiter review history
- keep raw AI output separate from validated parsed output
- minimize sensitive data in prompt inputs
- allow AI feature failure without corrupting workflow data

---

## 12. Explicit Non-Goals

This document does not:

- implement code
- create database tables
- define APIs
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- introduce autonomous hiring decisions
- choose a vector database or RAG implementation

---

## 13. Readiness For Future Work

This architecture enables future implementation of:

- AI module interfaces
- provider-independent AI orchestration
- prompt version registry
- resume parsing pipeline
- evaluation pipeline
- question generation
- talent map generation
- representative candidate generation
- recruitment intelligence reports
- human feedback loops

Future implementation must keep service-layer ownership, provider independence, structured outputs, explainability, and auditability intact.
