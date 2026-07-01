# 06_RESUME_CANDIDATE_DATA_MODEL.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-005 — Resume / Candidate Data Model Design

---

## 1. Purpose

This document designs the Resume, Candidate, and Evaluation Result data model for hr-tool V2.

This is an architecture and documentation task only. It does not implement code, define database tables, create APIs, connect Feishu, define scoring standards, define classification thresholds, or modify V1.

This design is based on:

- `docs/v2/04_RECRUITMENT_DOMAIN_MODEL.md`
- `docs/v2/05_RECRUITMENT_WORKFLOW.md`
- existing V1 layered architecture
- existing V1 AI rules: backend-only AI calls, prompt files, JSON outputs, schema validation
- current V2 Feishu Recruiting Workspace direction

---

## 2. Design Principles

### 2.1 Resume And Candidate Are Separate

Resume is a document or extracted career artifact.

Candidate is a person in the recruiting system.

A Candidate may have many Resumes. A Resume may initially exist without a Candidate until identity and conversion decisions are made.

### 2.2 Evaluation Is Contextual

Evaluation Result always depends on context:

```text
Evaluation Result
  -> Job Profile
  -> Evaluation Template
  -> Template Version
  -> Evaluated Object
```

The same Resume may receive different evaluation outputs for different Job Profiles or template versions.

### 2.3 Placeholders, Not Standards

This document designs placeholders for scores, classifications, and review states.

It does not define:

- scoring standards
- score thresholds
- classification thresholds
- pass/fail criteria
- hiring decision rules

### 2.4 Human Review Loop

AI output is a draft or assistive judgment. Recruiter review, correction, acceptance, or override must be supported as a first-class workflow.

---

## 3. Resume Model

Resume represents candidate-supplied career material and its processed forms.

### 3.1 Resume Lifecycle

```text
Original Resume
  -> Parsed Resume
  -> Structure-aware Chunks
  -> Semantic Chunks
  -> Evaluation Result
  -> Conversion Decision
```

### 3.2 Original Resume

Original Resume preserves the source material.

It should support:

- original file reference or text source
- original file name
- file type
- source channel
- source owner
- upload or intake timestamp
- raw extracted text
- language if detected
- privacy status
- sensitive data handling status

Examples of source channel:

- manual upload
- pasted text
- future Feishu document
- future Feishu chat summary
- future referral source

### 3.3 Parsed Resume

Parsed Resume is normalized structured information extracted from the Original Resume.

It should support:

- candidate name if detected
- contact information if detected
- work history
- education history
- project experience
- skills
- certifications
- languages
- location signals
- seniority signals
- availability signals if present
- compensation expectation if present
- parser version
- parsing status
- parsing confidence

Parsing confidence is a signal about extraction quality, not a hiring score.

### 3.4 Parsing Status

Resume parsing should support a status lifecycle:

```text
uploaded
extracting_text
parsed
parse_failed
needs_review
reviewed
archived
```

These are workflow states only. Future implementation may rename them, but the model should preserve the idea that parsing and review are separate.

### 3.5 Structure-aware Chunks

Structure-aware chunks preserve document sections.

Examples:

- contact section
- summary section
- work experience section
- project section
- education section
- skills section
- certification section

Each structure-aware chunk should support:

- section type
- section title
- text content
- order in document
- extraction confidence
- source location if available

### 3.6 Semantic Chunks

Semantic chunks group meaning rather than document layout.

Examples:

- hiring domain experience
- technical stack evidence
- leadership evidence
- industry experience
- recruiter communication evidence
- project delivery evidence

Each semantic chunk should support:

- semantic topic
- text content
- source chunk references
- generation method
- generation version
- confidence signal

This design does not require vector storage or embeddings. It only keeps the architecture open for future semantic retrieval.

### 3.7 Source Metadata

Resume source metadata should support:

- source type
- source name
- source channel
- source URL or external reference if allowed
- uploaded by
- imported by
- intake timestamp
- consent or privacy note if needed
- data retention note if needed

### 3.8 Duplicate Detection Signals

Duplicate detection should be signal-based, not automatic truth.

Possible duplicate signals:

- same email
- same phone
- same normalized name plus same company
- same file hash
- highly similar raw text
- highly similar parsed work history
- same external source reference

Duplicate detection output should support:

- potential duplicate references
- matching signals
- confidence signal
- review status
- recruiter decision

No automatic merge rule is defined here.

---

## 4. Candidate Model

Candidate represents a person known to the recruiting workflow.

### 4.1 Candidate Identity

Candidate identity should support:

- display name
- normalized name
- identity confidence
- aliases
- current company
- current title
- location
- seniority signal
- source channel
- first seen timestamp
- latest activity timestamp

Identity confidence is a data quality signal, not a hiring score.

### 4.2 Contact Information

Contact information should support:

- email addresses
- phone numbers
- messaging handles
- LinkedIn or external profile links
- Feishu identity reference in future
- contact verification status
- preferred contact method

Sensitive contact information must be handled carefully and should not be exposed in logs.

### 4.3 Linked Resumes

Candidate may link to many Resumes.

Relationship examples:

```text
Candidate
  -> Resume v1 from upload
  -> Resume v2 from later update
  -> Resume from future Feishu source
```

Each link should support:

- primary resume flag
- source relationship
- detected identity match signal
- recruiter-confirmed link status
- linked timestamp

### 4.4 Target Job Profiles

Candidate may be considered for one or more Job Profiles.

The model should support:

- active target Job Profiles
- historical target Job Profiles
- rejected or archived target Job Profiles
- future talent pool target segments

Candidate fit should be evaluated per Job Profile through Evaluation Results. It should not be stored as one global truth.

### 4.5 Tags

Candidate tags should support flexible organization.

Examples:

- frontend
- senior
- referral
- high-touch
- needs-follow-up
- future-pool

Tags are organizational metadata, not scoring rules.

### 4.6 Notes

Candidate notes should support:

- recruiter notes
- AI-generated summaries
- manual corrections
- follow-up tasks
- source references
- timestamp
- author or system source

AI-generated notes should be distinguishable from human notes.

### 4.7 Ownership

Ownership should support:

- recruiter owner
- team owner in future
- shared ownership note
- ownership change history

This does not introduce authentication or permission rules. It only preserves the domain need.

### 4.8 Pipeline Status

Candidate pipeline status should be contextual to a Job Profile.

```text
Candidate + Job Profile
  -> Pipeline status
```

Candidate should not have only one universal status if they can be considered for multiple roles.

### 4.9 Long-term Talent Pool Usage

Candidate Library should support long-term talent pool use:

- future-fit candidates
- previously rejected for one role but useful for another
- candidates needing follow-up later
- representative candidates for Talent Map analysis
- candidates retained for market intelligence

Talent pool status should not imply current active recruitment.

---

## 5. Evaluation Result Model

Evaluation Result records an evaluation event and its output.

It may be AI-generated, recruiter-generated, or mixed.

### 5.1 Required Context

Evaluation Result should support references to:

- Job Profile
- Evaluation Template
- template version
- evaluated object

Evaluated object may be:

- Resume
- Parsed Resume
- Candidate
- Phone Screen
- Interview
- Offer readiness context

### 5.2 Core Output Structure

Evaluation Result should support:

- AI-generated summary
- score placeholder
- classification placeholder
- strengths
- weaknesses
- risks
- missing evidence
- high-score reasons
- phone screen questions
- interview questions
- reviewer notes
- created timestamp

Important:

- score placeholder does not define a score standard
- classification placeholder does not define classification thresholds
- high-score reasons explain an AI or reviewer output when present; they do not define scoring rules

### 5.3 AI Metadata

AI-generated Evaluation Results should support:

- AI provider
- AI model
- prompt file
- prompt version
- input hash
- raw output
- parsed output
- token usage if available
- latency if available
- generation timestamp

This reuses the existing V1 AI traceability concept.

### 5.4 Review Metadata

Evaluation Result should support human review:

- review status
- reviewed by
- reviewed at
- accepted or overridden
- manual correction note
- quality note
- reviewer confidence signal
- reason for override

Review status examples:

```text
pending_review
accepted
corrected
overridden
rejected_as_invalid
needs_regeneration
```

These are review workflow states, not candidate classification thresholds.

### 5.5 Feedback For Improvement

Evaluation Result should support future improvement loops:

- prompt feedback
- model feedback
- false positive note
- false negative note
- missing evidence note
- parsing issue reference
- recruiter correction summary
- candidate outcome reference

This data can later support prompt refinement, model comparison, and quality monitoring.

---

## 6. Resume Library To Candidate Library Conversion

Resume Library stores resume assets. Candidate Library stores curated person-level recruiting assets.

Conversion should be explicit.

### 6.1 Remain Only In Resume Library

A Resume should remain only in Resume Library when:

- identity is unclear
- parsing failed
- resume is incomplete
- no target Job Profile is selected
- recruiter has not reviewed it
- duplicate signals require review
- it is retained for future reference but not ready for candidate creation

### 6.2 Convert Into A Candidate

A Resume may be converted into a Candidate when:

- identity is clear enough
- recruiter confirms the person should enter Candidate Library
- parsed resume contains sufficient candidate information
- there is an active or future target Job Profile
- evaluation or manual review indicates recruiting relevance

This is a workflow decision. No scoring threshold is defined.

### 6.3 Link To Existing Candidate

A Resume should be linked to an existing Candidate when:

- duplicate detection suggests the same person
- recruiter confirms the identity match
- contact information matches
- external source reference matches
- the new Resume is an updated version

The link should preserve:

- match signals
- reviewer decision
- link timestamp
- whether it becomes the primary resume

### 6.4 Archive

A Resume may be archived when:

- it is irrelevant to current recruiting needs
- it is outdated
- it was uploaded by mistake
- it cannot be parsed and has no retained value
- retention policy requires removal or archival

Archive should be reversible in future implementation if business needs require it.

### 6.5 Mark As Duplicate

A Resume may be marked as duplicate when:

- file hash matches another resume
- text similarity is high
- contact identity matches an existing resume
- recruiter confirms duplication

Duplicate status should not automatically delete data.

### 6.6 Keep For Future Talent Pool

A Resume may be kept for future talent pool when:

- not suitable for current Job Profile
- potentially suitable for another role
- useful for Talent Map market understanding
- candidate timing is not right
- recruiter wants future follow-up

No threshold is defined for this decision.

---

## 7. Review / Sampling / Improvement Loop

AI evaluation quality must be reviewable.

### 7.1 Recruiter Sampling Review

The system should support sampling AI results for human review.

Sampling may be based on:

- random selection
- low parsing confidence
- missing evidence
- duplicate risk
- high-impact roles
- unusual AI output
- recruiter-selected samples

No sampling algorithm is defined here.

### 7.2 Manual Correction

Recruiters should be able to correct:

- parsed resume fields
- contact information
- linked Candidate
- evaluation summary
- strengths
- weaknesses
- risks
- missing evidence
- phone screen questions
- interview questions
- classification placeholder

Manual corrections should preserve original AI output for audit.

### 7.3 Feedback On AI Evaluation

Feedback should capture:

- AI output accepted
- AI output partially accepted
- AI output overridden
- AI output invalid
- reason for correction
- missing context
- hallucination report
- wrong emphasis
- useful insight

### 7.4 Evaluation Quality Notes

Quality notes can support future prompt and model improvement.

Examples:

- resume parsing missed project dates
- evaluation overemphasized keyword match
- interview questions were too generic
- missing evidence was correctly identified
- classification suggestion was not useful

### 7.5 Prompt / Model Improvement

Future improvement can use review data to:

- update prompt templates
- compare AI models
- adjust input construction
- improve parsing schemas
- improve evaluation output schemas
- detect recurring error patterns

This process should remain separate from candidate decision rules.

---

## 8. Relationship Model

### 8.1 Core Object Relationship

```text
Job Profile
  -> Evaluation Template
  -> Evaluation Result

Resume
  -> Parsed Resume
  -> Resume Chunk
  -> Evaluation Result

Candidate
  -> linked Resumes
  -> Evaluation Results
  -> Pipeline

Candidate Library
  -> Candidates
  -> Talent Map
  -> Representative Candidate Model
```

### 8.2 Detailed Relationship Diagram

```text
Job Profile
  has many Evaluation Templates
  has many Pipelines
  anchors Talent Map

Evaluation Template
  belongs to or is reusable across Job Profiles
  has many versions
  is referenced by Evaluation Results

Resume
  belongs to Resume Library
  may link to Candidate
  has one or more Parsed Resume versions
  has many Resume Chunks
  has many Evaluation Results

Parsed Resume
  belongs to Resume
  provides structured fields
  produces structure-aware chunks
  may produce semantic chunks

Resume Chunk
  belongs to Resume or Parsed Resume
  can be structure-aware or semantic
  can be used as AI prompt input

Evaluation Result
  references Job Profile
  references Evaluation Template version
  references evaluated object
  may be AI-generated or human-generated
  can feed Candidate Library decisions

Candidate
  belongs to Candidate Library
  links to one or many Resumes
  can be considered for many Job Profiles
  has Pipeline status per Job Profile
  can appear in Talent Map

Candidate Library
  contains Candidates
  receives converted Resume Library items
  supports active recruiting and long-term talent pool

Pipeline
  belongs to Job Profile
  tracks Candidate progress
  connects Phone Screen, Interview, and Offer in workflow

Talent Map
  anchors on Job Profile or talent segment
  groups Candidates
  references Resumes and Evaluation Results
  informs Representative Candidate Models

Representative Candidate Model
  generated from accumulated Candidates, Resumes, Evaluation Results, and Pipeline outcomes
  represents category patterns, not real people
```

### 8.3 Evaluation Context Diagram

```text
Job Profile
  + Evaluation Template Version
  + Resume / Candidate / Interview / Phone Screen
  + AI Provider Metadata if applicable
  -> Evaluation Result
  -> Review Loop
  -> Candidate Library / Pipeline / Talent Map
```

### 8.4 Resume To Candidate Conversion Diagram

```text
Resume Library
  -> Resume
  -> Parsed Resume
  -> Resume Chunks
  -> Evaluation Result
  -> Conversion Decision
      -> Remain in Resume Library
      -> Convert to Candidate
      -> Link to Existing Candidate
      -> Archive
      -> Mark Duplicate
      -> Keep for Future Talent Pool
```

---

## 9. Implementation Guidance

This section provides future implementation guidance without defining concrete code or tables.

### 9.1 Database Schema Guidance

Future schema design should:

- keep Resume and Candidate separate
- preserve original resume data separately from parsed data
- allow multiple parsed versions for one resume if needed
- allow multiple chunks for one resume
- allow one Candidate to link to multiple Resumes
- reference Job Profile and Evaluation Template version from Evaluation Result
- preserve AI metadata and reviewer correction metadata
- support append-friendly Evaluation Results
- support duplicate detection review state
- support future Talent Map and Representative Candidate Model versions

Do not encode scoring thresholds into schema.

### 9.2 Service Layer Boundaries

Future services may include:

- Resume Intake Service
- Resume Parsing Service
- Resume Library Service
- Candidate Service
- Candidate Library Service
- Evaluation Service
- Review Feedback Service
- Talent Map Service
- Representative Candidate Model Service

Rules:

- service layer owns business orchestration
- repository layer owns persistence only
- AI calls go through AI service
- Feishu calls go through future Feishu provider
- UI does not contain business logic

### 9.3 API Boundary Guidance

Future APIs should expose workflow actions rather than raw internal implementation details.

Potential API groups:

- resume intake
- resume parsing status
- evaluation generation
- evaluation review feedback
- candidate conversion
- candidate linking
- candidate library search
- talent map views

Rules:

- route handlers validate request shape
- route handlers call service layer
- route handlers do not call Prisma directly
- route handlers do not call AI directly
- API responses follow existing standard response format

### 9.4 Prompt Input / Output Schema Guidance

Prompt inputs should be structured and token-aware.

Resume evaluation prompt input may include:

- Job Profile summary
- Evaluation Template version
- parsed resume fields
- selected structure-aware chunks
- selected semantic chunks
- source metadata summary
- missing evidence hints

Prompt outputs may include:

- summary
- strengths
- weaknesses
- risks
- missing evidence
- high-score reasons placeholder
- phone screen questions
- interview questions
- score placeholder
- classification placeholder

Rules:

- output must be JSON
- output must be schema validated
- prompt files must live in `/prompts`
- raw AI output must not be trusted directly
- scoring standards remain undefined
- classification thresholds remain undefined

### 9.5 Privacy And Sensitive Data Handling

Resume and Candidate data may contain sensitive personal information.

Future implementation should:

- avoid logging raw resume text
- avoid logging contact information
- avoid exposing API keys or secrets
- minimize data returned to frontend views
- separate source metadata from sensitive content where practical
- support retention or archival states
- preserve auditability for AI-generated summaries and manual corrections
- treat Feishu external references as integration metadata, not public display data

### 9.6 Quality And Review Guidance

Future implementation should track:

- parsing confidence
- duplicate detection confidence
- AI evaluation review status
- recruiter corrections
- accepted or overridden AI judgment
- prompt/model quality notes

These fields support improvement loops. They must not become hidden scoring standards.

---

## 10. Explicit Non-Goals

This document does not:

- implement code
- modify database schema
- define Prisma models
- create APIs
- connect Feishu
- define scoring standards
- define classification thresholds
- modify V1
- introduce authentication
- choose an embedding or vector storage implementation

---

## 11. Readiness For Future Work

This document is intended to guide future implementation of:

- Resume data persistence
- Candidate data persistence
- Evaluation Result persistence
- resume parsing workflows
- AI resume evaluation workflows
- recruiter review workflows
- Candidate Library conversion workflows
- Talent Map workflows
- Representative Candidate Model generation

The model is intentionally structured so future implementation can proceed without redesigning the Resume/Candidate boundary.
