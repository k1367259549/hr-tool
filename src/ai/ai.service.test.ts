import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIGenerateInput, AIGenerateResult, JsonValue } from "@/types/ai";

const { auditLogMock, providerGenerateMock } = vi.hoisted(() => ({
  auditLogMock: vi.fn(),
  providerGenerateMock: vi.fn()
}));

vi.mock("@/ai/provider/factory", () => ({
  getAIProvider: vi.fn(() => ({
    generate: providerGenerateMock
  }))
}));

vi.mock("@/services/audit.service", () => ({
  auditService: {
    logAIRequest: auditLogMock
  }
}));

describe("aiService structured JSON pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditLogMock.mockResolvedValue(null);
  });

  it("builds prompts through registry and validates structured JSON", async () => {
    providerGenerateMock.mockResolvedValue(createAiResult(JSON.stringify({ ok: true })));
    const { aiService } = await import("@/ai/ai.service");

    const result = await aiService.generateValidatedJsonFromPrompt({
      feature: "test-feature",
      promptFile: "job-understanding.md",
      validate: validateOkJson,
      variables: {
        INPUT: {
          jobTitle: "Recruiter"
        }
      },
      workflow: "Workflow Test"
    });
    const firstCallInput = providerGenerateMock.mock.calls[0]?.[0] as AIGenerateInput;

    expect(result.output.ok).toBe(true);
    expect(result.prompt.version).toBe("1.0");
    expect(result.prompt.path).toBe("prompts/job-understanding.md");
    expect(firstCallInput.prompt).toContain("Prompt Metadata:");
    expect(firstCallInput.prompt).toContain("- category: job-understanding");
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "test-feature",
        success: true
      })
    );
  });

  it("retries once when JSON validation fails", async () => {
    providerGenerateMock
      .mockResolvedValueOnce(createAiResult("not-json"))
      .mockResolvedValueOnce(createAiResult(JSON.stringify({ ok: true })));
    const { aiService } = await import("@/ai/ai.service");

    const result = await aiService.generateValidatedJsonFromPrompt({
      feature: "test-retry",
      promptFile: "job-understanding.md",
      validate: validateOkJson,
      variables: {
        INPUT: {
          jobTitle: "Recruiter"
        }
      }
    });
    const retryCallInput = providerGenerateMock.mock.calls[1]?.[0] as AIGenerateInput;

    expect(result.output.ok).toBe(true);
    expect(result.retryCount).toBe(1);
    expect(providerGenerateMock).toHaveBeenCalledTimes(2);
    expect(retryCallInput.prompt).toContain("Retry Instruction:");
  });

  it("passes per-call timeout to the provider", async () => {
    providerGenerateMock.mockResolvedValue(createAiResult(JSON.stringify({ ok: true })));
    const { aiService } = await import("@/ai/ai.service");

    await aiService.generateValidatedJsonFromPrompt({
      feature: "test-timeout",
      promptFile: "job-understanding.md",
      timeoutMs: 123456,
      validate: validateOkJson,
      variables: {
        INPUT: {
          jobTitle: "Recruiter"
        }
      }
    });
    const firstCallInput = providerGenerateMock.mock.calls[0]?.[0] as AIGenerateInput;

    expect(firstCallInput.timeoutMs).toBe(123456);
  });
});

function createAiResult(content: string): AIGenerateResult {
  return {
    content,
    latencyMs: 12,
    model: "test-model",
    usage: {
      completionTokens: 2,
      promptTokens: 3,
      totalTokens: 5
    }
  };
}

function validateOkJson(value: JsonValue): { ok: true } {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const candidate = value as { ok?: unknown };

    if (candidate.ok === true) {
      return {
        ok: true
      };
    }
  }

  throw new Error("Expected ok JSON.");
}
