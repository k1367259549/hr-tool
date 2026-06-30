import { afterEach, describe, expect, it, vi } from "vitest";

describe("config validation", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("missing required config is detected", async () => {
    process.env = {
      ...process.env,
      DATABASE_URL: undefined,
      NODE_ENV: "test",
      OPENAI_API_KEY: undefined
    };
    vi.resetModules();

    const { ConfigValidationError, validateConfig } = await import("@/utils/configValidation");

    expect(() => validateConfig()).toThrow(ConfigValidationError);
  });

  it("valid required config passes", async () => {
    process.env = {
      ...process.env,
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hr_daily",
      NODE_ENV: "test",
      OPENAI_API_KEY: "test-key"
    };
    vi.resetModules();

    const { validateConfig } = await import("@/utils/configValidation");

    expect(() => validateConfig()).not.toThrow();
  });
});
