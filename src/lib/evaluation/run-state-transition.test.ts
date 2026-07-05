import { describe, expect, it } from "vitest";
import { transitionEvaluationRunLifecycle } from "@/lib/evaluation/run-state-transition";
import { EvaluationRunLifecycleSnapshotSchema } from "@/types/evaluation-run-lifecycle";
import type {
  EvaluationRunLifecycleEvent,
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T08:00:00.000Z";
const eventAt = "2026-07-05T08:01:00.000Z";
const now = new Date("2026-07-05T08:02:00.000Z");

function createSnapshot(
  overrides?: Partial<EvaluationRunLifecycleSnapshot>
): EvaluationRunLifecycleSnapshot {
  return {
    cancelledAt: null,
    completedAt: null,
    createdAt,
    error: null,
    failedAt: null,
    retryOfRunId: null,
    runId: "run-1",
    startedAt: null,
    status: "PENDING",
    ...overrides
  };
}

function createEvent(
  overrides?: Partial<EvaluationRunLifecycleEvent>
): EvaluationRunLifecycleEvent {
  return {
    error: null,
    eventType: "STARTED",
    fromStatus: "PENDING",
    occurredAt: eventAt,
    reason: null,
    retryRunId: null,
    runId: "run-1",
    toStatus: "RUNNING",
    ...overrides
  };
}

describe("transitionEvaluationRunLifecycle", () => {
  it("transitions PENDING + STARTED to RUNNING and writes startedAt", () => {
    const snapshot = createSnapshot();
    const result = transitionEvaluationRunLifecycle(snapshot, createEvent(), { now });

    expect(result.success).toBe(true);
    expect(snapshot.status).toBe("PENDING");
    expect(snapshot.startedAt).toBeNull();

    if (result.success) {
      expect(result.snapshot).toMatchObject({
        startedAt: now.toISOString(),
        status: "RUNNING"
      });
      expect(EvaluationRunLifecycleSnapshotSchema.safeParse(result.snapshot).success).toBe(
        true
      );
    }
  });

  it("transitions RUNNING + COMPLETED to COMPLETED and writes completedAt", () => {
    const result = transitionEvaluationRunLifecycle(
      createSnapshot({
        startedAt: eventAt,
        status: "RUNNING"
      }),
      createEvent({
        eventType: "COMPLETED",
        fromStatus: "RUNNING",
        toStatus: "COMPLETED"
      }),
      { now }
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.snapshot.completedAt).toBe(now.toISOString());
      expect(result.snapshot.status).toBe("COMPLETED");
      expect(EvaluationRunLifecycleSnapshotSchema.safeParse(result.snapshot).success).toBe(
        true
      );
    }
  });

  it("transitions RUNNING + FAILED to FAILED and writes failedAt plus error", () => {
    const result = transitionEvaluationRunLifecycle(
      createSnapshot({
        startedAt: eventAt,
        status: "RUNNING"
      }),
      createEvent({
        eventType: "FAILED",
        fromStatus: "RUNNING",
        reason: "PROVIDER_ERROR",
        toStatus: "FAILED"
      }),
      {
        error: "Provider returned invalid output.",
        failureReason: "PROVIDER_ERROR",
        now
      }
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.snapshot).toMatchObject({
        failedAt: now.toISOString(),
        status: "FAILED"
      });
      expect(result.snapshot.error).toEqual({
        code: null,
        message: "Provider returned invalid output.",
        reason: "PROVIDER_ERROR"
      });
      expect(EvaluationRunLifecycleSnapshotSchema.safeParse(result.snapshot).success).toBe(
        true
      );
    }
  });

  it("transitions PENDING/RUNNING + CANCELLED to CANCELLED and writes cancelledAt", () => {
    const pendingResult = transitionEvaluationRunLifecycle(
      createSnapshot(),
      createEvent({
        eventType: "CANCELLED",
        fromStatus: "PENDING",
        reason: "CANCELLED",
        toStatus: "CANCELLED"
      }),
      { now }
    );
    const runningResult = transitionEvaluationRunLifecycle(
      createSnapshot({
        startedAt: eventAt,
        status: "RUNNING"
      }),
      createEvent({
        eventType: "CANCELLED",
        fromStatus: "RUNNING",
        reason: "CANCELLED",
        toStatus: "CANCELLED"
      }),
      { now }
    );

    expect(pendingResult.success).toBe(true);
    expect(runningResult.success).toBe(true);

    if (pendingResult.success && runningResult.success) {
      expect(pendingResult.snapshot.cancelledAt).toBe(now.toISOString());
      expect(runningResult.snapshot.cancelledAt).toBe(now.toISOString());
      expect(pendingResult.snapshot.status).toBe("CANCELLED");
      expect(runningResult.snapshot.status).toBe("CANCELLED");
    }
  });

  it("transitions FAILED + RETRIED to PENDING and increments retryCount", () => {
    const result = transitionEvaluationRunLifecycle(
      createSnapshot({
        error: {
          code: null,
          message: "Validation failed.",
          reason: "VALIDATION_ERROR"
        },
        failedAt: eventAt,
        retryCount: 2,
        startedAt: eventAt,
        status: "FAILED"
      }),
      createEvent({
        eventType: "RETRIED",
        fromStatus: "FAILED",
        toStatus: "PENDING"
      }),
      { now }
    );
    const firstRetryResult = transitionEvaluationRunLifecycle(
      createSnapshot({
        error: {
          code: null,
          message: "Validation failed.",
          reason: "VALIDATION_ERROR"
        },
        failedAt: eventAt,
        startedAt: eventAt,
        status: "FAILED"
      }),
      createEvent({
        eventType: "RETRIED",
        fromStatus: "FAILED",
        toStatus: "PENDING"
      }),
      { now }
    );

    expect(result.success).toBe(true);
    expect(firstRetryResult.success).toBe(true);

    if (result.success && firstRetryResult.success) {
      expect(result.snapshot).toMatchObject({
        error: null,
        failedAt: null,
        retryCount: 3,
        startedAt: null,
        status: "PENDING"
      });
      expect(firstRetryResult.snapshot.retryCount).toBe(1);
      expect(EvaluationRunLifecycleSnapshotSchema.safeParse(result.snapshot).success).toBe(
        true
      );
    }
  });

  it("rejects illegal transitions and terminal state changes", () => {
    const illegalTransitions = [
      transitionEvaluationRunLifecycle(
        createSnapshot(),
        createEvent({
          eventType: "COMPLETED",
          fromStatus: "PENDING",
          toStatus: "COMPLETED"
        })
      ),
      transitionEvaluationRunLifecycle(
        createSnapshot(),
        createEvent({
          eventType: "FAILED",
          fromStatus: "PENDING",
          toStatus: "FAILED"
        })
      ),
      transitionEvaluationRunLifecycle(
        createSnapshot({
          error: {
            code: null,
            message: "Failed.",
            reason: "UNKNOWN"
          },
          failedAt: eventAt,
          status: "FAILED"
        }),
        createEvent({
          eventType: "COMPLETED",
          fromStatus: "FAILED",
          toStatus: "COMPLETED"
        })
      ),
      transitionEvaluationRunLifecycle(
        createSnapshot({
          startedAt: eventAt,
          status: "RUNNING"
        }),
        createEvent({
          eventType: "STARTED",
          fromStatus: "RUNNING",
          toStatus: "RUNNING"
        })
      ),
      transitionEvaluationRunLifecycle(
        createSnapshot({
          completedAt: eventAt,
          startedAt: eventAt,
          status: "COMPLETED"
        }),
        createEvent({
          eventType: "RETRIED",
          fromStatus: "COMPLETED",
          toStatus: "PENDING"
        })
      ),
      transitionEvaluationRunLifecycle(
        createSnapshot({
          cancelledAt: eventAt,
          status: "CANCELLED"
        }),
        createEvent({
          eventType: "RETRIED",
          fromStatus: "CANCELLED",
          toStatus: "PENDING"
        })
      )
    ];

    expect(illegalTransitions.every((result) => result.success === false)).toBe(true);
  });
});
