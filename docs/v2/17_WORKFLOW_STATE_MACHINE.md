# 17_WORKFLOW_STATE_MACHINE.md

Version: V2.0 Draft  
System: hr-tool V2 / Feishu Recruiting Workspace  
Task: TASK-009 - Workflow State Machine

---

## 1. Purpose

This document defines conceptual workflow state machines for hr-tool V2 recruitment orchestration.

It designs workflow states only. It does not implement code, define database tables, create APIs, define prompts, define scoring standards, connect Feishu, modify V1, or redesign existing modules.

---

## 2. State Machine Principles

Workflow states describe orchestration progress, not domain truth.

Rules:

- Domain modules own their business records.
- Workflow states coordinate transitions between modules.
- Human review states are first-class.
- Retry and error states must preserve source records.
- Cancelled states do not delete domain data automatically.
- AI-generated states remain Decision Support until reviewed.
- Learning Asset states require human approval before activation.

---

## 3. Common State Vocabulary

Common states used across workflows:

```text
not_started
queued
in_progress
waiting_for_ai
waiting_for_review
needs_input
retry_pending
blocked
completed
cancelled
failed
archived
```

Common review states:

```text
pending_review
approved
modified
rejected
rejected_as_invalid
needs_regeneration
```

These are conceptual states, not database enum definitions.

---

## 4. Resume Intake Workflow

Purpose:

- receive resume source material and create a Resume Library item.

Initial state:

```text
not_started
```

Intermediate states:

```text
intake_started
source_validating
source_rejected
duplicate_check_pending
duplicate_review_required
resume_record_created
ready_for_parsing
```

Completed state:

```text
intake_completed
```

Cancelled state:

```text
intake_cancelled
```

Retry state:

```text
intake_retry_pending
```

Error state:

```text
intake_failed
```

Typical flow:

```text
not_started
  -> intake_started
  -> source_validating
  -> duplicate_check_pending
  -> resume_record_created
  -> ready_for_parsing
  -> intake_completed
```

Human gates:

- duplicate review
- unsupported or incomplete source decision
- archive uploaded-by-mistake source

---

## 5. Resume Parsing Workflow

Purpose:

- transform Original Resume into Parsed Resume and chunks.

Initial state:

```text
parse_not_started
```

Intermediate states:

```text
parse_queued
text_extraction_in_progress
text_extraction_failed
ai_parse_pending
ai_parse_in_progress
ai_parse_failed
schema_validation_failed
parsed_resume_created
chunking_pending
chunking_in_progress
chunking_failed
parsing_review_required
parsing_correction_required
```

Completed state:

```text
parsing_completed
```

Cancelled state:

```text
parsing_cancelled
```

Retry state:

```text
parsing_retry_pending
```

Error state:

```text
parsing_failed
```

Typical flow:

```text
parse_not_started
  -> parse_queued
  -> text_extraction_in_progress
  -> ai_parse_pending
  -> ai_parse_in_progress
  -> parsed_resume_created
  -> chunking_pending
  -> parsing_review_required
  -> parsing_completed
```

Human gates:

- approve parsed fields
- modify parsed fields
- reject invalid parse
- decide whether to continue without semantic chunks

---

## 6. Resume Review Workflow

Purpose:

- allow recruiter review of parsed resume, duplicate signals, and readiness for evaluation.

Initial state:

```text
review_not_started
```

Intermediate states:

```text
review_pending
review_in_progress
correction_pending
duplicate_decision_pending
ready_for_evaluation
kept_in_resume_library
marked_duplicate
archived
```

Completed state:

```text
resume_review_completed
```

Cancelled state:

```text
resume_review_cancelled
```

Retry state:

```text
resume_review_retry_pending
```

Error state:

```text
resume_review_failed
```

Human gates:

- approve parse
- correct parse
- mark duplicate
- archive
- keep for future talent pool

---

## 7. Evaluation Workflow

Purpose:

- generate and review Evaluation Result for a context.

Initial state:

```text
evaluation_not_started
```

Intermediate states:

```text
prerequisite_check
missing_job_profile
missing_evaluation_template
evaluation_input_building
ai_evaluation_pending
ai_evaluation_in_progress
ai_evaluation_failed
schema_validation_failed
evaluation_result_created
evaluation_review_required
evaluation_correction_required
evaluation_regeneration_requested
evaluation_rejected_as_invalid
```

Completed state:

```text
evaluation_reviewed
```

Cancelled state:

```text
evaluation_cancelled
```

Retry state:

```text
evaluation_retry_pending
```

Error state:

```text
evaluation_failed
```

Typical flow:

```text
evaluation_not_started
  -> prerequisite_check
  -> evaluation_input_building
  -> ai_evaluation_pending
  -> evaluation_result_created
  -> evaluation_review_required
  -> evaluation_reviewed
```

Human gates:

- accept Evaluation Result
- modify Evaluation Result
- reject as invalid
- request regeneration
- add reviewer notes

---

## 8. Candidate Conversion Workflow

Purpose:

- convert or link a reviewed Resume into Candidate Library.

Initial state:

```text
conversion_not_started
```

Intermediate states:

```text
conversion_decision_pending
identity_review_required
candidate_create_pending
candidate_link_pending
duplicate_resolution_required
candidate_created
resume_linked_to_candidate
kept_in_resume_library
kept_for_future_talent_pool
archived
marked_duplicate
```

Completed state:

```text
conversion_completed
```

Cancelled state:

```text
conversion_cancelled
```

Retry state:

```text
conversion_retry_pending
```

Error state:

```text
conversion_failed
```

Human gates:

- create Candidate
- link to existing Candidate
- reject conversion
- mark duplicate
- archive
- keep in Resume Library

---

## 9. Pipeline Workflow

Purpose:

- coordinate candidate movement for a Job Profile.

Initial state:

```text
pipeline_not_started
```

Intermediate states:

```text
pipeline_entry_pending
active_in_pipeline
stage_move_requested
stage_move_review_required
stage_moved
stale_candidate_review
waiting_for_phone_screen
waiting_for_interview
waiting_for_offer
rejected_by_recruiter
moved_to_talent_pool
withdrawn
```

Completed state:

```text
pipeline_completed
```

Cancelled state:

```text
pipeline_cancelled
```

Retry state:

```text
pipeline_retry_pending
```

Error state:

```text
pipeline_failed
```

Human gates:

- pipeline entry
- AI-suggested stage movement
- rejection
- talent pool movement
- final outcome

---

## 10. Phone Screen Workflow

Purpose:

- coordinate phone screen preparation, notes, and review.

Initial state:

```text
phone_screen_not_started
```

Intermediate states:

```text
question_generation_pending
question_generation_failed
questions_review_required
questions_approved
phone_screen_scheduled
phone_screen_completed
notes_review_required
follow_up_required
optional_evaluation_pending
```

Completed state:

```text
phone_screen_reviewed
```

Cancelled state:

```text
phone_screen_cancelled
```

Retry state:

```text
phone_screen_retry_pending
```

Error state:

```text
phone_screen_failed
```

Human gates:

- edit generated questions
- approve questions before use
- review notes
- decide next step

---

## 11. Interview Workflow

Purpose:

- coordinate interview preparation, feedback, summary, and optional evaluation.

Initial state:

```text
interview_not_started
```

Intermediate states:

```text
interview_planning
question_generation_pending
question_generation_failed
questions_review_required
interview_scheduled
interview_completed
feedback_pending
feedback_review_required
summary_generation_pending
summary_review_required
optional_evaluation_pending
next_step_decision_pending
```

Completed state:

```text
interview_reviewed
```

Cancelled state:

```text
interview_cancelled
```

Retry state:

```text
interview_retry_pending
```

Error state:

```text
interview_failed
```

Human gates:

- approve or edit questions
- submit interviewer feedback
- review summary
- decide next step

---

## 12. Offer Workflow

Purpose:

- coordinate offer readiness and offer outcome.

Initial state:

```text
offer_not_started
```

Intermediate states:

```text
offer_readiness_review
offer_recommendation_review_required
offer_draft
offer_pending_approval
offer_approved_by_human
offer_sent
offer_negotiation
offer_accepted
offer_declined
offer_withdrawn
onboarding_handoff
```

Completed state:

```text
offer_completed
```

Cancelled state:

```text
offer_cancelled
```

Retry state:

```text
offer_retry_pending
```

Error state:

```text
offer_failed
```

Human gates:

- offer recommendation review
- offer approval
- offer withdrawal
- final outcome confirmation

---

## 13. Talent Map Workflow

Purpose:

- create and review Talent Map summaries.

Initial state:

```text
talent_map_not_started
```

Intermediate states:

```text
data_collection_pending
data_insufficient
talent_map_generation_pending
talent_map_generation_failed
talent_map_draft_created
talent_map_review_required
talent_map_revision_required
talent_map_approved
talent_map_rejected
```

Completed state:

```text
talent_map_published
```

Cancelled state:

```text
talent_map_cancelled
```

Retry state:

```text
talent_map_retry_pending
```

Error state:

```text
talent_map_failed
```

Human gates:

- approve segment names
- modify observations
- reject unsupported conclusions
- publish Talent Map

---

## 14. Learning Asset Workflow

Purpose:

- convert reviewed feedback and Decision Support into reusable Learning Assets.

Initial state:

```text
learning_asset_not_started
```

Intermediate states:

```text
source_evidence_collecting
learning_asset_draft_pending
learning_asset_draft_created
learning_asset_review_required
learning_asset_revision_required
learning_asset_approved
learning_asset_rejected
learning_asset_superseded
learning_asset_archived
```

Completed state:

```text
learning_asset_active
```

Cancelled state:

```text
learning_asset_cancelled
```

Retry state:

```text
learning_asset_retry_pending
```

Error state:

```text
learning_asset_failed
```

Human gates:

- approve draft
- modify draft
- reject draft
- archive active asset
- approve new version

---

## 15. Cross-Workflow State Rules

Rules:

- A workflow may wait on another workflow, but modules should not call each other directly.
- A child workflow failure should not automatically fail the parent if manual continuation is possible.
- A cancelled workflow must record why it was cancelled.
- Retried AI workflows must preserve previous failed attempts for audit.
- Completed Decision Support workflows do not imply Learning Asset activation.
- Learning Asset activation always requires human approval.

---

## 16. Explicit Non-Goals

This document does not:

- implement a state machine
- define database enums
- define APIs
- define UI components
- define prompts
- define scoring standards
- define classification thresholds
- connect Feishu
- modify V1
- automate hiring decisions
