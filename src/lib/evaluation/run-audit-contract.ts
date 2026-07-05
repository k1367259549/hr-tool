import { z } from "zod";

const stableId = z.string().trim().min(1).max(120);
const isoDateTime = z.string().datetime({ offset: true });

export const evaluationRunAuditEventTypes = [
  "RUN_CREATED",
  "RUN_STARTED",
  "RUN_COMPLETED",
  "RUN_FAILED",
  "RUN_CANCELLED",
  "RUN_RETRIED",
  "OUTPUT_BOUND",
  "OUTPUT_VALIDATION_FAILED",
  "LIFECYCLE_VALIDATION_FAILED"
] as const;

export const evaluationRunAuditActors = [
  "SYSTEM",
  "RECRUITER",
  "PROVIDER",
  "TEST"
] as const;

export type EvaluationRunAuditEventType =
  (typeof evaluationRunAuditEventTypes)[number];

export type EvaluationRunAuditActor = (typeof evaluationRunAuditActors)[number];

export type EvaluationRunAuditMetadata =
  | string
  | number
  | boolean
  | null
  | EvaluationRunAuditMetadata[]
  | {
      [key: string]: EvaluationRunAuditMetadata;
    };

export type EvaluationRunAuditEvent = {
  id: string;
  runId: string;
  eventType: EvaluationRunAuditEventType;
  actor: EvaluationRunAuditActor;
  createdAt: string;
  metadata: Record<string, EvaluationRunAuditMetadata>;
};

export type EvaluationRunAuditEventCreateInput = {
  runId: string;
  eventType: EvaluationRunAuditEventType;
  actor: EvaluationRunAuditActor;
  metadata: Record<string, EvaluationRunAuditMetadata>;
};

type AuditValidationResult =
  | {
      success: true;
      event: EvaluationRunAuditEvent;
    }
  | {
      success: false;
      error: string;
    };

type AuditCreateResult = AuditValidationResult;

type AuditCreateOptions = {
  now?: Date;
  idGenerator?: () => string;
};

export const EvaluationRunAuditEventTypeSchema = z.enum(
  evaluationRunAuditEventTypes
);

export const EvaluationRunAuditActorSchema = z.enum(evaluationRunAuditActors);

const EvaluationRunAuditMetadataSchema = z.custom<
  Record<string, EvaluationRunAuditMetadata>
>((value) => isPlainObject(value) && isJsonSafeMetadata(value), {
  message: "metadata must be a JSON-safe object."
});

const EvaluationRunAuditEventSchema = z
  .object({
    id: stableId,
    runId: stableId,
    eventType: EvaluationRunAuditEventTypeSchema,
    actor: EvaluationRunAuditActorSchema,
    createdAt: isoDateTime,
    metadata: EvaluationRunAuditMetadataSchema
  })
  .strict();

const EvaluationRunAuditEventCreateInputSchema = z
  .object({
    runId: stableId,
    eventType: EvaluationRunAuditEventTypeSchema,
    actor: EvaluationRunAuditActorSchema,
    metadata: EvaluationRunAuditMetadataSchema
  })
  .strict();

export function validateEvaluationRunAuditEvent(
  input: unknown
): AuditValidationResult {
  const result = EvaluationRunAuditEventSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ?? "EvaluationRun audit event is invalid."
    };
  }

  return {
    success: true,
    event: result.data
  };
}

export function createEvaluationRunAuditEvent(
  input: EvaluationRunAuditEventCreateInput,
  options: AuditCreateOptions = {}
): AuditCreateResult {
  const parsed = EvaluationRunAuditEventCreateInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "EvaluationRun audit event create input is invalid."
    };
  }

  const event = {
    ...parsed.data,
    createdAt: (options.now ?? new Date()).toISOString(),
    id: options.idGenerator?.() ?? createAuditEventId()
  };

  return validateEvaluationRunAuditEvent(event);
}

function createAuditEventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `audit-${Date.now().toString(36)}`;
}

function isJsonSafeMetadata(value: unknown): value is EvaluationRunAuditMetadata {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSafeMetadata);
  }

  if (isPlainObject(value)) {
    return Object.values(value).every(isJsonSafeMetadata);
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
