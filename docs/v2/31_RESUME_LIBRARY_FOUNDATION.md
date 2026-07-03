# 31_RESUME_LIBRARY_FOUNDATION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-06 - Resume Library Foundation

---

## 1. Purpose

Resume Library Foundation upgrades the historical `CandidateResume` model into an independent Resume Library record while keeping the model and table name for compatibility.

`CandidateResume` is a historical compatibility name. Its business meaning is now:

```text
Resume Library Record
```

A Resume can exist without a Candidate and without a Job Profile. Candidate Understanding can still create Resume records in the context of a reviewed Job Profile.

---

## 2. Data Model

The milestone keeps the existing `CandidateResume` table and adds:

```text
ResumeIntakeSource
CandidateResume.intakeSource
CandidateResume.contentHash
CandidateResume.jobProfileId nullable
```

Rules:

- `jobProfileId` is nullable and only represents the initial processing context.
- Resume Library uploads set `jobProfileId = null`.
- Candidate Understanding uploads still set a reviewed Job Profile ID.
- `contentHash` is SHA-256 over original file bytes.
- `contentHash` is indexed but not unique.
- Duplicate files are allowed and only produce a recruiter-visible signal.
- `CandidateInsight.resumeId @unique` remains unchanged until the future Resume x Job Profile evaluation milestone.

The Job Profile foreign key uses `ON DELETE SET NULL` so deleting an initial context does not delete a Resume.

---

## 3. Resume Intake Sources

`ResumeIntakeSource` values:

```text
RESUME_LIBRARY
CANDIDATE_UNDERSTANDING
```

`intakeSource` means which software entry created the file record.

It is separate from `candidateSource`, which means the recruiting source channel such as referral, job board, or sourcing.

---

## 4. API Surface

Implemented routes:

```text
GET   /api/resumes
POST  /api/resumes
GET   /api/resumes/[id]
PATCH /api/resumes/[id]
```

Supported behavior:

- list search, filters, and pagination
- upload PDF, DOCX, and TXT files up to 10MB
- non-AI parsing
- parsed and failed parsing states
- metadata update for `candidateSource` and `notes`
- duplicate signal by exact file hash
- safe detail response with parsed text but no original binary

The API does not implement download, delete, automatic Candidate creation, automatic Candidate linking, automatic Job Profile matching, scoring, ranking, hire recommendation, reject recommendation, Interview, Offer, Analytics, or Feishu integration.

---

## 5. UI Surface

Implemented pages:

```text
/feishu/resumes
/feishu/resumes/new
/feishu/resumes/[id]
```

The list page supports:

- search
- file type filter
- parsing status filter
- intake source filter
- linked/unlinked filter
- pagination
- Candidate association display
- initial Job Profile context display
- duplicate warning

The upload page supports independent Resume Library uploads without requiring a Job Profile.

The detail page shows:

- file metadata
- parsing status and safe parsing error
- parsed text
- chunk counts
- Candidate safe summary
- initial Job Profile safe summary
- duplicate summaries
- editable source and notes

It does not show download, delete, automatic Candidate generation, automatic matching, or AI evaluation actions.

---

## 6. Candidate Understanding Compatibility

Candidate Understanding still follows:

```text
upload file
-> parse
-> save CandidateResume
-> generate AI Candidate Understanding
```

Compatibility rules:

- Candidate Understanding must pass `jobProfileId`.
- Candidate Understanding sets `intakeSource = CANDIDATE_UNDERSTANDING`.
- Resume Library uploads set `intakeSource = RESUME_LIBRARY`.
- `saveReviewedCandidateInsight` still validates the Resume and Job Profile match.
- Independent Resume Library records do not directly enter Candidate Understanding in this milestone.

---

## 7. Candidate Link Compatibility

Manual Candidate-Resume linking still supports:

- listing unlinked Resume records
- linking one Resume to one Candidate
- unlinking without deleting Resume
- transaction-safe audit history
- safe metadata DTOs only

Available Resume queries can include both Resume Library uploads and Candidate Understanding uploads as long as they are unlinked.

---

## 8. Privacy Boundaries

List APIs and linking APIs do not return:

- `originalFile`
- `parsedText`
- full chunk arrays
- Candidate email or phone
- full Job Profile JD
- secrets

Detail APIs may return parsed text for recruiter review, but still never return original binary files.

Logs must not include parsed resume text, original files, full hashes, Candidate contact details, notes, SQL, local file paths, parser stack traces, or API keys.

Original resume binaries remain stored in PostgreSQL BYTEA for the current beta. A future milestone may move files to object storage after storage, retention, and access-control requirements are approved.

---

## 9. Explicit Non-Goals

This milestone does not implement:

- Resume x Job Profile evaluation records
- selecting an existing Resume for AI evaluation
- AI scoring or ranking
- automatic Job Profile matching
- automatic Candidate creation
- automatic Candidate linking
- automatic duplicate merge
- Resume deletion
- Resume download
- Interview
- Offer
- Analytics
- Feishu API
- authentication or multi-user permissions

---

## 10. Future Work

MILESTONE-07 should introduce an independent Resume x Job Profile evaluation result instead of continuing to treat `CandidateResume.jobProfileId` as the only evaluation ownership field.

Before wider production use, the project still needs authentication, authorization, retention, erasure, and audit PII policies for original resume files and parsed resume text.
