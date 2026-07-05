import { describe, expect, it } from "vitest";
import {
  createEvaluationRunPersistenceRecord,
  validateEvaluationRunAuditEvent,
  validateEvaluationRunCreateInput,
  validateEvaluationRunLifecycleForPersistence,
  validateEvaluationRunOutputForPersistence,
  validateEvaluationRunUpdateInput,
  type EvaluationRunAuditEvent,
  type EvaluationRunCreateInput,
  type EvaluationRunPersistenceRecord,
  type EvaluationRunRepository
} from "@/lib/evaluation/run-persistence-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { EvaluationRunLifecycleSnapshot } from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T09:00:00.000Z";
const updatedAt = "2026-07-05T09:01:00.000Z";

function createLifecycleSnapshot(
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

function createValidEvaluationOutput(
  overrides?: Partial<ResumeEvaluationResult>
): ResumeEvaluationResult {
  return {
    confidence: "HIGH",
    dimensionScores: [
      {
        evidenceIds: ["ev_backend_api"],
        key: "backend-api",
        label: "Backend API",
        rationale: "The resume describes building production APIs.",
        score: 88
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built and maintained Node.js backend APIs for recruiting systems."
      }
    ],
    interviewQuestions: [
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_backend_api"],
        purpose: "Validate depth of backend API ownership.",
        question: "Which API design trade-offs did you own in that project?"
      }
    ],
    notes: null,
    overallScore: 82,
    overallSummary:
      "The candidate shows relevant backend API experience with direct evidence.",
    recommendation: "POTENTIAL_FIT",
    risks: [],
    schemaVersion: "m07-b3-a.v1",
    strengths: [],
    weaknesses: [],
    ...overrides
  };
}

function createRunInput(
  overrides?: Partial<EvaluationRunCreateInput>
): EvaluationRunCreateInput {
  return {
    createdAt,
    evaluationId: "evaluation-1",
    id: "run-1",
    jobProfileId: "job-profile-1",
    jobProfileVersion: 1,
    lifecycleSnapshot: createLifecycleSnapshot(),
    parsedSnapshotId: "parsed-snapshot-1",
    resumeId: "resume-1",
    resumeRevisionId: "resume-revision-1",
    runType: "RULE_BASED",
    templateVersionId: "template-version-1",
    ...overrides
  };
}

function createMockRepository(): EvaluationRunRepository {
  const records = new Map<string, EvaluationRunPersistenceRecord>();
  const events: EvaluationRunAuditEvent[] = [];

  return {
    async appendAuditEvent(runId, event) {
      const validated = validateEvaluationRunAuditEvent(event);

      if (!validated.success || validated.event.runId !== runId) {
        throw new Error("Invalid audit event.");
      }

      events.push(validated.event);

      return validated.event;
    },
    async createRun(input) {
      const validated = validateEvaluationRunCreateInput(input);

      if (!validated.success) {
        throw new Error(validated.error);
      }

      const record = createEvaluationRunPersistenceRecord({
        ...validated.input,
        updatedAt: validated.input.createdAt
      });

      records.set(record.id, record);

      return record;
    },
    async findRunById(runId) {
      return records.get(runId) ?? null;
    },
    async saveRunOutput(runId, output) {
      const record = records.get(runId);
      const validated = validateEvaluationRunOutputForPersistence(output);

      if (!record || !validated.success) {
        throw new Error("Invalid run output.");
      }

      const nextRecord = {
        ...record,
        output: validated.output,
        updatedAt
      };

      records.set(runId, nextRecord);

      return nextRecord;
    },
    async updateRunLifecycle(runId, snapshot) {
      const record = records.get(runId);
      const validated = validateEvaluationRunLifecycleForPersistence(snapshot);

      if (!record || !validated.success || validated.snapshot.runId !== runId) {
        throw new Error("Invalid lifecycle snapshot.");
      }

      const nextRecord = createEvaluationRunPersistenceRecord({
        ...record,
        lifecycleSnapshot: validated.snapshot,
        output: record.output,
        updatedAt
      });

      records.set(runId, nextRecord);

      return nextRecord;
    }
  };
}

describe("EvaluationRun persistence contract", () => {
  it("accepts valid create input through the contract guard", () => {
    const result = validateEvaluationRunCreateInput(createRunInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.input.lifecycleSnapshot.status).toBe("PENDING");
      expect(result.input.lifecycleSnapshot.runId).toBe(result.input.id);
    }
  });

  it("rejects invalid lifecycle snapshots before persistence", () => {
    const result = validateEvaluationRunLifecycleForPersistence(
      createLifecycleSnapshot({
        startedAt: null,
        status: "RUNNING"
      })
    );

    expect(result).toEqual({
      success: false,
      error: "RUNNING lifecycle snapshots require startedAt."
    });
  });

  it("rejects invalid output before persistence", () => {
    const result = validateEvaluationRunOutputForPersistence(
      createValidEvaluationOutput({
        recommendation: "AUTO_HIRE" as never
      })
    );

    expect(result).toEqual({
      success: false,
      error: "Unsupported recommendation value."
    });
  });

  it("normalizes output on update input and rejects lifecycle id mismatches", () => {
    const outputResult = validateEvaluationRunUpdateInput({
      output: {
        evidence: [
          {
            id: " ev_1 ",
            text: " Candidate built APIs. "
          }
        ],
        overallSummary: " Useful signal. "
      },
      runId: "run-1",
      updatedAt
    });
    const lifecycleResult = validateEvaluationRunUpdateInput({
      lifecycleSnapshot: createLifecycleSnapshot({
        runId: "run-2"
      }),
      runId: "run-1",
      updatedAt
    });

    expect(outputResult.success).toBe(true);

    if (outputResult.success) {
      expect(outputResult.input.output?.overallSummary).toBe("Useful signal.");
      expect(outputResult.input.output?.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
    }

    expect(lifecycleResult).toEqual({
      success: false,
      error: "Lifecycle snapshot runId must match EvaluationRun update runId."
    });
  });

  it("rejects audit events that are missing required fields", () => {
    const result = validateEvaluationRunAuditEvent({
      createdAt,
      eventType: "CREATED",
      runId: "run-1"
    });

    expect(result.success).toBe(false);
  });

  it("allows the repository contract to be satisfied by a mock implementation", async () => {
    const repository = createMockRepository();
    const created = await repository.createRun(createRunInput());
    const completedSnapshot = createLifecycleSnapshot({
      completedAt: updatedAt,
      startedAt: createdAt,
      status: "COMPLETED"
    });

    const updated = await repository.updateRunLifecycle("run-1", completedSnapshot);
    const saved = await repository.saveRunOutput("run-1", createValidEvaluationOutput());
    const event = await repository.appendAuditEvent("run-1", {
      createdAt: updatedAt,
      eventType: "OUTPUT_SAVED",
      metadata: {
        source: "contract-test"
      },
      runId: "run-1"
    });
    const found = await repository.findRunById("run-1");

    expect(created.status).toBe("PENDING");
    expect(updated.status).toBe("COMPLETED");
    expect(saved.output?.recommendation).toBe("POTENTIAL_FIT");
    expect(event.metadata).toEqual({
      source: "contract-test"
    });
    expect(found?.id).toBe("run-1");
  });
});
