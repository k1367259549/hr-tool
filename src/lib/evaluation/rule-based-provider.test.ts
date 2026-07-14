import { afterEach, describe, expect, it, vi } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";
import * as quickScreeningEngine from "@/lib/resume-screening/rule-based-quick-screening-engine";
import type { EvaluationRunCreateInput } from "@/lib/evaluation/run-persistence-contract";
import type {
  EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

const createdAt = "2026-07-05T12:00:00.000Z";
const startedAt = "2026-07-05T12:00:01.000Z";
const completedAt = "2026-07-05T12:00:01.042Z";

function createSequentialClock(values: string[]) {
  let index = 0;

  return () => {
    const fallback = values[0] ?? new Date(0).toISOString();
    const value = values[Math.min(index, values.length - 1)] ?? fallback;

    index += 1;

    return new Date(value);
  };
}

function createProviderInput(overrides?: Partial<Parameters<RuleBasedEvaluationProvider["evaluate"]>[0]>) {
  return {
    candidateId: "candidate-1",
    jobDescription:
      "We need a backend engineer with node api postgres docker typescript recruiting workflow experience.",
    jobProfileId: "job-profile-1",
    resumeText:
      "Built backend node api services with postgres, docker, and typescript for recruiting workflow tools.",
    runId: "run-1",
    templateVersionId: "template-version-1",
    ...overrides
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RuleBasedEvaluationProvider", () => {
  it("evaluates valid job description and resume text", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output.overallScore).toBeGreaterThan(0);
      expect(result.output.overallSummary).toContain("Rule-based signal only");
      expect(result.output.evidence.length).toBeGreaterThanOrEqual(1);
      expect(result.output.dimensionScores[0]?.key).toBe("keyword-match");
      expect(result.output.interviewQuestions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("delegates rule calculation to the quick screening engine", async () => {
    const engineSpy = vi.spyOn(
      quickScreeningEngine,
      "createRuleBasedQuickScreeningResult"
    );
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });
    const input = createProviderInput();

    await provider.evaluate(input);

    expect(engineSpy).toHaveBeenCalledTimes(1);
    expect(engineSpy).toHaveBeenCalledWith(expect.objectContaining({
      jobDescription: input.jobDescription,
      resumeText: input.resumeText,
      runId: input.runId
    }));
  });

  it("returns output that can pass bindEvaluationRunOutput", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(bindEvaluationRunOutput(result.output)).toEqual({
        success: true,
        output: result.output
      });
    }
  });

  it("safely degrades when resumeText is empty or too short", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt, startedAt, completedAt])
    });

    const empty = await provider.evaluate(
      createProviderInput({
        resumeText: ""
      })
    );
    const tooShort = await provider.evaluate(
      createProviderInput({
        resumeText: "short"
      })
    );

    expect(empty.success).toBe(true);
    expect(tooShort.success).toBe(true);

    if (empty.success && tooShort.success) {
      expect(empty.output.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
      expect(tooShort.output.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
      expect(empty.output.overallScore).toBeLessThan(35);
    }
  });

  it("safely degrades when jobDescription is empty or too short", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt, startedAt, completedAt])
    });

    const empty = await provider.evaluate(
      createProviderInput({
        jobDescription: ""
      })
    );
    const tooShort = await provider.evaluate(
      createProviderInput({
        jobDescription: "short"
      })
    );

    expect(empty.success).toBe(true);
    expect(tooShort.success).toBe(true);

    if (empty.success && tooShort.success) {
      expect(empty.output.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
      expect(tooShort.output.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
      expect(empty.output.overallScore).toBeLessThan(35);
    }
  });

  it("does not call fetch or external services", async () => {
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);

    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    await provider.evaluate(createProviderInput());

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns provider metadata with name, version, and duration", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt]),
      version: "0.1.0-test"
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.metadata).toEqual({
      completedAt,
      durationMs: 42,
      providerName: "RULE_BASED",
      providerVersion: "0.1.0-test",
      startedAt
    });
  });

  it("does not emit hire, reject, or automatic decision recommendations", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(["STRONG_FIT", "POTENTIAL_FIT", "UNCERTAIN", "NOT_ENOUGH_EVIDENCE"]).toContain(
        result.output.recommendation
      );
      expect(result.output.recommendation).not.toMatch(/HIRE|REJECT|AUTO/i);
      expect(result.output.notes).toContain("not a hiring decision");
    }
  });

  it("keeps scores in the schema range", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.output.overallScore).toBeLessThanOrEqual(100);
      expect(result.output.dimensionScores[0]?.score).toBeGreaterThanOrEqual(0);
      expect(result.output.dimensionScores[0]?.score).toBeLessThanOrEqual(100);
    }
  });

  it("can save output through MemoryEvaluationRunRepository", async () => {
    const provider = new RuleBasedEvaluationProvider({
      now: createSequentialClock([startedAt, completedAt])
    });
    const repository = new MemoryEvaluationRunRepository({
      now: () => new Date(completedAt)
    });

    await repository.createRun(createRunInput());

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error(result.error.message);
    }

    const saved = await repository.saveRunOutput("run-1", result.output);

    expect(saved.output).toEqual(result.output);
    expect(saved.output?.overallSummary).toContain("Rule-based signal only");
  });
});
