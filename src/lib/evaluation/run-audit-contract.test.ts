import { describe, expect, it } from "vitest";
import {
  createEvaluationRunAuditEvent,
  validateEvaluationRunAuditEvent
} from "@/lib/evaluation/run-audit-contract";

const createdAt = "2026-07-05T09:30:00.000Z";

function createAuditEvent(overrides?: Record<string, unknown>) {
  return {
    actor: "SYSTEM",
    createdAt,
    eventType: "RUN_CREATED",
    id: "audit-event-1",
    metadata: {
      attempt: 1,
      nested: {
        safe: true
      },
      tags: ["mock", null, 2]
    },
    runId: "run-1",
    ...overrides
  };
}

describe("EvaluationRun audit contract", () => {
  it("accepts a valid audit event", () => {
    const result = validateEvaluationRunAuditEvent(createAuditEvent());

    expect(result).toEqual({
      success: true,
      event: createAuditEvent()
    });
  });

  it("rejects an invalid eventType", () => {
    const result = validateEvaluationRunAuditEvent(
      createAuditEvent({
        eventType: "AUTO_REJECTED"
      })
    );

    expect(result.success).toBe(false);
  });

  it("rejects an invalid actor", () => {
    const result = validateEvaluationRunAuditEvent(
      createAuditEvent({
        actor: "AI_PROVIDER"
      })
    );

    expect(result.success).toBe(false);
  });

  it("rejects audit events with missing metadata", () => {
    const result = validateEvaluationRunAuditEvent({
      actor: "SYSTEM",
      createdAt,
      eventType: "RUN_CREATED",
      id: "audit-event-1",
      runId: "run-1"
    });

    expect(result.success).toBe(false);
  });

  it("rejects metadata containing undefined, functions, or Date objects", () => {
    const invalidEvents = [
      validateEvaluationRunAuditEvent(
        createAuditEvent({
          metadata: {
            value: undefined
          }
        })
      ),
      validateEvaluationRunAuditEvent(
        createAuditEvent({
          metadata: {
            value: () => "not-json"
          }
        })
      ),
      validateEvaluationRunAuditEvent(
        createAuditEvent({
          metadata: {
            value: new Date(createdAt)
          }
        })
      )
    ];

    expect(invalidEvents.every((result) => result.success === false)).toBe(true);
  });

  it("creates audit events with generated id and createdAt values", () => {
    const result = createEvaluationRunAuditEvent(
      {
        actor: "TEST",
        eventType: "OUTPUT_BOUND",
        metadata: {
          source: "contract-test"
        },
        runId: "run-1"
      },
      {
        idGenerator: () => "audit-event-generated",
        now: new Date(createdAt)
      }
    );

    expect(result).toEqual({
      success: true,
      event: {
        actor: "TEST",
        createdAt,
        eventType: "OUTPUT_BOUND",
        id: "audit-event-generated",
        metadata: {
          source: "contract-test"
        },
        runId: "run-1"
      }
    });
  });

  it("creates audit events that validate through the audit contract", () => {
    const created = createEvaluationRunAuditEvent(
      {
        actor: "PROVIDER",
        eventType: "RUN_FAILED",
        metadata: {
          reason: "TIMEOUT"
        },
        runId: "run-1"
      },
      {
        idGenerator: () => "audit-event-failed",
        now: new Date(createdAt)
      }
    );

    expect(created.success).toBe(true);

    if (created.success) {
      expect(validateEvaluationRunAuditEvent(created.event)).toEqual({
        success: true,
        event: created.event
      });
    }
  });
});
