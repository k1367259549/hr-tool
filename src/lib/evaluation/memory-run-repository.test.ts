import { describe, expect, it } from "vitest";
import { createEvaluationRunAuditEvent } from "@/lib/evaluation/run-audit-contract";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import type {
  EvaluationRunCreateInput,
  EvaluationRunPersistenceRecord
} from "@/lib/evaluation/run-persistence-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { EvaluationRunLifecycleSnapshot } from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T10:00:00.000Z";
const updatedAt = "2026-07-05T10:01:00.000Z";

function createRepository() {
  return new MemoryEvaluationRunRepository({
    now: () => new Date(updatedAt)
  });
}

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

function createRunInput(
  overrides?: Partial<EvaluationRunCreateInput>
): EvaluationRunCreateInput {
  const id = overrides?.id ?? "run-1";

  return {
    createdAt,
    evaluationId: "evaluation-1",
    id,
    jobProfileId: "job-profile-1",
    jobProfileVersion: 1,
    lifecycleSnapshot: createLifecycleSnapshot({
      runId: id
    }),
    parsedSnapshotId: "parsed-snapshot-1",
    resumeId: "resume-1",
    resumeRevisionId: "resume-revision-1",
    runType: "RULE_BASED",
    templateVersionId: "template-version-1",
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

function createAuditEvent(runId = "run-1") {
  const result = createEvaluationRunAuditEvent(
    {
      actor: "TEST",
      eventType: "RUN_CREATED",
      metadata: {
        source: "memory-repository-test"
      },
      runId
    },
    {
      idGenerator: () => `audit-${runId}`,
      now: new Date(createdAt)
    }
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.event;
}

describe("MemoryEvaluationRunRepository", () => {
  it("creates a run without auto-appending audit events", async () => {
    const repository = createRepository();
    const run = await repository.createRun(createRunInput());
    const auditEvents = await repository.findAuditEventsByRunId("run-1");

    expect(run).toMatchObject({
      id: "run-1",
      output: null,
      status: "PENDING",
      updatedAt: createdAt
    });
    expect(auditEvents).toEqual([]);
  });

  it("reads a created run by id and returns null for missing runs", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());

    await expect(repository.findRunById("run-1")).resolves.toMatchObject({
      id: "run-1"
    });
    await expect(repository.findRunById("missing-run")).resolves.toBeNull();
  });

  it("updates lifecycle state after validation", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());

    const updated = await repository.updateRunLifecycle(
      "run-1",
      createLifecycleSnapshot({
        startedAt: createdAt,
        status: "RUNNING"
      })
    );

    expect(updated).toMatchObject({
      status: "RUNNING",
      updatedAt
    });
  });

  it("saves normalized run output", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());

    const saved = await repository.saveRunOutput("run-1", {
      evidence: [
        {
          id: " ev_1 ",
          text: " Candidate built APIs. "
        }
      ],
      overallSummary: " Useful signal. "
    } as ResumeEvaluationResult);

    expect(saved.output).toMatchObject({
      overallScore: 0,
      overallSummary: "Useful signal.",
      recommendation: "NOT_ENOUGH_EVIDENCE"
    });
  });

  it("rejects invalid output and invalid lifecycle snapshots", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());

    await expect(
      repository.saveRunOutput(
        "run-1",
        createValidEvaluationOutput({
          recommendation: "AUTO_HIRE" as never
        })
      )
    ).rejects.toThrow("Unsupported recommendation value.");

    await expect(
      repository.updateRunLifecycle(
        "run-1",
        createLifecycleSnapshot({
          startedAt: null,
          status: "RUNNING"
        })
      )
    ).rejects.toThrow("RUNNING lifecycle snapshots require startedAt.");
  });

  it("appends validated audit events and rejects runId mismatches", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());

    const event = await repository.appendAuditEvent("run-1", createAuditEvent());
    const events = await repository.findAuditEventsByRunId("run-1");

    expect(event.eventType).toBe("RUN_CREATED");
    expect(events).toEqual([event]);

    await expect(
      repository.appendAuditEvent("run-1", createAuditEvent("run-2"))
    ).rejects.toThrow("Audit event runId must match EvaluationRun runId.");
  });

  it("does not expose mutable internal run or audit references", async () => {
    const repository = createRepository();

    const created = await repository.createRun(createRunInput());
    const event = await repository.appendAuditEvent("run-1", createAuditEvent());

    created.status = "FAILED";
    created.lifecycleSnapshot.status = "FAILED";
    event.metadata.source = "mutated";

    const found = await repository.findRunById("run-1");
    const events = await repository.findAuditEventsByRunId("run-1");

    expect(found?.status).toBe("PENDING");
    expect(found?.lifecycleSnapshot.status).toBe("PENDING");
    expect(events[0]?.metadata.source).toBe("memory-repository-test");
  });

  it("keeps multiple runs isolated", async () => {
    const repository = createRepository();

    await repository.createRun(createRunInput());
    await repository.createRun(
      createRunInput({
        evaluationId: "evaluation-2",
        id: "run-2",
        lifecycleSnapshot: createLifecycleSnapshot({
          runId: "run-2"
        })
      })
    );

    await repository.updateRunLifecycle(
      "run-2",
      createLifecycleSnapshot({
        completedAt: updatedAt,
        runId: "run-2",
        startedAt: createdAt,
        status: "COMPLETED"
      })
    );
    await repository.saveRunOutput("run-2", createValidEvaluationOutput());

    const run1 = (await repository.findRunById("run-1")) as EvaluationRunPersistenceRecord;
    const run2 = (await repository.findRunById("run-2")) as EvaluationRunPersistenceRecord;

    expect(run1.status).toBe("PENDING");
    expect(run1.output).toBeNull();
    expect(run2.status).toBe("COMPLETED");
    expect(run2.output?.recommendation).toBe("POTENTIAL_FIT");
  });
});
