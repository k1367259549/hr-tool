import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import {
  MockEvaluationProvider,
  type EvaluationProvider,
  type EvaluationProviderInput,
  type EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
import { runEvaluationProvider } from "@/lib/evaluation/provider-runner";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";

const createdAt = "2026-07-05T14:00:00.000Z";
const nextAt = "2026-07-05T14:00:01.000Z";

function createClock() {
  let tick = 0;

  return () => {
    const timestamp = new Date(Date.parse(createdAt) + tick * 1000);

    tick += 1;

    return timestamp;
  };
}

function createIdGenerator() {
  let index = 0;

  return () => {
    index += 1;

    return `audit-${index}`;
  };
}

function createProviderInput(overrides?: Partial<EvaluationProviderInput>) {
  return {
    candidateId: "candidate-1",
    jobDescription:
      "Need a backend engineer with node api postgres docker typescript recruiting workflow experience.",
    jobProfileId: "job-profile-1",
    resumeText:
      "Built backend node api services with postgres, docker, and typescript for recruiting workflow tools.",
    runId: "run-1",
    templateVersionId: "template-version-1",
    ...overrides
  };
}

function createRepository() {
  return new MemoryEvaluationRunRepository({
    now: () => new Date(nextAt)
  });
}

class ThrowingEvaluationProvider implements EvaluationProvider {
  readonly name = "MOCK";
  readonly version = "throwing-provider-v1";

  async evaluate(input: EvaluationProviderInput): Promise<EvaluationProviderResult> {
    void input;

    throw new Error("Provider exploded.");
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runEvaluationProvider", () => {
  it("runs a mock provider success path end to end", async () => {
    const repository = createRepository();
    const provider = new MockEvaluationProvider({
      now: createClock()
    });

    const result = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider,
      repository
    });
    const run = await repository.findRunById("run-1");
    const auditEvents = await repository.findAuditEventsByRunId("run-1");

    expect(result.success).toBe(true);
    expect(run).toMatchObject({
      output: result.success ? result.output : null,
      status: "COMPLETED"
    });
    expect(auditEvents.map((event) => event.eventType)).toEqual([
      "RUN_CREATED",
      "RUN_STARTED",
      "OUTPUT_BOUND",
      "RUN_COMPLETED"
    ]);
  });

  it("runs a rule-based provider success path end to end", async () => {
    const repository = createRepository();
    const provider = new RuleBasedEvaluationProvider({
      now: createClock()
    });

    const result = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider,
      repository
    });
    const run = await repository.findRunById("run-1");

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output.overallSummary).toContain("Rule-based signal only");
      expect(run?.output).toEqual(result.output);
    }

    expect(run?.status).toBe("COMPLETED");
  });

  it("marks the run as FAILED when provider returns failure", async () => {
    const repository = createRepository();
    const provider = new MockEvaluationProvider({
      failureReason: "PROVIDER_ERROR",
      now: createClock(),
      shouldFail: true
    });

    const result = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider,
      repository
    });
    const run = await repository.findRunById("run-1");
    const auditEvents = await repository.findAuditEventsByRunId("run-1");

    expect(result).toMatchObject({
      failureReason: "PROVIDER_ERROR",
      success: false
    });
    expect(run).toMatchObject({
      output: null,
      status: "FAILED"
    });
    expect(run?.lifecycleSnapshot.error).toMatchObject({
      reason: "PROVIDER_ERROR"
    });
    expect(auditEvents.map((event) => event.eventType)).toEqual([
      "RUN_CREATED",
      "RUN_STARTED",
      "RUN_FAILED"
    ]);
  });

  it("marks the run as FAILED when provider throws", async () => {
    const repository = createRepository();

    const result = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider: new ThrowingEvaluationProvider(),
      repository
    });
    const run = await repository.findRunById("run-1");

    expect(result).toEqual({
      error: "Provider exploded.",
      failureReason: "PROVIDER_ERROR",
      runId: "run-1",
      success: false
    });
    expect(run?.status).toBe("FAILED");
    expect(run?.output).toBeNull();
    expect(run?.lifecycleSnapshot.error).toEqual({
      code: null,
      message: "Provider exploded.",
      reason: "PROVIDER_ERROR"
    });
  });

  it("saves output on success and leaves output empty on failure", async () => {
    const successRepository = createRepository();
    const failureRepository = createRepository();

    const success = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput({
        runId: "run-success"
      }),
      now: createClock(),
      provider: new MockEvaluationProvider({
        now: createClock()
      }),
      repository: successRepository
    });
    const failure = await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput({
        runId: "run-failure"
      }),
      now: createClock(),
      provider: new MockEvaluationProvider({
        now: createClock(),
        shouldFail: true
      }),
      repository: failureRepository
    });

    const successRun = await successRepository.findRunById("run-success");
    const failureRun = await failureRepository.findRunById("run-failure");

    expect(success.success).toBe(true);
    expect(failure.success).toBe(false);
    expect(successRun?.output).not.toBeNull();
    expect(failureRun?.output).toBeNull();
  });

  it("persists a findable run with the expected final lifecycle state", async () => {
    const repository = createRepository();

    await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider: new MockEvaluationProvider({
        now: createClock()
      }),
      repository
    });

    const run = await repository.findRunById("run-1");

    expect(run?.id).toBe("run-1");
    expect(run?.lifecycleSnapshot.status).toBe("COMPLETED");
    expect(run?.lifecycleSnapshot.completedAt).not.toBeNull();
  });

  it("does not call external services", async () => {
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);

    await runEvaluationProvider({
      idGenerator: createIdGenerator(),
      input: createProviderInput(),
      now: createClock(),
      provider: new RuleBasedEvaluationProvider({
        now: createClock()
      }),
      repository: createRepository()
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
