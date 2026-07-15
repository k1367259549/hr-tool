import type { ResumeEvaluationEventDto } from "@/types/resumeEvaluationResult";
import type { DetailedAnalysisReviewAction } from "@/types/resumeEvaluationRun";

const auditPrefix = "detailed-analysis-review";

export type DetailedAnalysisReviewAudit = {
  decision: DetailedAnalysisReviewAction;
  runId: string;
  becameReference: boolean;
};

export function createDetailedAnalysisReviewAuditFields(
  runId: string,
  decision: DetailedAnalysisReviewAction,
  becameReference: boolean
): string[] {
  return [
    auditPrefix,
    `runId:${runId}`,
    `decision:${decision}`,
    `reference:${becameReference ? "selected" : "not-selected"}`,
    ...(becameReference ? ["selectedRunId"] : [])
  ];
}

export function parseDetailedAnalysisReviewAudit(
  event: Pick<ResumeEvaluationEventDto, "changedFields">
): DetailedAnalysisReviewAudit | null {
  if (!event.changedFields.includes(auditPrefix)) {
    return null;
  }

  const runId = readAuditValue(event.changedFields, "runId");
  const decision = readAuditValue(event.changedFields, "decision");
  const reference = readAuditValue(event.changedFields, "reference");

  if (!runId || !isDetailedAnalysisReviewAction(decision)) {
    return null;
  }

  return {
    becameReference: reference === "selected",
    decision,
    runId
  };
}

function readAuditValue(fields: string[], name: string): string | null {
  const prefix = `${name}:`;
  const field = fields.find((value) => value.startsWith(prefix));

  return field ? field.slice(prefix.length) : null;
}

function isDetailedAnalysisReviewAction(
  value: string | null
): value is DetailedAnalysisReviewAction {
  return (
    value === "ACCEPTED_AS_REFERENCE" ||
    value === "NEEDS_REVISION" ||
    value === "REJECTED"
  );
}
