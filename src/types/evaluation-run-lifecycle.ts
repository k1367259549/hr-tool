import { z } from "zod";

export const evaluationRunStatuses = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
] as const;

export const evaluationRunLifecycleEvents = [
  "CREATED",
  "STARTED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "RETRIED"
] as const;

export const evaluationRunFailureReasons = [
  "VALIDATION_ERROR",
  "PROVIDER_ERROR",
  "TIMEOUT",
  "CANCELLED",
  "UNKNOWN"
] as const;

export type EvaluationRunStatus = (typeof evaluationRunStatuses)[number];

export type EvaluationRunLifecycleEventType =
  (typeof evaluationRunLifecycleEvents)[number];

export type EvaluationRunFailureReason =
  (typeof evaluationRunFailureReasons)[number];

export type EvaluationRunLifecycleError = {
  reason: EvaluationRunFailureReason;
  message: string;
  code: string | null;
};

export type EvaluationRunLifecycleSnapshot = {
  runId: string;
  status: EvaluationRunStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  retryOfRunId: string | null;
  error: EvaluationRunLifecycleError | null;
};

export type EvaluationRunLifecycleEvent = {
  runId: string;
  eventType: EvaluationRunLifecycleEventType;
  occurredAt: string;
  fromStatus: EvaluationRunStatus | null;
  toStatus: EvaluationRunStatus;
  reason: EvaluationRunFailureReason | null;
  error: EvaluationRunLifecycleError | null;
  retryRunId: string | null;
};

const isoDateTime = z.string().datetime({ offset: true });

export const EvaluationRunFailureReasonSchema = z.enum(evaluationRunFailureReasons);

export const EvaluationRunStatusSchema = z.enum(evaluationRunStatuses);

export const EvaluationRunLifecycleEventTypeSchema = z.enum(
  evaluationRunLifecycleEvents
);

export const EvaluationRunLifecycleErrorSchema = z
  .object({
    reason: EvaluationRunFailureReasonSchema,
    message: z.string().trim().min(1).max(1000),
    code: z.string().trim().min(1).max(120).nullable()
  })
  .strict();

export const EvaluationRunLifecycleSnapshotSchema = z
  .object({
    runId: z.string().trim().min(1).max(120),
    status: EvaluationRunStatusSchema,
    createdAt: isoDateTime,
    startedAt: isoDateTime.nullable(),
    completedAt: isoDateTime.nullable(),
    failedAt: isoDateTime.nullable(),
    cancelledAt: isoDateTime.nullable(),
    retryOfRunId: z.string().trim().min(1).max(120).nullable(),
    error: EvaluationRunLifecycleErrorSchema.nullable()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "RUNNING" && value.startedAt === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RUNNING lifecycle snapshots require startedAt.",
        path: ["startedAt"]
      });
    }

    if (value.status === "COMPLETED" && value.completedAt === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "COMPLETED lifecycle snapshots require completedAt.",
        path: ["completedAt"]
      });
    }

    if (value.status === "FAILED") {
      if (value.failedAt === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "FAILED lifecycle snapshots require failedAt.",
          path: ["failedAt"]
        });
      }

      if (value.error === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "FAILED lifecycle snapshots require error.",
          path: ["error"]
        });
      }
    }

    if (value.status === "CANCELLED" && value.cancelledAt === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CANCELLED lifecycle snapshots require cancelledAt.",
        path: ["cancelledAt"]
      });
    }
  });

export const EvaluationRunLifecycleEventSchema = z
  .object({
    runId: z.string().trim().min(1).max(120),
    eventType: EvaluationRunLifecycleEventTypeSchema,
    occurredAt: isoDateTime,
    fromStatus: EvaluationRunStatusSchema.nullable(),
    toStatus: EvaluationRunStatusSchema,
    reason: EvaluationRunFailureReasonSchema.nullable(),
    error: EvaluationRunLifecycleErrorSchema.nullable(),
    retryRunId: z.string().trim().min(1).max(120).nullable()
  })
  .strict();
