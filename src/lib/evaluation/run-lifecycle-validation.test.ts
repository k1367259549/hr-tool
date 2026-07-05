import { describe, expect, it } from "vitest";
import {
  validateEvaluationRunLifecycleSnapshot,
  validateEvaluationRunLifecycleTransition
} from "@/lib/evaluation/run-lifecycle-validation";
import { EvaluationRunLifecycleSnapshotSchema } from "@/types/evaluation-run-lifecycle";
import type {
  EvaluationRunLifecycleEvent,
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T08:30:00.000Z";
const eventAt = "2026-07-05T08:31:00.000Z";
const now = new Date("2026-07-05T08:32:00.000Z");

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

describe("EvaluationRun lifecycle validation", () => {
  it("accepts a valid lifecycle snapshot", () => {
    const snapshot = createSnapshot();
    const result = validateEvaluationRunLifecycleSnapshot(snapshot);

    expect(result).toEqual({
      success: true,
      snapshot
    });
  });

  it("rejects an invalid lifecycle snapshot", () => {
    const result = validateEvaluationRunLifecycleSnapshot({
      ...createSnapshot(),
      status: "RUNNING",
      startedAt: null
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error).toBe("RUNNING lifecycle snapshots require startedAt.");
    }
  });

  it("accepts a valid lifecycle transition and validates the output snapshot", () => {
    const result = validateEvaluationRunLifecycleTransition({
      event: createEvent(),
      now,
      snapshot: createSnapshot()
    });

    expect(result.success).toBe(true);

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

  it("rejects an invalid lifecycle transition", () => {
    const result = validateEvaluationRunLifecycleTransition({
      event: createEvent({
        eventType: "COMPLETED",
        fromStatus: "PENDING",
        toStatus: "COMPLETED"
      }),
      snapshot: createSnapshot()
    });

    expect(result).toEqual({
      success: false,
      error: "Illegal lifecycle transition: PENDING + COMPLETED."
    });
  });

  it("does not mutate the original snapshot", () => {
    const snapshot = createSnapshot();
    const originalSnapshot = structuredClone(snapshot);

    const result = validateEvaluationRunLifecycleTransition({
      event: createEvent(),
      now,
      snapshot
    });

    expect(result.success).toBe(true);
    expect(snapshot).toEqual(originalSnapshot);
  });
});
