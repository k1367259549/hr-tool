import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import {
  createEvaluationProviderFromRuntimeConfig,
  readEvaluationProviderRuntimeConfig
} from "@/lib/evaluation/provider-runtime-config";
import { runEvaluationProvider } from "@/lib/evaluation/provider-runner";
import type {
  EvaluationProviderMetadata
} from "@/lib/evaluation/provider-interface";
import type {
  EvaluationProviderRuntimeSafeSummary
} from "@/lib/evaluation/provider-runtime-config";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

type EvaluationDemoSuccessResponse = {
  success: true;
  runId: string;
  output: ResumeEvaluationResult;
  metadata: EvaluationDemoMetadata;
  auditEventCount: number;
};

type EvaluationDemoFailureResponse = {
  success: false;
  runId?: string;
  failureReason?: string;
  error: string;
  metadata: EvaluationDemoMetadata;
};

type EvaluationDemoMetadata = {
  runtimeConfig: EvaluationProviderRuntimeSafeSummary;
  providerName?: string;
  providerVersion?: string;
  model?: string;
  durationMs?: number;
};

const EvaluationDemoRequestSchema = z
  .object({
    resumeText: z
      .string({
        required_error: "resumeText is required."
      })
      .trim()
      .min(1, "resumeText is required."),
    jobDescription: z
      .string({
        required_error: "jobDescription is required."
      })
      .trim()
      .min(1, "jobDescription is required."),
    candidateName: z.string().trim().min(1).max(120).optional(),
    jobTitle: z.string().trim().min(1).max(120).optional()
  })
  .strict();

export async function POST(request: NextRequest): Promise<Response> {
  let runtimeConfig;

  try {
    const body = await readJsonBody(request);
    const parsed = EvaluationDemoRequestSchema.safeParse(body);

    if (!parsed.success) {
      return failureResponse(
        parsed.error.issues[0]?.message ?? "Invalid evaluation demo request.",
        400,
        fallbackMetadata(process.env)
      );
    }

    runtimeConfig = readEvaluationProviderRuntimeConfig(process.env);

    const provider = createEvaluationProviderFromRuntimeConfig(runtimeConfig);
    const repository = new MemoryEvaluationRunRepository();
    const runId = `evaluation-demo-${Date.now().toString(36)}`;
    const result = await runEvaluationProvider({
      input: {
        candidateId: parsed.data.candidateName
          ? slugify(parsed.data.candidateName)
          : undefined,
        jobDescription: parsed.data.jobTitle
          ? `${parsed.data.jobTitle}\n\n${parsed.data.jobDescription}`
          : parsed.data.jobDescription,
        jobProfileId: parsed.data.jobTitle ? slugify(parsed.data.jobTitle) : undefined,
        resumeText: parsed.data.resumeText,
        runId,
        templateVersionId: "evaluation-demo"
      },
      provider,
      repository
    });
    const auditEvents = await repository.findAuditEventsByRunId(runId);

    if (!result.success) {
      return failureResponse(result.error, 200, createMetadata(runtimeConfig.safeSummary, result.metadata), {
        failureReason: result.failureReason,
        runId: result.runId
      });
    }

    return NextResponse.json<EvaluationDemoSuccessResponse>({
      success: true,
      runId: result.runId,
      output: result.output,
      metadata: createMetadata(runtimeConfig.safeSummary, result.metadata),
      auditEventCount: auditEvents.length
    });
  } catch (error) {
    return failureResponse(
      error instanceof Error ? error.message : "Evaluation demo failed.",
      400,
      createMetadata(runtimeConfig?.safeSummary ?? fallbackRuntimeSummary(process.env))
    );
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function failureResponse(
  error: string,
  status: number,
  metadata: EvaluationDemoMetadata,
  options: {
    runId?: string;
    failureReason?: string;
  } = {}
): NextResponse<EvaluationDemoFailureResponse> {
  return NextResponse.json(
    {
      success: false,
      runId: options.runId,
      failureReason: options.failureReason,
      error,
      metadata
    },
    {
      status
    }
  );
}

function createMetadata(
  runtimeConfig: EvaluationProviderRuntimeSafeSummary,
  providerMetadata?: EvaluationProviderMetadata
): EvaluationDemoMetadata {
  return {
    runtimeConfig,
    providerName: providerMetadata?.providerName,
    providerVersion: providerMetadata?.providerVersion,
    model:
      providerMetadata?.model ??
      (runtimeConfig.provider === "openai-compatible" ? runtimeConfig.model : undefined),
    durationMs: providerMetadata?.durationMs
  };
}

function fallbackMetadata(env: NodeJS.ProcessEnv): EvaluationDemoMetadata {
  return {
    runtimeConfig: fallbackRuntimeSummary(env)
  };
}

function fallbackRuntimeSummary(env: NodeJS.ProcessEnv): EvaluationProviderRuntimeSafeSummary {
  if (env.AI_PROVIDER === "openai-compatible") {
    return {
      provider: "openai-compatible",
      baseUrl: env.AI_BASE_URL?.trim() ?? "",
      hasApiKey: Boolean(env.AI_API_KEY?.trim()),
      model: env.AI_MODEL?.trim() || "gpt-5.5",
      requiresApiKey: true,
      timeoutMs: Number(env.AI_TIMEOUT_MS) || 30_000
    };
  }

  return {
    provider: "rule-based",
    requiresApiKey: false
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "evaluation-demo"
  );
}
