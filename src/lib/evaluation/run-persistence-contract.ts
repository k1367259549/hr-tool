import { z } from "zod";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { validateEvaluationRunLifecycleSnapshot } from "@/lib/evaluation/run-lifecycle-validation";
import {
  EvaluationRunLifecycleSnapshotSchema,
  EvaluationRunStatusSchema,
  type EvaluationRunLifecycleSnapshot,
  type EvaluationRunStatus
} from "@/types/evaluation-run-lifecycle";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

const stableId = z.string().trim().min(1).max(120);
const isoDateTime = z.string().datetime({ offset: true });

export const EvaluationRunPersistenceRunTypeSchema = z.enum([
  "MOCK",
  "RULE_BASED",
  "AI"
]);

export const EvaluationRunAuditEventTypeSchema = z.enum([
  "CREATED",
  "LIFECYCLE_UPDATED",
  "OUTPUT_SAVED",
  "FAILED",
  "RETRIED"
]);

export type EvaluationRunPersistenceRunType = z.infer<
  typeof EvaluationRunPersistenceRunTypeSchema
>;

export type EvaluationRunAuditEventType = z.infer<
  typeof EvaluationRunAuditEventTypeSchema
>;

export type EvaluationRunPersistenceRecord = {
  id: string;
  evaluationId: string;
  resumeId: string;
  resumeRevisionId: string;
  parsedSnapshotId: string;
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: number;
  runType: EvaluationRunPersistenceRunType;
  status: EvaluationRunStatus;
  lifecycleSnapshot: EvaluationRunLifecycleSnapshot;
  output: ResumeEvaluationResult | null;
  createdAt: string;
  updatedAt: string;
};

export type EvaluationRunCreateInput = {
  id: string;
  evaluationId: string;
  resumeId: string;
  resumeRevisionId: string;
  parsedSnapshotId: string;
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: number;
  runType: EvaluationRunPersistenceRunType;
  lifecycleSnapshot: EvaluationRunLifecycleSnapshot;
  createdAt: string;
};

export type EvaluationRunUpdateInput = {
  runId: string;
  lifecycleSnapshot?: EvaluationRunLifecycleSnapshot;
  output?: ResumeEvaluationResult;
  updatedAt: string;
};

export type EvaluationRunAuditEvent = {
  runId: string;
  eventType: EvaluationRunAuditEventType;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export interface EvaluationRunRepository {
  createRun(input: EvaluationRunCreateInput): Promise<EvaluationRunPersistenceRecord>;
  updateRunLifecycle(
    runId: string,
    snapshot: EvaluationRunLifecycleSnapshot
  ): Promise<EvaluationRunPersistenceRecord>;
  saveRunOutput(
    runId: string,
    output: ResumeEvaluationResult
  ): Promise<EvaluationRunPersistenceRecord>;
  appendAuditEvent(
    runId: string,
    event: EvaluationRunAuditEvent
  ): Promise<EvaluationRunAuditEvent>;
  findRunById(runId: string): Promise<EvaluationRunPersistenceRecord | null>;
}

type CreateInputValidationResult =
  | {
      success: true;
      input: EvaluationRunCreateInput;
    }
  | {
      success: false;
      error: string;
    };

type UpdateInputValidationResult =
  | {
      success: true;
      input: EvaluationRunUpdateInput;
    }
  | {
      success: false;
      error: string;
    };

type AuditEventValidationResult =
  | {
      success: true;
      event: EvaluationRunAuditEvent;
    }
  | {
      success: false;
      error: string;
    };

type LifecyclePersistenceValidationResult =
  | {
      success: true;
      snapshot: EvaluationRunLifecycleSnapshot;
    }
  | {
      success: false;
      error: string;
    };

type OutputPersistenceValidationResult =
  | {
      success: true;
      output: ResumeEvaluationResult;
    }
  | {
      success: false;
      error: string;
    };

const EvaluationRunCreateInputSchema = z
  .object({
    id: stableId,
    evaluationId: stableId,
    resumeId: stableId,
    resumeRevisionId: stableId,
    parsedSnapshotId: stableId,
    jobProfileId: stableId,
    templateVersionId: stableId,
    jobProfileVersion: z.number().int().min(1),
    runType: EvaluationRunPersistenceRunTypeSchema,
    lifecycleSnapshot: z.unknown(),
    createdAt: isoDateTime
  })
  .strict();

const EvaluationRunUpdateInputSchema = z
  .object({
    runId: stableId,
    lifecycleSnapshot: z.unknown().optional(),
    output: z.unknown().optional(),
    updatedAt: isoDateTime
  })
  .strict();

const EvaluationRunAuditEventSchema = z
  .object({
    runId: stableId,
    eventType: EvaluationRunAuditEventTypeSchema,
    createdAt: isoDateTime,
    metadata: z.record(z.unknown())
  })
  .strict();

export function validateEvaluationRunCreateInput(
  input: unknown
): CreateInputValidationResult {
  const parsed = EvaluationRunCreateInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "EvaluationRun create input is invalid."
    };
  }

  const lifecycle = validateEvaluationRunLifecycleForPersistence(
    parsed.data.lifecycleSnapshot
  );

  if (!lifecycle.success) {
    return lifecycle;
  }

  if (lifecycle.snapshot.runId !== parsed.data.id) {
    return {
      success: false,
      error: "Lifecycle snapshot runId must match EvaluationRun create input id."
    };
  }

  return {
    success: true,
    input: {
      ...parsed.data,
      lifecycleSnapshot: lifecycle.snapshot
    }
  };
}

export function validateEvaluationRunUpdateInput(
  input: unknown
): UpdateInputValidationResult {
  const parsed = EvaluationRunUpdateInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "EvaluationRun update input is invalid."
    };
  }

  const update: EvaluationRunUpdateInput = {
    runId: parsed.data.runId,
    updatedAt: parsed.data.updatedAt
  };

  if (parsed.data.lifecycleSnapshot !== undefined) {
    const lifecycle = validateEvaluationRunLifecycleForPersistence(
      parsed.data.lifecycleSnapshot
    );

    if (!lifecycle.success) {
      return lifecycle;
    }

    if (lifecycle.snapshot.runId !== parsed.data.runId) {
      return {
        success: false,
        error: "Lifecycle snapshot runId must match EvaluationRun update runId."
      };
    }

    update.lifecycleSnapshot = lifecycle.snapshot;
  }

  if (parsed.data.output !== undefined) {
    const output = validateEvaluationRunOutputForPersistence(parsed.data.output);

    if (!output.success) {
      return output;
    }

    update.output = output.output;
  }

  return {
    success: true,
    input: update
  };
}

export function validateEvaluationRunLifecycleForPersistence(
  input: unknown
): LifecyclePersistenceValidationResult {
  const result = validateEvaluationRunLifecycleSnapshot(input);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    snapshot: result.snapshot
  };
}

export function validateEvaluationRunOutputForPersistence(
  input: unknown
): OutputPersistenceValidationResult {
  const result = bindEvaluationRunOutput(input);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    output: result.output
  };
}

export function validateEvaluationRunAuditEvent(
  input: unknown
): AuditEventValidationResult {
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

export function createEvaluationRunPersistenceRecord(input: {
  id: string;
  evaluationId: string;
  resumeId: string;
  resumeRevisionId: string;
  parsedSnapshotId: string;
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: number;
  runType: EvaluationRunPersistenceRunType;
  lifecycleSnapshot: EvaluationRunLifecycleSnapshot;
  output?: ResumeEvaluationResult | null;
  createdAt: string;
  updatedAt: string;
}): EvaluationRunPersistenceRecord {
  return {
    ...input,
    output: input.output ?? null,
    status: EvaluationRunStatusSchema.parse(input.lifecycleSnapshot.status)
  };
}

export { EvaluationRunLifecycleSnapshotSchema };
