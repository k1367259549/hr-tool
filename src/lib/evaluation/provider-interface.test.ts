import { afterEach, describe, expect, it, vi } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import {
  MockEvaluationProvider,
  type EvaluationProvider
} from "@/lib/evaluation/provider-interface";
import { createEvaluationRunAuditEvent } from "@/lib/evaluation/run-audit-contract";
import { transitionEvaluationRunLifecycle } from "@/lib/evaluation/run-state-transition";
import type { EvaluationRunCreateInput } from "@/lib/evaluation/run-persistence-contract";
import type {
  EvaluationRunLifecycleEvent,
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T11:00:00.000Z";
const startedAt = "2026-07-05T11:00:01.000Z";
const completedAt = "2026-07-05T11:00:01.025Z";

function createSequentialClock(values: string[]) {
  let index = 0;

  return () => {
    const fallback = values[0] ?? new Date(0).toISOString();
    const value = values[Math.min(index, values.length - 1)] ?? fallback;

    index += 1;

    return new Date(value);
  };
}

function createProviderInput() {
  return {
    candidateId: "candidate-1",
    jobDescription: "Build and maintain backend APIs for recruiting workflows.",
    jobProfileId: "job-profile-1",
    resumeText: "Candidate built production Node.js APIs.",
    runId: "run-1",
    templateVersionId: "template-version-1"
  };
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

function createLifecycleEvent(
  overrides?: Partial<EvaluationRunLifecycleEvent>
): EvaluationRunLifecycleEvent {
  return {
    error: null,
    eventType: "STARTED",
    fromStatus: "PENDING",
    occurredAt: startedAt,
    reason: null,
    retryRunId: null,
    runId: "run-1",
    toStatus: "RUNNING",
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
    runType: "MOCK",
    templateVersionId: "template-version-1",
    ...overrides
  };
}

function createAuditEvent(params: {
  runId: string;
  eventType: "RUN_STARTED" | "RUN_COMPLETED" | "OUTPUT_BOUND";
}) {
  const result = createEvaluationRunAuditEvent(
    {
      actor: "TEST",
      eventType: params.eventType,
      metadata: {
        source: "provider-interface-test"
      },
      runId: params.runId
    },
    {
      idGenerator: () => `audit-${params.eventType.toLowerCase()}`,
      now: new Date(completedAt)
    }
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.event;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Evaluation provider interface", () => {
  it("can be implemented by the mock provider", async () => {
    const provider: EvaluationProvider = new MockEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt]),
      version: "mock-test-v1"
    });

    const result = await provider.evaluate(createProviderInput());

    expect(provider.name).toBe("MOCK");
    expect(provider.version).toBe("mock-test-v1");
    expect(result.success).toBe(true);
  });

  it("returns valid bound output for mock success", async () => {
    const provider = new MockEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(bindEvaluationRunOutput(result.output)).toEqual({
        success: true,
        output: result.output
      });
      expect(result.output.recommendation).toBe("POTENTIAL_FIT");
    }
  });

  it("returns failureReason for mock failures", async () => {
    const provider = new MockEvaluationProvider({
      failureReason: "PROVIDER_ERROR",
      now: createSequentialClock([startedAt, completedAt]),
      shouldFail: true
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "mock-provider-failed",
        message: "Mock evaluation provider failed."
      },
      failureReason: "PROVIDER_ERROR",
      success: false
    });
  });

  it("includes provider metadata with name, version, and duration", async () => {
    const provider = new MockEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt]),
      version: "mock-metadata-v1"
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.metadata).toEqual({
      completedAt,
      durationMs: 25,
      providerName: "MOCK",
      providerVersion: "mock-metadata-v1",
      startedAt
    });
  });

  it("does not call external services", async () => {
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);

    const provider = new MockEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    await provider.evaluate(createProviderInput());

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("can run through memory repository, lifecycle transition, and audit contracts", async () => {
    const repository = new MemoryEvaluationRunRepository({
      now: () => new Date(completedAt)
    });
    const provider = new MockEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const run = await repository.createRun(createRunInput());
    const started = transitionEvaluationRunLifecycle(
      run.lifecycleSnapshot,
      createLifecycleEvent(),
      {
        now: new Date(startedAt)
      }
    );

    expect(started.success).toBe(true);

    if (!started.success) {
      throw new Error(started.error);
    }

    await repository.updateRunLifecycle("run-1", started.snapshot);
    await repository.appendAuditEvent(
      "run-1",
      createAuditEvent({
        eventType: "RUN_STARTED",
        runId: "run-1"
      })
    );

    const providerResult = await provider.evaluate({
      ...createProviderInput(),
      lifecycleSnapshot: started.snapshot
    });

    expect(providerResult.success).toBe(true);

    if (!providerResult.success) {
      throw new Error(providerResult.error.message);
    }

    await repository.saveRunOutput("run-1", providerResult.output);
    await repository.appendAuditEvent(
      "run-1",
      createAuditEvent({
        eventType: "OUTPUT_BOUND",
        runId: "run-1"
      })
    );

    const completed = transitionEvaluationRunLifecycle(
      started.snapshot,
      createLifecycleEvent({
        eventType: "COMPLETED",
        fromStatus: "RUNNING",
        occurredAt: completedAt,
        toStatus: "COMPLETED"
      }),
      {
        now: new Date(completedAt)
      }
    );

    expect(completed.success).toBe(true);

    if (!completed.success) {
      throw new Error(completed.error);
    }

    await repository.updateRunLifecycle("run-1", completed.snapshot);
    await repository.appendAuditEvent(
      "run-1",
      createAuditEvent({
        eventType: "RUN_COMPLETED",
        runId: "run-1"
      })
    );

    const persisted = await repository.findRunById("run-1");
    const auditEvents = await repository.findAuditEventsByRunId("run-1");

    expect(persisted).toMatchObject({
      output: providerResult.output,
      status: "COMPLETED"
    });
    expect(auditEvents.map((event) => event.eventType)).toEqual([
      "RUN_STARTED",
      "OUTPUT_BOUND",
      "RUN_COMPLETED"
    ]);
  });
});
