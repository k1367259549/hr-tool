# 28_CANDIDATE_CRM_FOUNDATION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Milestone: MILESTONE-03 - Candidate CRM Foundation

---

## 1. Purpose

Candidate CRM Foundation introduces the first person-level Candidate Library for V2.

The goal is to let recruiters manually maintain candidate profiles, contact context, ownership, tags, notes, source channels, and long-term talent pool usage.

This milestone does not automate recruiting decisions. It does not create Pipeline, Interview, Offer, Feishu sync, scoring, ranking, or automatic resume-to-candidate conversion.

---

## 2. Architecture Boundary

Candidate CRM follows the existing layered architecture:

```text
UI
  -> API Route
  -> Candidate Service
  -> Candidate Repository
  -> Prisma
  -> PostgreSQL
```

UI components do not access Prisma directly. API routes validate input and delegate business behavior to the service layer.

Candidate CRM is a business data module, not an AI decision module. It may later provide operational data to Decision Support workflows, but this milestone does not create Learning Assets.

---

## 3. Candidate Model

The Candidate model represents a person-level recruiting profile.

Core fields:

- `fullName`
- `email`
- `phone`
- `currentCompany`
- `currentTitle`
- `targetRoles`
- `sourceChannel`
- `owner`
- `tags`
- `notes`
- `status`
- `latestActivityAt`
- `archivedAt`
- timestamps

`CandidateStatus` values:

```text
ACTIVE
TALENT_POOL
ARCHIVED
```

`CandidateStatus` is not a Pipeline stage. It only describes whether the person-level profile is active, in the long-term talent pool, or archived from default operational views.

---

## 4. Candidate And Resume Relationship

Candidate and Resume remain separate domain objects.

Rules:

- A Candidate can exist without any Resume.
- A Candidate can be linked to multiple Resume records.
- A CandidateResume can exist without a Candidate.
- `CandidateResume.candidateId` is nullable.
- The CandidateResume-to-Candidate foreign key uses `ON DELETE SET NULL`.
- Existing CandidateResume records remain valid after the migration.
- No automatic resume-to-candidate creation is implemented.
- No automatic resume-to-candidate linking is implemented.

This preserves the Resume Library as an intake and evidence source while allowing recruiters to curate person-level Candidate profiles manually.

---

## 5. Soft Archive

Candidate deletion is implemented as soft archive.

Behavior:

- `DELETE /api/candidates/[id]` sets status to `ARCHIVED`.
- `archivedAt` records the archive time.
- Archived Candidates are excluded from the default list.
- Archived Candidates can be restored through `POST /api/candidates/[id]/restore`.
- Physical deletion is not implemented.

This keeps historical references and audit records intact.

---

## 6. Audit Model

Candidate changes create audit records.

`CandidateAuditAction` values:

```text
CREATED
UPDATED
ARCHIVED
RESTORED
```

Each audit record stores:

- Candidate reference
- action
- actor
- before value when applicable
- after value when applicable
- optional note
- created time

Candidate writes and CandidateAudit writes are executed in the same Prisma interactive transaction for create, update, archive, and restore. If the audit write fails, the Candidate write is rolled back with the transaction.

Audit value rules:

- `CREATED` audit may store the created business fields for this controlled internal beta.
- `UPDATED` audit stores only fields that actually changed.
- email, phone, and notes are only copied into an `UPDATED` audit when that specific field changed.
- owner-only or status-only changes do not repeat unrelated contact or notes fields.
- `ARCHIVED` and `RESTORED` audit only store `status`, `archivedAt`, and `latestActivityAt`.
- audit values must not include original resume binaries, parsed resume text, secrets, internal Prisma metadata, or full request bodies.

The current actor is recorded as recruiter-controlled system context. This milestone does not implement authentication or multi-user permission attribution.

Current beta limitations remain: no authentication, no multi-user permission model, no data retention policy, and no hard-delete or data erasure policy.

---

## 7. API Surface

Implemented API routes:

```text
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/[id]
PATCH  /api/candidates/[id]
DELETE /api/candidates/[id]
POST   /api/candidates/[id]/restore
```

Supported behavior:

- query and pagination
- search
- status, source, and owner filters
- create
- update
- soft archive
- restore
- standard success and error responses
- default exclusion of archived Candidates
- no-op PATCH returns the current Candidate without updating `latestActivityAt`, `updatedAt`, or creating `UPDATED` audit

Unsupported behavior:

- physical delete
- bulk import
- automatic resume linking
- Feishu contact sync
- Pipeline, Interview, or Offer state changes

---

## 8. UI Surface

Implemented routes:

```text
/feishu/candidates
/feishu/candidates/new
/feishu/candidates/[id]
```

The Candidate CRM UI supports:

- dynamic metrics
- search
- status, source, and owner filters
- pagination
- Candidate creation
- Candidate detail and editing
- archive and restore
- Resume count
- audit timeline

Contact information is masked on the list page. The detail page shows full contact fields and clearly warns that this beta does not yet include multi-user permission controls.

---

## 9. Validation And Privacy

Validation rules:

- `fullName` is required on create.
- email is normalized and validated.
- text fields are trimmed and bounded.
- tags and target roles are normalized and deduplicated.
- unsupported fields are rejected.
- ordinary create/update cannot set `ARCHIVED`; archive must use the archive endpoint.

Privacy rules:

- API secrets are not involved.
- Real candidate resumes or personal data must not be committed.
- Candidate list UI masks contact fields.
- Logs and errors should avoid exposing sensitive contact details.
- Audit records may contain changed email, phone, or notes values when those fields are intentionally created or edited in this internal beta. Later versions need explicit retention, access control, and deletion policies.

---

## 10. Legacy Fixes Included

This milestone also closes earlier review blockers:

- Reviewed Job Profile lists only include `reviewedAt != null`.
- Candidate Understanding rejects unreviewed Job Profiles when fetching by ID.
- Resume upload boundary tests cover exact 10MB acceptance, larger-than-10MB rejection, TXT/PDF/DOCX support, uppercase extension support, and unsupported type rejection.

---

## 11. Explicit Non-Goals

This milestone does not implement:

- Feishu API integration
- automatic Candidate creation from Resume
- automatic Candidate-Resume linking
- Pipeline
- Interview
- Offer
- scoring
- ranking
- hire recommendation
- reject recommendation
- authentication
- multi-tenancy
- Learning Assets

---

## 12. Future Extension Points

Future milestones may add:

- explicit recruiter-reviewed resume linking
- source import workflows
- Candidate timeline expansion
- Pipeline records per Job Profile
- Interview and Offer records
- Feishu sync through backend provider boundaries
- role-based permission controls
- Decision Support summaries based on reviewed Candidate data

Any future extension must preserve Candidate and Resume separation and must not bypass human review.
