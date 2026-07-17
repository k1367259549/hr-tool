import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createEvaluationProviderFromRuntimeConfig,
  readEvaluationProviderRuntimeConfig
} from "@/lib/evaluation/provider-runtime-config";

type ProviderOptions = Parameters<typeof createEvaluationProviderFromRuntimeConfig>[1];
type FetchImpl = NonNullable<NonNullable<ProviderOptions>["fetchImpl"]>;

describe("Evaluation provider runtime config", () => {
  it("creates rule-based provider config without requiring API credentials", () => {
    const config = readEvaluationProviderRuntimeConfig({
      AI_PROVIDER: "rule-based"
    });
    const provider = createEvaluationProviderFromRuntimeConfig(config);

    expect(config).toEqual({
      provider: "rule-based",
      safeSummary: {
        provider: "rule-based",
        requiresApiKey: false
      }
    });
    expect(provider.name).toBe("RULE_BASED");
  });

  it("defaults to rule-based when AI_PROVIDER is omitted", () => {
    const config = readEvaluationProviderRuntimeConfig({});

    expect(config.provider).toBe("rule-based");
  });

  it("rejects openai-compatible config without apiKey", () => {
    expect(() =>
      readEvaluationProviderRuntimeConfig({
        AI_BASE_URL: "https://luminai.test",
        AI_PROVIDER: "openai-compatible"
      })
    ).toThrow("AI_API_KEY is required for openai-compatible provider.");
  });

  it("rejects openai-compatible config without baseUrl", () => {
    expect(() =>
      readEvaluationProviderRuntimeConfig({
        AI_API_KEY: "secret-key",
        AI_PROVIDER: "openai-compatible"
      })
    ).toThrow("AI_BASE_URL is required for openai-compatible provider.");
  });

  it("accepts valid openai-compatible config", () => {
    const config = readEvaluationProviderRuntimeConfig({
      AI_API_KEY: "secret-key",
      AI_BASE_URL: "https://luminai.test/",
      AI_MODEL: "custom-model",
      AI_PROVIDER: "openai-compatible",
      AI_TIMEOUT_MS: "12000"
    });

    expect(config).toEqual({
      provider: "openai-compatible",
      luminAIConfig: {
        apiKey: "secret-key",
        baseUrl: "https://luminai.test",
        endpointMode: "chat-completions",
        model: "custom-model",
        timeoutMs: 12000
      },
      safeSummary: {
        baseUrl: "https://luminai.test",
        endpointMode: "chat-completions",
        hasApiKey: true,
        model: "custom-model",
        provider: "openai-compatible",
        requiresApiKey: true,
        timeoutMs: 12000
      }
    });
  });

  it("rejects non-numeric AI_TIMEOUT_MS", () => {
    expect(() =>
      readEvaluationProviderRuntimeConfig({
        AI_API_KEY: "secret-key",
        AI_BASE_URL: "https://luminai.test",
        AI_PROVIDER: "openai-compatible",
        AI_TIMEOUT_MS: "soon"
      })
    ).toThrow("AI_TIMEOUT_MS must be a positive integer.");
  });

  it("applies default model and timeout for openai-compatible config", () => {
    const config = readEvaluationProviderRuntimeConfig({
      AI_API_KEY: "secret-key",
      AI_BASE_URL: "https://luminai.test",
      AI_PROVIDER: "openai-compatible"
    });

    expect(config.provider).toBe("openai-compatible");

    if (config.provider === "openai-compatible") {
      expect(config.luminAIConfig.model).toBe("gpt-5.5");
      expect(config.luminAIConfig.endpointMode).toBe("chat-completions");
      expect(config.luminAIConfig.timeoutMs).toBe(30_000);

      if (config.safeSummary.provider === "openai-compatible") {
        expect(config.safeSummary.model).toBe("gpt-5.5");
        expect(config.safeSummary.timeoutMs).toBe(30_000);
      }
    }
  });

  it("does not leak apiKey to safe summary", () => {
    const config = readEvaluationProviderRuntimeConfig({
      AI_API_KEY: "secret-key-that-must-not-appear",
      AI_BASE_URL: "https://luminai.test",
      AI_PROVIDER: "openai-compatible"
    });

    expect(JSON.stringify(config.safeSummary)).not.toContain(
      "secret-key-that-must-not-appear"
    );
  });

  it("creates provider without calling external services", () => {
    let callCount = 0;
    const fetchImpl: FetchImpl = async () => {
      callCount += 1;

      return {
        ok: true,
        status: 200,
        async json() {
          return {};
        }
      };
    };
    const config = readEvaluationProviderRuntimeConfig({
      AI_API_KEY: "secret-key",
      AI_BASE_URL: "https://luminai.test",
      AI_PROVIDER: "openai-compatible"
    });
    const provider = createEvaluationProviderFromRuntimeConfig(config, {
      fetchImpl
    });

    expect(provider.name).toBe("OPENAI_COMPATIBLE");
    expect(callCount).toBe(0);
  });

  it("does not directly read process.env", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/evaluation/provider-runtime-config.ts"),
      "utf8"
    );

    expect(source).not.toContain("process.env");
  });

  it("rejects unsupported AI_PROVIDER values", () => {
    expect(() =>
      readEvaluationProviderRuntimeConfig({
        AI_PROVIDER: "luminai"
      })
    ).toThrow("AI_PROVIDER must be openai-compatible or rule-based.");
  });

  it("accepts responses endpoint mode and rejects invalid values", () => {
    const config = readEvaluationProviderRuntimeConfig({
      AI_API_KEY: "secret-key",
      AI_BASE_URL: "https://luminai.test/v1",
      AI_ENDPOINT_MODE: "responses",
      AI_PROVIDER: "openai-compatible"
    });

    expect(config.provider).toBe("openai-compatible");
    if (config.provider === "openai-compatible") {
      expect(config.luminAIConfig.endpointMode).toBe("responses");
    }

    expect(() =>
      readEvaluationProviderRuntimeConfig({
        AI_API_KEY: "secret-key",
        AI_BASE_URL: "https://luminai.test",
        AI_ENDPOINT_MODE: "automatic",
        AI_PROVIDER: "openai-compatible"
      })
    ).toThrow("AI_ENDPOINT_MODE must be chat-completions or responses.");
  });
});
