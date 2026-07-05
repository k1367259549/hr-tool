import { describe, expect, it } from "vitest";
import {
  EvaluationRunFailureReasonSchema,
  EvaluationRunLifecycleEventSchema,
  EvaluationRunLifecycleSnapshotSchema,
  EvaluationRunLifecycleEventTypeSchema,
  EvaluationRunStatusSchema,
  type EvaluationRunLifecycleEvent,
  type EvaluationRunLifecycleSnapshot,
  type EvaluationRunStatus
} from "@/types/evaluation-run-lifecycle";

const now = "2026-07-05T07:45:00.000Z";

function createSnapshot(
  overrides?: Partial<EvaluationRunLifecycleSnapshot>
): EvaluationRunLifecycleSnapshot {
  return {
    cancelledAt: null,
    completedAt: null,
    createdAt: now,
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
    eventType: "CREATED",
    fromStatus: null,
    occurredAt: now,
    reason: null,
    retryRunId: null,
    runId: "run-1",
    toStatus: "PENDING",
    ...overrides
  };
}

describe("EvaluationRun lifecycle types and schemas", () => {
  it("allows status values to be used as service-layer types", () => {
    const status: EvaluationRunStatus = "RUNNING";

    expect(EvaluationRunStatusSchema.parse(status)).toBe("RUNNING");
  });

  it("requires lifecycle snapshot identity, status, timestamps, and optional error shape", () => {
    const snapshot = createSnapshot();

    expect(EvaluationRunLifecycleSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("requires startedAt for RUNNING snapshots", () => {
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          status: "RUNNING",
          startedAt: now
        })
      ).success
    ).toBe(true);
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          status: "RUNNING",
          startedAt: null
        })
      ).success
    ).toBe(false);
  });

  it("requires completedAt for COMPLETED snapshots", () => {
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          completedAt: now,
          startedAt: now,
          status: "COMPLETED"
        })
      ).success
    ).toBe(true);
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          completedAt: null,
          status: "COMPLETED"
        })
      ).success
    ).toBe(false);
  });

  it("requires failedAt and error for FAILED snapshots", () => {
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          error: {
            code: "provider-timeout",
            message: "Provider timed out.",
            reason: "TIMEOUT"
          },
          failedAt: now,
          startedAt: now,
          status: "FAILED"
        })
      ).success
    ).toBe(true);
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          error: null,
          failedAt: now,
          status: "FAILED"
        })
      ).success
    ).toBe(false);
    expect(
      EvaluationRunLifecycleSnapshotSchema.safeParse(
        createSnapshot({
          error: {
            code: null,
            message: "Validation failed.",
            reason: "VALIDATION_ERROR"
          },
          failedAt: null,
          status: "FAILED"
        })
      ).success
    ).toBe(false);
  });

  it("validates lifecycle events and rejects illegal status, event, and reason values", () => {
    expect(
      EvaluationRunLifecycleEventSchema.safeParse(
        createEvent({
          eventType: "STARTED",
          fromStatus: "PENDING",
          toStatus: "RUNNING"
        })
      ).success
    ).toBe(true);
    expect(EvaluationRunStatusSchema.safeParse("SUCCEEDED").success).toBe(false);
    expect(EvaluationRunLifecycleEventTypeSchema.safeParse("PAUSED").success).toBe(false);
    expect(EvaluationRunFailureReasonSchema.safeParse("AUTO_REJECTED").success).toBe(false);
  });
});
