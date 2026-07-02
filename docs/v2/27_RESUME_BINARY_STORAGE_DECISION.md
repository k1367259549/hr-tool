# 27_RESUME_BINARY_STORAGE_DECISION.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Decision: Resume Binary Storage For v0.1

---

## 1. Purpose

This document records the v0.1 decision for storing original resume files.

It is an implementation boundary document only. It does not introduce object storage, Feishu Drive integration, new upload workflows, Candidate CRM, Pipeline, Offer, or any V1 behavior change.

---

## 2. Current Decision

AI Recruiter v0.1 stores original resume binaries in PostgreSQL through:

```prisma
CandidateResume.originalFile Bytes
```

This means uploaded PDF, DOCX, and TXT resumes are persisted in a PostgreSQL `BYTEA` field.

The decision is intentional for v0.1 because:

- PostgreSQL is the only persistent dependency in the current Docker deployment.
- Local development stays simple and reproducible.
- Docker startup does not require S3, OSS, COS, Feishu Drive, or a private object storage service.
- Resume metadata, parsed text, and original file persistence can remain transactionally consistent for the small v0.1 usage scope.
- The product is intended for small-scale internship usage before production storage requirements are known.

---

## 3. Current Boundaries

Supported resume file types:

- PDF
- DOCX
- TXT

Current file size limit:

```text
10MB
```

The limit is centralized in:

```text
src/config/resume.config.ts
```

Both frontend upload validation and backend parsing validation must use the same centralized constants instead of hardcoding separate limits.

v0.1 does not support:

- video resumes
- image-only attachments
- compressed archives
- large portfolio packages
- public file download URLs
- object storage migration
- Feishu Drive synchronization

---

## 4. Privacy And Security Rules

Resume files contain candidate personal data.

The application must preserve these rules:

- Do not write original file content to logs.
- Do not write parsed full resume text to routine application logs.
- Do not expose original files through unauthorized public URLs.
- Do not expose files or candidate personal data to frontend routes that are not explicitly designed for recruiter review.
- Do not include API keys, provider secrets, or candidate files in committed fixtures.
- Keep `.env` out of Git.

Future production usage must define retention, deletion, access control, and audit policies before broader rollout.

---

## 5. Known Risks

Using PostgreSQL as the binary store has clear limits:

- Database size may grow quickly as resume volume increases.
- Backup and restore time may increase.
- Large files may increase database I/O pressure.
- Database storage is not ideal for long-term large-scale file archival.
- File retention and deletion requirements become part of database lifecycle management.
- Candidate privacy data requires stricter access control, retention windows, and audit rules before production usage.

These risks are acceptable only for the v0.1 small-scale usage boundary.

---

## 6. Future Migration Direction

When the product moves beyond v0.1 small-scale usage, resume storage should migrate toward:

```text
PostgreSQL metadata
+
S3 / Alibaba Cloud OSS / Tencent Cloud COS / private object storage
```

The database should keep metadata such as:

- storage provider
- object key
- checksum
- MIME type
- file size
- encryption metadata
- retention status
- upload source
- access audit reference

The original binary should move to the selected object storage provider.

---

## 7. Migration Triggers

Revisit this decision when any of the following conditions appear:

- multiple recruiters or formal production usage begins
- resume count or database size grows noticeably
- independent file backup or lifecycle management is required
- access audit requirements become stricter
- retention and deletion policies must be enforced by file object
- deployment moves to a formal production environment
- Feishu Drive, S3, OSS, COS, or private object storage becomes an approved dependency

---

## 8. Current Review Status

For PR #1 final review, the v0.1 decision is:

- keep PostgreSQL `BYTEA`
- keep the 10MB upload limit
- keep PDF/DOCX/TXT only
- keep files private to backend-controlled workflows
- do not introduce object storage in this task
