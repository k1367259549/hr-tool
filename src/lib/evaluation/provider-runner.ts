import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import type {
  EvaluationProvider,
  EvaluationProviderInput,
  EvaluationProviderMetadata
} from "@/lib/evaluation/provider-interface";
import {
  createEvaluationRunAuditEvent,
  type EvaluationRunAuditEventType,
  type EvaluationRunAuditMetadata
} from "@/lib/evaluation/run-audit-contract";
import { transitionEvaluationRunLifecycle } from "@/lib/evaluation/run-state-transition";
import type {
  EvaluationRunCreateInput,
  EvaluationRunPersistenceRunType,
  EvaluationRunRepository
} from "@/lib/evaluation/run-persistence-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type {
  AnyDetailedScreeningResult,
  QuickScreeningResult
} from "@/types/resume-screening";
import type {
  EvaluationRunFailureReason,
  EvaluationRunLifecycleEvent,
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

type RunEvaluationProviderParams = {
  provider: EvaluationProvider;
  repository: EvaluationRunRepository;
  input: EvaluationProviderInput;
  createInput?: EvaluationRunCreateInput;
  now?: () => Date;
  idGenerator?: () => string;
};

type RunEvaluationProviderResult =
  | {
      success: true;
      runId: string;
      output: ResumeEvaluationResult;
      detailedScreeningResult?: AnyDetailedScreeningResult;
      quickScreeningResult?: QuickScreeningResult;
      metadata: EvaluationProviderMetadata;
    }
  | {
      success: false;
      runId: string;
      error: string;
      failureReason: EvaluationRunFailureReason;
      metadata?: EvaluationProviderMetadata;
    };

export async function runEvaluationProvider(
  params: RunEvaluationProviderParams
): Promise<RunEvaluationProviderResult> {
  const now = params.now ?? (() => new Date());
  const runId = params.input.runId;
  const createInput = params.createInput ?? createDefaultRunInput(params, now);
  const created = await params.repository.createRun(createInput);

  await appendAuditEvent(params, "RUN_CREATED", now, {
    providerName: params.provider.name,
    providerVersion: params.provider.version
  });

  const started = transitionEvaluationRunLifecycle(
    created.lifecycleSnapshot,
    createLifecycleEvent(runId, "STARTED", created.lifecycleSnapshot.status, "RUNNING", now),
    {
      now: now()
    }
  );

  if (!started.success) {
    await appendAuditEvent(params, "LIFECYCLE_VALIDATION_FAILED", now, {
      error: started.error,
      phase: "start"
    });

    return {
      success: false,
      runId,
      error: started.error,
      failureReason: "VALIDATION_ERROR"
    };
  }

  await params.repository.updateRunLifecycle(runId, started.snapshot);
  await appendAuditEvent(params, "RUN_STARTED", now, {
    providerName: params.provider.name,
    providerVersion: params.provider.version
  });

  let providerResult;

  try {
    providerResult = await params.provider.evaluate({
      ...params.input,
      lifecycleSnapshot: started.snapshot
    });
  } catch (error) {
    return failRun(params, started.snapshot, now, {
      error: error instanceof Error ? error.message : "Evaluation provider threw.",
      failureReason: "PROVIDER_ERROR"
    });
  }

  if (!providerResult.success) {
    return failRun(params, started.snapshot, now, {
      error: providerResult.error.message,
      failureReason: providerResult.failureReason,
      metadata: providerResult.metadata
    });
  }

  const bound = bindEvaluationRunOutput(providerResult.output);

  if (!bound.success) {
    await appendAuditEvent(params, "OUTPUT_VALIDATION_FAILED", now, {
      error: bound.error,
      providerName: params.provider.name
    });

    return failRun(params, started.snapshot, now, {
      error: bound.error,
      failureReason: "VALIDATION_ERROR",
      metadata: providerResult.metadata
    });
  }

  await params.repository.saveRunOutput(runId, bound.output);

  const completed = transitionEvaluationRunLifecycle(
    started.snapshot,
    createLifecycleEvent(runId, "COMPLETED", "RUNNING", "COMPLETED", now),
    {
      now: now()
    }
  );

  if (!completed.success) {
    await appendAuditEvent(params, "LIFECYCLE_VALIDATION_FAILED", now, {
      error: completed.error,
      phase: "complete"
    });

    return failRun(params, started.snapshot, now, {
      error: completed.error,
      failureReason: "VALIDATION_ERROR",
      metadata: providerResult.metadata
    });
  }

  await params.repository.updateRunLifecycle(runId, completed.snapshot);
  await appendAuditEvent(params, "OUTPUT_BOUND", now, {
    providerName: params.provider.name,
    providerVersion: params.provider.version
  });
  await appendAuditEvent(params, "RUN_COMPLETED", now, {
    providerName: params.provider.name,
    providerVersion: params.provider.version
  });

  return {
    success: true,
    runId,
    output: bound.output,
    detailedScreeningResult: providerResult.detailedScreeningResult,
    quickScreeningResult: providerResult.quickScreeningResult,
    metadata: providerResult.metadata
  };
}

async function failRun(
  params: RunEvaluationProviderParams,
  runningSnapshot: EvaluationRunLifecycleSnapshot,
  now: () => Date,
  failure: {
    error: string;
    failureReason: EvaluationRunFailureReason;
    metadata?: EvaluationProviderMetadata;
  }
): Promise<RunEvaluationProviderResult> {
  const runId = params.input.runId;
  const failed = transitionEvaluationRunLifecycle(
    runningSnapshot,
    createLifecycleEvent(
      runId,
      "FAILED",
      runningSnapshot.status,
      "FAILED",
      now,
      failure.failureReason,
      failure.error
    ),
    {
      error: failure.error,
      failureReason: failure.failureReason,
      now: now()
    }
  );

  if (failed.success) {
    await params.repository.updateRunLifecycle(runId, failed.snapshot);
  }

  await appendAuditEvent(params, "RUN_FAILED", now, {
    error: failure.error,
    failureReason: failure.failureReason,
    providerName: params.provider.name,
    providerVersion: params.provider.version
  });

  return {
    success: false,
    runId,
    error: failure.error,
    failureReason: failure.failureReason,
    metadata: failure.metadata
  };
}

async function appendAuditEvent(
  params: RunEvaluationProviderParams,
  eventType: EvaluationRunAuditEventType,
  now: () => Date,
  metadata: Record<string, EvaluationRunAuditMetadata>
): Promise<void> {
  const event = createEvaluationRunAuditEvent(
    {
      actor: "SYSTEM",
      eventType,
      metadata,
      runId: params.input.runId
    },
    {
      idGenerator: params.idGenerator,
      now: now()
    }
  );

  if (!event.success) {
    throw new Error(event.error);
  }

  await params.repository.appendAuditEvent(params.input.runId, event.event);
}

function createDefaultRunInput(
  params: RunEvaluationProviderParams,
  now: () => Date
): EvaluationRunCreateInput {
  const runId = params.input.runId;

  return {
    createdAt: now().toISOString(),
    evaluationId: `evaluation-${runId}`,
    id: runId,
    jobProfileId: params.input.jobProfileId ?? `job-profile-${runId}`,
    jobProfileVersion: 1,
    lifecycleSnapshot: createInitialSnapshot(runId, now),
    parsedSnapshotId: `parsed-snapshot-${runId}`,
    resumeId: params.input.candidateId ?? `resume-${runId}`,
    resumeRevisionId: `resume-revision-${runId}`,
    runType: mapProviderRunType(params.provider),
    templateVersionId: params.input.templateVersionId ?? `template-version-${runId}`
  };
}

function createInitialSnapshot(
  runId: string,
  now: () => Date
): EvaluationRunLifecycleSnapshot {
  return {
    cancelledAt: null,
    completedAt: null,
    createdAt: now().toISOString(),
    error: null,
    failedAt: null,
    retryOfRunId: null,
    runId,
    startedAt: null,
    status: "PENDING"
  };
}

function createLifecycleEvent(
  runId: string,
  eventType: EvaluationRunLifecycleEvent["eventType"],
  fromStatus: EvaluationRunLifecycleEvent["fromStatus"],
  toStatus: EvaluationRunLifecycleEvent["toStatus"],
  now: () => Date,
  reason: EvaluationRunFailureReason | null = null,
  errorMessage?: string
): EvaluationRunLifecycleEvent {
  return {
    error: errorMessage
      ? {
          code: null,
          message: errorMessage,
          reason: reason ?? "UNKNOWN"
        }
      : null,
    eventType,
    fromStatus,
    occurredAt: now().toISOString(),
    reason,
    retryRunId: null,
    runId,
    toStatus
  };
}

function mapProviderRunType(
  provider: EvaluationProvider
): EvaluationRunPersistenceRunType {
  if (provider.name === "MOCK") {
    return "MOCK";
  }

  if (provider.name === "RULE_BASED") {
    return "RULE_BASED";
  }

  return "AI";
}
