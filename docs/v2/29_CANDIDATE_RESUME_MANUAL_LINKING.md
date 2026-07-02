# 29_CANDIDATE_RESUME_MANUAL_LINKING.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-04 - Candidate-Resume Manual Linking

---

## 1. Purpose

Candidate-Resume Manual Linking lets recruiters explicitly connect existing Resume Library records to existing Candidate CRM records.

The workflow is intentionally manual:

```text
Recruiter searches available Resumes
-> Recruiter selects one Resume
-> Recruiter confirms the action
-> Backend links the Resume in a transaction
-> CandidateAudit records the action
```

This milestone does not introduce automatic matching, automatic Candidate creation, automatic linking, deduplication, transfer, Pipeline, Interview, Offer, Feishu sync, scoring, ranking, or hiring recommendations.

---

## 2. Domain Rules

The existing relationship remains:

```text
Candidate 1 -> N CandidateResume
CandidateResume 0 -> 1 Candidate
```

Rules:

- A Candidate can exist without any Resume.
- A Candidate can link to multiple Resumes.
- A CandidateResume can remain unlinked.
- A CandidateResume can link to only one Candidate at a time.
- A Resume already linked to another Candidate returns a conflict.
- Resume transfer is not implemented; recruiters must unlink first, then link again.
- Archived Candidates cannot receive new Resume links.
- Linking the same Resume to the same Candidate is idempotent and does not create duplicate audit records.
- Unlinking a Resume that is not linked to the Candidate returns a conflict.

Candidate status remains Candidate CRM status, not a Pipeline stage.

---

## 3. Architecture

The implementation follows the existing layered architecture:

```text
UI
-> API Route
-> CandidateResumeLinkService
-> Candidate / CandidateResume / CandidateAudit repositories
-> Prisma
-> PostgreSQL
```

UI components do not access Prisma. API routes validate input and delegate business rules to the service layer. Repository methods own database access only.

---

## 4. API Surface

Implemented routes:

```text
GET    /api/candidates/[id]/resumes
GET    /api/resumes/available
POST   /api/candidates/[id]/resumes
DELETE /api/candidates/[id]/resumes/[resumeId]
```

The available Resume query supports:

- filename search
- file type filter for PDF, DOCX, and TXT
- pagination
- stable ordering
- `candidateId = null` only

The API returns safe Resume metadata only:

- `id`
- `originalName`
- `fileType`
- `fileSize`
- `createdAt`
- `candidateId`
- `parsingStatus`

The API must not return:

- `originalFile`
- `parsedText`
- complete resume body
- API keys
- unrelated Candidate contact data

---

## 5. Transaction And Audit

Link and unlink writes use a Prisma interactive transaction.

For link:

```text
read Candidate
-> verify Candidate exists and is not archived
-> read Resume
-> verify Resume exists and is unlinked
-> atomically update CandidateResume where id = resumeId and candidateId IS NULL
-> create CandidateAudit RESUME_LINKED
```

For unlink:

```text
read Candidate
-> read Resume
-> verify Resume is linked to this Candidate
-> atomically update CandidateResume where id = resumeId and candidateId = current Candidate
-> create CandidateAudit RESUME_UNLINKED
```

If the audit write fails, the Resume link or unlink is rolled back by the same transaction.

The conditional update result is classified before writing audit:

- `count === 1` means the association actually changed, so audit is written.
- `count === 0` triggers a fresh Resume read.
- If the Resume is now linked to the same Candidate, link returns idempotently without audit.
- If the Resume is linked to another Candidate, missing, or otherwise changed, the service returns `NOT_FOUND` or `CONFLICT`.

This prevents concurrent requests from silently transferring a Resume or clearing a newer association.

Audit values are minimized:

```json
{
  "resumeId": "...",
  "originalName": "...",
  "fileType": "PDF"
}
```

Audit values do not include original binary files, parsed resume text, complete resume content, Candidate snapshots, email, phone, notes, request bodies, or secrets.

---

## 6. UI Surface

Candidate detail pages now include a Resume linking panel.

The panel supports:

- viewing linked Resumes
- searching unlinked Resumes
- filtering by file type
- pagination
- explicit confirm before linking
- explicit confirm before unlinking
- loading, empty, error, conflict, and archived Candidate states

Unlink confirmation states that unlinking does not delete the Resume and does not delete the Candidate.

After link or unlink, the UI refreshes:

- linked Resume list
- available Resume list
- Candidate Resume count
- Candidate audit timeline

---

## 7. Validation

Validation rules:

- link payload rejects unknown fields
- `resumeId` is trimmed and required
- page and page size must be positive integers within defined bounds
- file type accepts only PDF, DOCX, or TXT
- DTOs do not contain binary data or parsed full text

---

## 8. Test Coverage

Added coverage includes:

- validation tests
- repository safe-select, available-only, search, filter, pagination, and stable ordering tests
- service link, unlink, idempotency, conflict, archived Candidate, missing data, audit failure, and audit minimization tests
- API success, validation, not found, conflict, and safe DTO tests
- UI utility file-size formatting test
- Prisma schema safeguards for link audit actions
- a guarded real PostgreSQL rollback integration test for transaction behavior

The real PostgreSQL test is intentionally gated behind:

```text
RUN_PRISMA_INTEGRATION_TESTS=true
```

and only runs against allowed local database names.

---

## 9. Explicit Non-Goals

This milestone does not implement:

- AI automatic matching
- automatic Candidate creation from Resume
- automatic Resume linking
- Resume transfer button
- Candidate merge or deduplication
- Pipeline
- Interview
- Offer
- Feishu API integration
- authentication
- multi-user permissions
- public resume download
- scoring
- ranking
- hire recommendation
- reject recommendation
- physical deletion of Candidate or Resume

---

## 10. Current Limitations

The beta still has no authentication, authorization, multi-user permissions, retention policy, erasure policy, Feishu sync, or production-grade PII governance.

Before broader production use, the project must define who may view Candidate details, linked Resume metadata, original resume files, parsed resume text, and audit history.

Candidate-Resume link and unlink currently do not update `Candidate.latestActivityAt`. Whether resume curation counts as Candidate activity remains a product decision for a later milestone.

The link flow rejects Candidates already archived at the time of its transaction read. A concurrent archive during linking remains accepted technical debt for the current single-user beta. A future multi-user version should revisit row locking, Serializable isolation, or database-level lifecycle constraints.
