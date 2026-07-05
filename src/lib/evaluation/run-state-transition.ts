import {
  EvaluationRunLifecycleEventSchema,
  EvaluationRunLifecycleSnapshotSchema,
  type EvaluationRunFailureReason,
  type EvaluationRunLifecycleError,
  type EvaluationRunLifecycleEvent,
  type EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

type TransitionOptions = {
  now?: Date;
  error?: string;
  failureReason?: EvaluationRunFailureReason;
};

type TransitionResult =
  | {
      success: true;
      snapshot: EvaluationRunLifecycleSnapshot;
    }
  | {
      success: false;
      error: string;
    };

export function transitionEvaluationRunLifecycle(
  snapshot: EvaluationRunLifecycleSnapshot,
  event: EvaluationRunLifecycleEvent,
  options: TransitionOptions = {}
): TransitionResult {
  const snapshotValidation = EvaluationRunLifecycleSnapshotSchema.safeParse(snapshot);

  if (!snapshotValidation.success) {
    return {
      success: false,
      error:
        snapshotValidation.error.issues[0]?.message ??
        "Current lifecycle snapshot is invalid."
    };
  }

  const eventValidation = EvaluationRunLifecycleEventSchema.safeParse(event);

  if (!eventValidation.success) {
    return {
      success: false,
      error:
        eventValidation.error.issues[0]?.message ??
        "Lifecycle event is invalid."
    };
  }

  if (snapshot.runId !== event.runId) {
    return {
      success: false,
      error: "Lifecycle event runId does not match snapshot runId."
    };
  }

  if (snapshot.status === "COMPLETED" || snapshot.status === "CANCELLED") {
    return {
      success: false,
      error: `${snapshot.status} lifecycle snapshots are terminal.`
    };
  }

  const timestamp = options.now?.toISOString() ?? event.occurredAt;
  const nextSnapshot = createNextSnapshot(snapshot, event, timestamp, options);

  if (!nextSnapshot) {
    return {
      success: false,
      error: `Illegal lifecycle transition: ${snapshot.status} + ${event.eventType}.`
    };
  }

  const nextValidation = EvaluationRunLifecycleSnapshotSchema.safeParse(nextSnapshot);

  if (!nextValidation.success) {
    return {
      success: false,
      error:
        nextValidation.error.issues[0]?.message ??
        "Next lifecycle snapshot is invalid."
    };
  }

  return {
    success: true,
    snapshot: nextValidation.data
  };
}

function createNextSnapshot(
  snapshot: EvaluationRunLifecycleSnapshot,
  event: EvaluationRunLifecycleEvent,
  timestamp: string,
  options: TransitionOptions
): EvaluationRunLifecycleSnapshot | null {
  if (snapshot.status === "PENDING" && event.eventType === "STARTED") {
    return {
      ...snapshot,
      startedAt: timestamp,
      status: "RUNNING"
    };
  }

  if (snapshot.status === "RUNNING" && event.eventType === "COMPLETED") {
    return {
      ...snapshot,
      completedAt: timestamp,
      error: null,
      status: "COMPLETED"
    };
  }

  if (snapshot.status === "RUNNING" && event.eventType === "FAILED") {
    return {
      ...snapshot,
      error: createFailureError(event, options),
      failedAt: timestamp,
      status: "FAILED"
    };
  }

  if (
    (snapshot.status === "PENDING" || snapshot.status === "RUNNING") &&
    event.eventType === "CANCELLED"
  ) {
    return {
      ...snapshot,
      cancelledAt: timestamp,
      status: "CANCELLED"
    };
  }

  if (snapshot.status === "FAILED" && event.eventType === "RETRIED") {
    return {
      ...snapshot,
      cancelledAt: null,
      completedAt: null,
      error: null,
      failedAt: null,
      retryCount: (snapshot.retryCount ?? 0) + 1,
      startedAt: null,
      status: "PENDING"
    };
  }

  return null;
}

function createFailureError(
  event: EvaluationRunLifecycleEvent,
  options: TransitionOptions
): EvaluationRunLifecycleError {
  return {
    code: event.error?.code ?? null,
    message: options.error ?? event.error?.message ?? "Evaluation run failed.",
    reason: options.failureReason ?? event.reason ?? event.error?.reason ?? "UNKNOWN"
  };
}
