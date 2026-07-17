import {
  createLuminAIConfig,
  createLuminAIEvaluationProvider
} from "../src/lib/evaluation/luminai-config-adapter";
import {
  openAICompatibleEndpointModes,
  type OpenAICompatibleEndpointMode
} from "../src/lib/evaluation/openai-compatible-provider";
import { MemoryEvaluationRunRepository } from "../src/lib/evaluation/memory-run-repository";
import { runEvaluationProvider } from "../src/lib/evaluation/provider-runner";

type LuminAIProviderOptions = Parameters<typeof createLuminAIEvaluationProvider>[1];
type FetchImpl = NonNullable<NonNullable<LuminAIProviderOptions>["fetchImpl"]>;

type SmokeEnv = Record<string, string | undefined>;

type SmokeLogger = {
  info(message: string): void;
  error(message: string): void;
};

type SmokeOptions = {
  env?: SmokeEnv;
  fetchImpl?: FetchImpl;
  logger?: SmokeLogger;
  now?: () => Date;
  idGenerator?: () => string;
};

type SmokeResult =
  | {
      status: "skipped";
      exitCode: 0;
      message: string;
    }
  | {
      status: "success";
      exitCode: 0;
      runId: string;
      providerName: string;
      model: string | undefined;
      durationMs: number;
      overallScore: number;
      recommendation: string;
      auditEventCount: number;
    }
  | {
      status: "failed";
      exitCode: 1;
      runId?: string;
      failureReason?: string;
      error: string;
      providerName?: string;
      model?: string;
    };

const DEFAULT_MODEL = "gpt-5.5";
const DEMO_RUN_ID = "smoke-run-001";

const defaultLogger: SmokeLogger = {
  error(message) {
    console.error(message);
  },
  info(message) {
    console.log(message);
  }
};

export async function runEvaluationProviderSmoke(
  options: SmokeOptions = {}
): Promise<SmokeResult> {
  const env = options.env ?? process.env;
  const logger = options.logger ?? defaultLogger;

  if (env.EVALUATION_PROVIDER_SMOKE !== "1") {
    const message =
      "Evaluation provider smoke test skipped. Set EVALUATION_PROVIDER_SMOKE=1 to enable.";

    logger.info(message);

    return {
      status: "skipped",
      exitCode: 0,
      message
    };
  }

  if (!env.AI_BASE_URL?.trim() || !env.AI_API_KEY?.trim()) {
    const error =
      "Missing required smoke test config: AI_BASE_URL and AI_API_KEY must be set.";

    logger.error(error);

    return {
      status: "failed",
      exitCode: 1,
      error
    };
  }

  try {
    const config = createLuminAIConfig({
      apiKey: env.AI_API_KEY,
      baseUrl: env.AI_BASE_URL,
      endpointMode: parseOptionalEndpointMode(env.AI_ENDPOINT_MODE),
      model: env.AI_MODEL?.trim() ? env.AI_MODEL : DEFAULT_MODEL,
      timeoutMs: parseOptionalPositiveInteger(env.AI_TIMEOUT_MS)
    });
    const repository = new MemoryEvaluationRunRepository({
      now: options.now
    });
    const provider = createLuminAIEvaluationProvider(config, {
      fetchImpl: options.fetchImpl,
      now: options.now
    });
    const result = await runEvaluationProvider({
      idGenerator: options.idGenerator,
      input: {
        jobDescription:
          "We need a backend engineer with TypeScript, Node.js, API design, PostgreSQL, Docker, and recruiting workflow experience.",
        jobProfileId: "smoke-job-profile-001",
        resumeText:
          "Candidate built TypeScript and Node.js API services backed by PostgreSQL and Docker for recruiting workflow tools.",
        runId: DEMO_RUN_ID,
        templateVersionId: "smoke-template-001"
      },
      now: options.now,
      provider,
      repository
    });
    const auditEvents = await repository.findAuditEventsByRunId(DEMO_RUN_ID);

    if (!result.success) {
      logger.error(`failureReason=${result.failureReason}`);
      logger.error(`error=${result.error}`);
      logger.error(`providerName=${result.metadata?.providerName ?? provider.name}`);
      logger.error(`model=${result.metadata?.model ?? config.model}`);

      return {
        status: "failed",
        exitCode: 1,
        runId: result.runId,
        failureReason: result.failureReason,
        error: result.error,
        providerName: result.metadata?.providerName ?? provider.name,
        model: result.metadata?.model ?? config.model
      };
    }

    const success: SmokeResult = {
      status: "success",
      exitCode: 0,
      runId: result.runId,
      providerName: result.metadata.providerName,
      model: result.metadata.model ?? config.model,
      durationMs: result.metadata.durationMs,
      overallScore: result.output.overallScore,
      recommendation: result.output.recommendation,
      auditEventCount: auditEvents.length
    };

    logger.info("success");
    logger.info(`runId=${success.runId}`);
    logger.info(`providerName=${success.providerName}`);
    logger.info(`model=${success.model ?? "unknown"}`);
    logger.info(`durationMs=${success.durationMs}`);
    logger.info(`overallScore=${success.overallScore}`);
    logger.info(`recommendation=${success.recommendation}`);
    logger.info(`auditEventCount=${success.auditEventCount}`);

    return success;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Smoke test failed.";

    logger.error(message);

    return {
      status: "failed",
      exitCode: 1,
      error: message
    };
  }
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("AI_TIMEOUT_MS must be a positive integer.");
  }

  return parsed;
}

function parseOptionalEndpointMode(
  value: string | undefined
): OpenAICompatibleEndpointMode | undefined {
  const endpointMode = value?.trim();

  if (!endpointMode) {
    return undefined;
  }

  if (openAICompatibleEndpointModes.includes(endpointMode as OpenAICompatibleEndpointMode)) {
    return endpointMode as OpenAICompatibleEndpointMode;
  }

  throw new Error("AI_ENDPOINT_MODE must be chat-completions or responses.");
}

if (process.argv[1]?.endsWith("evaluation-provider-smoke.ts")) {
  runEvaluationProviderSmoke().then((result) => {
    process.exitCode = result.exitCode;
  });
}
