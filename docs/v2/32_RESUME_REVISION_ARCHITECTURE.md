# 32_RESUME_REVISION_ARCHITECTURE.md

Version: V2.0 Draft
System: hr-tool V2 / AI Recruiter
Scope: M06 Resume Library Foundation Architecture Design

---

## 1. Background

M06 turns the historical `CandidateResume` table into an independent Resume Library record. That is enough for upload, parsing, manual Candidate linking, duplicate detection, and safe recruiter review, but it is not enough for long-term AI recruiting workflows.

A simple `ResumeVersion` model would only answer "which file version is newest." The AI Recruiter needs more than that:

- what exact content was parsed
- which parser produced the result
- which source created the change
- whether the same content has appeared before
- which downstream AI cache or evaluation was based on that exact content
- how to audit content and parsing changes without overwriting history

`ResumeRevision` is the more precise concept. It represents a single auditable revision of a Resume Library record, including source, parser, content hash, and parse status. It gives M06 a stable path toward parser snapshots, AI cache keys, and audit trails without forcing M07 evaluation semantics into the Resume Library model.

M06 keeps `CandidateResume` as the compatibility table and user-facing Resume Library identity. Future revision work should extend that foundation rather than replacing it abruptly.

---

## 2. Core Concepts

### CandidateResume

`CandidateResume` is the current compatibility table. Its business meaning in V2 is:

```text
Resume Library Record
```

It is the stable identity shown in Resume Library pages and linked to Candidate records. It may have no Candidate and no Job Profile.

### ResumeRevision

`ResumeRevision` is one auditable revision of a resume's content, parser metadata, source, and parse lifecycle.

Examples:

- initial upload
- recruiter replaces the file
- OCR reprocesses a scanned PDF
- parser version changes and regenerates parsed output
- Feishu import updates the raw source

Revisions should be append-only. A new revision records what changed without overwriting older revision history.

### ParsedSnapshot

`ParsedSnapshot` is the parsed output produced for one `ResumeRevision`.

It stores the parser result that downstream features can reference, such as parsed text, structured extracted data, and chunk metadata. This separates revision metadata from large parse payloads.

### AIAnalysis / Evaluation

AI analysis and Resume x JobProfile evaluation are future M07+ concerns. They should reference a specific resume revision or parsed snapshot when needed, but they are not implemented by this design task.

---

## 3. Recommended Data Model Draft

This is a design draft only. It is not a schema change in this task.

### ResumeRevision

```text
ResumeRevision

id              String
resumeId        String
revisionNumber  Int
contentHash     String?
source          String?
sourceFileName  String?
parserVersion   String?
parseStatus     String
createdAt       DateTime
```

Recommended relations and constraints:

```text
resumeId -> CandidateResume.id
unique(resumeId, revisionNumber)
index(resumeId)
index(contentHash)
index(createdAt)
```

Notes:

- `contentHash` should remain nullable.
- `contentHash` should not be unique.
- `source` is a free-string value such as `upload`, `feishu`, `manual`, or `api`.
- `revisionNumber` is the human-readable sequence within one Resume Library record.
- `parserVersion` identifies the parser that produced parse output.

### ParsedSnapshot

```text
ParsedSnapshot

id              String
revisionId      String
parsedText      String?
structuredData  Json?
chunkCount      Int
createdAt       DateTime
```

Recommended relations and constraints:

```text
revisionId -> ResumeRevision.id
unique(revisionId)
index(createdAt)
```

Notes:

- `ParsedSnapshot` should store parse output, not evaluation output.
- `structuredData` can hold normalized parser fields when approved.
- Chunk arrays may remain JSON or move to dedicated chunk tables later.

---

## 4. Design Principles

- Keep `CandidateResume` stable for compatibility.
- Treat revisions as append-only records.
- Never overwrite old revision content to represent a new parse or source change.
- Use `contentHash` for duplicate detection and AI cache identity.
- Keep `contentHash` nullable when text is unavailable.
- Keep `contentHash` non-unique because duplicate resumes are allowed.
- Treat `parserVersion` and `revisionNumber` as different concepts.
- Do not put Job Profile ownership into the revision body.
- Leave Resume x JobProfile evaluation to M07.

`parserVersion` answers:

```text
Which parser produced this parsed output?
```

`revisionNumber` answers:

```text
Which auditable revision of this Resume Library record is this?
```

These values may change independently.

---

## 5. Relationship With Existing Fields

### CandidateResume.contentHash

Short term:

- keep it on `CandidateResume`
- use it for current Resume Library duplicate signals
- generate it from normalized parsed resume text when available

Future:

- store canonical per-revision hash on `ResumeRevision.contentHash`
- keep `CandidateResume.contentHash` as a denormalized pointer to the latest revision hash if useful

### CandidateResume.parserVersion

Short term:

- keep it on `CandidateResume`
- record the parser used by current M06 parsing

Future:

- move parser-specific metadata to `ResumeRevision.parserVersion`
- keep `CandidateResume.parserVersion` as latest parser metadata only if DTO compatibility needs it

### CandidateResume.parsedText

Short term:

- keep it on `CandidateResume`
- continue returning it in Resume detail for recruiter review

Future:

- move parse payloads into `ParsedSnapshot.parsedText`
- keep `CandidateResume.parsedText` as a latest snapshot cache only if performance or compatibility requires it

### CandidateResume.jobProfileId nullable

Short term:

- keep it nullable
- treat it only as initial processing context for legacy Candidate Understanding compatibility

Future:

- do not move Job Profile ownership into `ResumeRevision`
- use M07 evaluation records for Resume x JobProfile relationships

---

## 6. API / UI Impact

M06 should not expose complex revision UI.

Current M06 behavior should remain:

- Resume Library list
- Resume detail
- upload
- duplicate signal
- manual Candidate linking compatibility

Future UI may add a revision timeline on Resume detail:

```text
Revision 1 - uploaded from upload - parsed by v1
Revision 2 - reprocessed by parser v2
Revision 3 - imported update from Feishu
```

Actions that should create a new revision:

- file replacement
- re-parse
- OCR extraction
- parser model or parser version rerun
- source import update

Actions that should not create a new revision:

- editing `candidateSource`
- editing recruiter notes
- linking or unlinking a Candidate
- viewing or downloading metadata

---

## 7. Non-Goals

This architecture design does not implement:

- M07 Evaluation
- AI scoring
- candidate ranking
- hire or reject recommendation
- automatic merge of duplicate resumes
- deletion of old versions
- object storage migration
- authentication
- multi-user permissions
- schema changes
- Prisma migration

---

## 8. Implementation Recommendations

TASK-063-B should only add the minimum schema foundation.

Recommended sequence:

1. Add `ResumeRevision` and `ParsedSnapshot` schema foundation.
2. Keep `CandidateResume` DTOs and current API responses compatible.
3. Let new uploads create an initial revision.
4. Do not immediately migrate all historical `CandidateResume.parsedText`.
5. Add tests proving old Resume Library and Candidate Understanding paths still work.
6. Add tests proving duplicate detection still uses the latest available content hash.
7. Add no M07 evaluation behavior in the revision foundation task.

Historical data can be backfilled later after the revision read path is stable.

---

## 9. Risks And Decisions

### Data Growth

Parsed text and structured snapshots may grow quickly. The system needs retention and storage policies before high-volume production use.

Decision:

- keep append-only semantics
- avoid deleting old revisions in the foundation
- revisit archival policy separately

### PII Compliance

Resume text contains personal data. Revision history increases the amount of retained PII.

Decision:

- define retention, erasure, and access policy before production expansion
- avoid logging parsed text or full hashes

### Parsed Text Duplication

Keeping parsed text both on `CandidateResume` and `ParsedSnapshot` may duplicate data during migration.

Decision:

- allow short-term duplication for compatibility
- treat `ParsedSnapshot` as the future source of truth
- keep `CandidateResume.parsedText` only as latest snapshot cache if needed

### Unique Resume Revision Number

Multiple revisions for one resume need stable ordering.

Decision:

- use `unique(resumeId, revisionNumber)`
- create revisions in a transaction

### contentHash Uniqueness

The same resume content can appear in multiple records or candidates.

Decision:

- index `contentHash`
- do not make `contentHash` unique
- use it for duplicate signals and cache lookup, not identity enforcement

---

## 10. Final Recommendation

Adopt the two-layer design:

```text
CandidateResume
  -> ResumeRevision
       -> ParsedSnapshot
```

This is stronger than a simple `ResumeVersion` model because it separates stable Resume Library identity, auditable content/source revision, and parser output snapshots.

That separation fits the AI HR Agent roadmap:

- duplicate detection can use revision-level content hashes
- AI cache can key off exact revision and parser output
- future M07 evaluations can reference the exact resume revision used
- audit trails can explain how resume content changed over time
- parser upgrades can create new snapshots without overwriting recruiter history

The design preserves M06 compatibility while creating a durable foundation for Resume Library, AI cache, and later evaluation workflows.
