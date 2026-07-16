import { Prisma } from "@prisma/client";
import { MemoryEvaluationRunRepository } from "@/lib/evaluation/memory-run-repository";
import { runEvaluationProvider } from "@/lib/evaluation/provider-runner";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";
import { prisma } from "@/lib/prisma";
import {
  adaptDetailedScreeningResultToLegacyEvaluationResult,
  resolveDetailedScreeningResult,
  type DetailedScreeningCompatibilityStatus
} from "@/lib/resume-screening/detailed-screening-contract";
import { validateAndNormalizeDetailedCriterionAssessments } from "@/lib/resume-screening/detailed-criterion-contract";
import {
  resolveQuickScreeningResult,
  toQuickScreeningCompatibilityFields
} from "@/lib/resume-screening/quick-screening-contract";
import { adaptQuickScreeningResultToLegacyEvaluationResult } from "@/lib/resume-screening/rule-based-quick-screening-engine";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import type {
  EvaluationProvider,
  EvaluationProviderMetadata,
  EvaluationProviderResult
} from "@/lib/evaluation/provider-interface";
import type { JsonValue } from "@/types/ai";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type {
  DetailedAnalysisRunDto,
  QuickScreeningRunDto,
  ResumeEvaluationRunDto,
  ResumeEvaluationRunSafeRecord
} from "@/types/resumeEvaluationRun";
import type {
  AnyDetailedScreeningResult
} from "@/types/resume-screening";
import type { EvaluationCriterion } from "@/types/evaluationTemplate";
import { parseEvaluationCriteriaJson } from "@/utils/evaluationTemplateValidation";

export class ResumeEvaluationRunServiceError extends Error {
  readonly code:
    | "VALIDATION_ERROR"
    | "DATABASE_ERROR"
    | "NOT_FOUND"
    | "CONFLICT"
    | "CONFIG_ERROR";

  constructor(
    code:
      | "VALIDATION_ERROR"
      | "DATABASE_ERROR"
      | "NOT_FOUND"
      | "CONFLICT"
      | "CONFIG_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ResumeEvaluationRunServiceError";
    this.code = code;
  }
}

export const resumeEvaluationRunService = {
  async createMockEvaluationRun(evaluationId: string): Promise<ResumeEvaluationRunDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const evaluation = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

        if (!evaluation) {
          throw new ResumeEvaluationRunServiceError("NOT_FOUND", "评估记录不存在。");
        }

        if (!evaluation.resumeRevisionId || !evaluation.parsedSnapshotId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "评估记录缺少实际使用的简历修订版本或解析快照，不能创建 run。"
          );
        }

        const revision = await resumeRevisionRepository.findRevisionWithSnapshotById(
          evaluation.resumeRevisionId,
          tx
        );

        if (!revision || revision.resumeId !== evaluation.resumeId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "简历修订版本不属于当前评估简历。"
          );
        }

        if (revision.parsedSnapshot?.id !== evaluation.parsedSnapshotId) {
          throw new ResumeEvaluationRunServiceError(
            "VALIDATION_ERROR",
            "解析快照不属于当前评估简历修订版本。"
          );
        }

        const run = await resumeEvaluationRunRepository.createRun(
          {
            completedAt: new Date(),
            evaluationId: evaluation.id,
            jobProfileId: evaluation.jobProfileId,
            jobProfileVersion: evaluation.jobProfileVersion,
            parsedOutputJson: createMockParsedOutput(),
            parsedSnapshotId: evaluation.parsedSnapshotId,
            resumeId: evaluation.resumeId,
            resumeRevisionId: evaluation.resumeRevisionId,
            runType: "MOCK",
            status: "SUCCEEDED",
            templateVersionId: evaluation.templateVersionId
          },
          tx
        );

        return toDto(run);
      });
    } catch (error) {
      throw normalizeError(error, "创建评估 run 失败。");
    }
  },

  async createQuickScreeningRun(evaluationId: string): Promise<QuickScreeningRunDto> {
    try {
      const context = await resolveRunContext(evaluationId);
      const provider = new RuleBasedEvaluationProvider();
      const providerResult = await provider.evaluate({
        evaluationTemplateVersionId: context.evaluation.templateVersionId,
        jobDescription: context.jobDescription,
        jobTitle: context.jobTitle,
        jobProfileId: context.evaluation.jobProfileId,
        jobUnderstandingJson: context.jobUnderstandingJson,
        jobUnderstandingSummary: context.jobUnderstandingSummary,
        resumeText: context.resumeText,
        runId: `quick-screening-${evaluationId}`,
        templateVersionId: context.evaluation.templateVersionId
      });
      const completedAt = new Date();
      const run = await createRunFromProviderResult(
        context,
        provider.version,
        providerResult,
        completedAt
      );

      if (!providerResult.success) {
        throw new ResumeEvaluationRunServiceError(
          "VALIDATION_ERROR",
          providerResult.error.message
        );
      }

      const screeningResult = resolveQuickScreeningResult(run.parsedOutputJson);

      if (!screeningResult.success) {
        throw new ResumeEvaluationRunServiceError(
          "VALIDATION_ERROR",
          screeningResult.message
        );
      }

      return {
        run: toDto(run),
        screeningResult: screeningResult.result,
        result: toQuickScreeningCompatibilityFields(screeningResult.result)
      };
    } catch (error) {
      throw normalizeError(error, "创建快速初筛 run 失败。");
    }
  },

  async createDetailedAnalysisRun(
    evaluationId: string,
    options: DetailedAnalysisRunOptions
  ): Promise<DetailedAnalysisRunDto> {
    try {
      const context = await resolveRunContext(evaluationId);

      assertDetailedAnalysisInputReady(context);

      const runs = await resumeEvaluationRunRepository.listRunsByEvaluationId(evaluationId);

      assertDetailedAnalysisPreconditions(runs);
      const evaluationCriteria = await loadDetailedEvaluationCriteria(
        context.evaluation.templateVersionId
      );

      if (options.provider.name !== "OPENAI_COMPATIBLE") {
        throw new ResumeEvaluationRunServiceError(
          "CONFIG_ERROR",
          "详细分析需要配置 openai-compatible AI Provider。请设置 AI_PROVIDER=openai-compatible 以及对应 AI_BASE_URL / AI_API_KEY。"
        );
      }

      const pendingRun = await resumeEvaluationRunRepository.createRun({
        evaluationId: context.evaluation.id,
        jobProfileId: context.evaluation.jobProfileId,
        jobProfileVersion: context.evaluation.jobProfileVersion,
        modelProvider: options.provider.name,
        parsedSnapshotId: context.evaluation.parsedSnapshotId,
        resumeId: context.evaluation.resumeId,
        resumeRevisionId: context.evaluation.resumeRevisionId,
        runType: "AI",
        status: "PENDING",
        templateVersionId: context.evaluation.templateVersionId
      });

      const now = options.now ?? (() => new Date());
      const providerResult = await runEvaluationProvider({
        idGenerator: options.idGenerator,
        input: createDetailedProviderInput(context, pendingRun.id, evaluationCriteria),
        now,
        provider: options.provider,
        repository: new MemoryEvaluationRunRepository({
          now
        })
      });

      if (!providerResult.success) {
        await resumeEvaluationRunRepository.failRun(pendingRun.id, {
          completedAt: getCompletedAt(providerResult.metadata, now),
          errorCode: providerResult.failureReason,
          errorMessage: providerResult.error,
          latencyMs: providerResult.metadata?.durationMs ?? null,
          modelName: providerResult.metadata?.model ?? options.provider.version,
          modelProvider: providerResult.metadata?.providerName ?? options.provider.name,
          promptVersion: providerResult.metadata?.promptVersion ?? null
        });

        return {
          error: providerResult.error,
          evaluationId,
          failureReason: providerResult.failureReason,
          metadata: providerResult.metadata,
          runId: pendingRun.id,
          success: false
        };
      }

      const detailed = resolveDetailedProviderResult(
        providerResult.detailedScreeningResult
      );

      if (!detailed.success) {
        await resumeEvaluationRunRepository.failRun(pendingRun.id, {
          completedAt: getCompletedAt(providerResult.metadata, now),
          errorCode: "VALIDATION_ERROR",
          errorMessage: detailed.error,
          latencyMs: providerResult.metadata.durationMs,
          modelName: providerResult.metadata.model ?? options.provider.version,
          modelProvider: providerResult.metadata.providerName,
          promptVersion: providerResult.metadata.promptVersion ?? null
        });

        return {
          error: detailed.error,
          evaluationId,
          failureReason: "VALIDATION_ERROR",
          metadata: providerResult.metadata,
          runId: pendingRun.id,
          success: false
        };
      }

      if (detailed.result.schemaVersion !== "m11-a.detailed.v2") {
        await resumeEvaluationRunRepository.failRun(pendingRun.id, {
          completedAt: getCompletedAt(providerResult.metadata, now),
          errorCode: "VALIDATION_ERROR",
          errorMessage: "详细分析未返回 criterion-aware V2 结果。",
          latencyMs: providerResult.metadata.durationMs,
          modelName: providerResult.metadata.model ?? options.provider.version,
          modelProvider: providerResult.metadata.providerName,
          promptVersion: providerResult.metadata.promptVersion ?? null
        });
        return {
          error: "详细分析未返回 criterion-aware V2 结果。",
          evaluationId,
          failureReason: "VALIDATION_ERROR",
          metadata: providerResult.metadata,
          runId: pendingRun.id,
          success: false
        };
      }

      const criterionContract = validateAndNormalizeDetailedCriterionAssessments(
        evaluationCriteria,
        detailed.result
      );
      if (!criterionContract.success) {
        await resumeEvaluationRunRepository.failRun(pendingRun.id, {
          completedAt: getCompletedAt(providerResult.metadata, now),
          errorCode: "VALIDATION_ERROR",
          errorMessage: criterionContract.message,
          latencyMs: providerResult.metadata.durationMs,
          modelName: providerResult.metadata.model ?? options.provider.version,
          modelProvider: providerResult.metadata.providerName,
          promptVersion: providerResult.metadata.promptVersion ?? null
        });
        return {
          error: criterionContract.message,
          evaluationId,
          failureReason: "VALIDATION_ERROR",
          metadata: providerResult.metadata,
          runId: pendingRun.id,
          success: false
        };
      }
      detailed.result = criterionContract.result;

      const legacyOutput = adaptDetailedScreeningResultToLegacyEvaluationResult(
        detailed.result
      );
      const completedRun = await resumeEvaluationRunRepository.completeRun(
        pendingRun.id,
        createDetailedCompletionInput(
          detailed.result,
          legacyOutput,
          providerResult.metadata
        )
      );
      const storedDetailed = resolveDetailedProviderResult(
        completedRun.parsedOutputJson
      );

      if (!storedDetailed.success) {
        await resumeEvaluationRunRepository.failRun(pendingRun.id, {
          completedAt: getCompletedAt(providerResult.metadata, now),
          errorCode: "VALIDATION_ERROR",
          errorMessage: storedDetailed.error,
          latencyMs: providerResult.metadata.durationMs,
          modelName: providerResult.metadata.model ?? options.provider.version,
          modelProvider: providerResult.metadata.providerName,
          promptVersion: providerResult.metadata.promptVersion ?? null
        });

        return {
          error: storedDetailed.error,
          evaluationId,
          failureReason: "VALIDATION_ERROR",
          metadata: providerResult.metadata,
          runId: pendingRun.id,
          success: false
        };
      }

      return toDetailedAnalysisRunDto(
        completedRun,
        storedDetailed.result,
        legacyOutput,
        providerResult.metadata,
        storedDetailed.compatibilityStatus
      );
    } catch (error) {
      throw normalizeError(error, "创建详细分析 run 失败。");
    }
  },

  async getLatestDetailedAnalysisRunByEvaluationId(
    evaluationId: string
  ): Promise<DetailedAnalysisRunDto | null> {
    try {
      const runs = await resumeEvaluationRunRepository.listRunsByEvaluationId(evaluationId);
      const latestDetailedRun = runs.find(
        (run) => run.runType === "AI" && run.status === "SUCCEEDED"
      );

      if (!latestDetailedRun) {
        return null;
      }

      const detailed = resolveDetailedProviderResult(
        latestDetailedRun.parsedOutputJson
      );

      if (!detailed.success) {
        throw new ResumeEvaluationRunServiceError(
          "VALIDATION_ERROR",
          "历史详细分析结果格式不完整，请重新运行详细分析。"
        );
      }

      const legacyOutput = adaptDetailedScreeningResultToLegacyEvaluationResult(
        detailed.result
      );

      return toDetailedAnalysisRunDto(
        latestDetailedRun,
        detailed.result,
        legacyOutput,
        createHistoricalDetailedMetadata(latestDetailedRun),
        detailed.compatibilityStatus
      );
    } catch (error) {
      throw normalizeError(error, "查询最新详细分析 run 失败。");
    }
  },

  async listRunsByEvaluationId(evaluationId: string): Promise<ResumeEvaluationRunDto[]> {
    try {
      const runs = await resumeEvaluationRunRepository.listRunsByEvaluationId(evaluationId);

      return runs.map(toDto);
    } catch (error) {
      throw normalizeError(error, "查询评估 run 列表失败。");
    }
  },

  async getLatestSuccessfulRunByEvaluationId(
    evaluationId: string
  ): Promise<ResumeEvaluationRunDto | null> {
    try {
      const run = await resumeEvaluationRunRepository.findLatestSuccessfulRun(evaluationId);

      return run ? toDto(run) : null;
    } catch (error) {
      throw normalizeError(error, "查询最新成功评估 run 失败。");
    }
  },

  async getLatestSuccessfulRun(evaluationId: string): Promise<ResumeEvaluationRunDto | null> {
    return this.getLatestSuccessfulRunByEvaluationId(evaluationId);
  }
};

type QuickScreeningRunContext = {
  evaluation: {
    id: string;
    resumeId: string;
    resumeRevisionId: string;
    parsedSnapshotId: string;
    jobProfileId: string;
    templateVersionId: string;
    jobProfileVersion: string;
  };
  jobDescription: string;
  jobTitle: string;
  jobUnderstandingJson: JsonValue;
  jobUnderstandingSummary: string;
  resumeText: string;
};

type DetailedAnalysisRunOptions = {
  provider: EvaluationProvider;
  now?: () => Date;
  idGenerator?: () => string;
};

type DetailedScreeningResolution =
  | {
      success: true;
      result: AnyDetailedScreeningResult;
      compatibilityStatus: Exclude<DetailedScreeningCompatibilityStatus, "INVALID">;
    }
  | {
      success: false;
      error: string;
    };

async function resolveRunContext(evaluationId: string): Promise<QuickScreeningRunContext> {
  return prisma.$transaction(async (tx) => {
    const evaluation = await resumeEvaluationRepository.findDetailById(evaluationId, tx);

    if (!evaluation) {
      throw new ResumeEvaluationRunServiceError("NOT_FOUND", "评估记录不存在。");
    }

    if (!evaluation.resumeRevisionId || !evaluation.parsedSnapshotId) {
      throw new ResumeEvaluationRunServiceError(
        "VALIDATION_ERROR",
        "评估记录缺少实际使用的简历修订版本或解析快照，不能创建 run。"
      );
    }

    const revision = await resumeRevisionRepository.findRevisionWithSnapshotById(
      evaluation.resumeRevisionId,
      tx
    );

    if (!revision || revision.resumeId !== evaluation.resumeId) {
      throw new ResumeEvaluationRunServiceError(
        "VALIDATION_ERROR",
        "简历修订版本不属于当前评估简历。"
      );
    }

    if (revision.parsedSnapshot?.id !== evaluation.parsedSnapshotId) {
      throw new ResumeEvaluationRunServiceError(
        "VALIDATION_ERROR",
        "解析快照不属于当前评估简历修订版本。"
      );
    }

    const jobProfile = await jobProfileRepository.findById(evaluation.jobProfileId, tx);

    if (!jobProfile) {
      throw new ResumeEvaluationRunServiceError("NOT_FOUND", "岗位画像不存在。");
    }

    return {
      evaluation: {
        id: evaluation.id,
        jobProfileId: evaluation.jobProfileId,
        jobProfileVersion: evaluation.jobProfileVersion,
        parsedSnapshotId: evaluation.parsedSnapshotId,
        resumeId: evaluation.resumeId,
        resumeRevisionId: evaluation.resumeRevisionId,
        templateVersionId: evaluation.templateVersionId
      },
      jobDescription: createJobDescription(jobProfile),
      jobTitle: jobProfile.jobTitle,
      jobUnderstandingJson: createJobUnderstandingContext(jobProfile),
      jobUnderstandingSummary: jobProfile.jobSummary,
      resumeText: revision.parsedSnapshot.parsedText ?? ""
    };
  });
}

function assertDetailedAnalysisInputReady(context: QuickScreeningRunContext): void {
  if (!context.resumeText.trim()) {
    throw new ResumeEvaluationRunServiceError(
      "VALIDATION_ERROR",
      "简历解析文本为空，无法运行详细分析。"
    );
  }

  if (!context.jobDescription.trim()) {
    throw new ResumeEvaluationRunServiceError(
      "VALIDATION_ERROR",
      "岗位描述为空，无法运行详细分析。"
    );
  }
}

function assertDetailedAnalysisPreconditions(
  runs: ResumeEvaluationRunSafeRecord[]
): void {
  const runningDetailedRun = runs.find(
    (run) => run.runType === "AI" && run.status === "PENDING"
  );

  if (runningDetailedRun) {
    throw new ResumeEvaluationRunServiceError(
      "CONFLICT",
      "当前已有详细分析正在运行，请等待完成后再重试。"
    );
  }

  const latestQuickRun = runs.find((run) => run.runType === "RULE_BASED");

  if (!latestQuickRun) {
    throw new ResumeEvaluationRunServiceError(
      "CONFLICT",
      "缺少快速初筛结果，请先完成 Quick Screening。"
    );
  }

  if (latestQuickRun.status === "PENDING") {
    throw new ResumeEvaluationRunServiceError(
      "CONFLICT",
      "快速初筛仍在运行，请完成后再启动详细分析。"
    );
  }

  if (latestQuickRun.status === "FAILED") {
    throw new ResumeEvaluationRunServiceError(
      "CONFLICT",
      "快速初筛失败，请先重新运行快速初筛。"
    );
  }

  const quickResult = resolveQuickScreeningResult(
    latestQuickRun.parsedOutputJson
  );

  if (!quickResult.success) {
    throw new ResumeEvaluationRunServiceError(
      "VALIDATION_ERROR",
      "快速初筛结果格式不完整，请重新运行快速初筛。"
    );
  }

  if (
    quickResult.result.recommendation !== "PROCEED_TO_NEXT_STEP" &&
    quickResult.result.recommendation !== "MANUAL_REVIEW"
  ) {
    throw new ResumeEvaluationRunServiceError(
      "CONFLICT",
      "当前快速初筛建议不允许进入详细分析，请补充信息或重新初筛后再试。"
    );
  }
}

function createDetailedProviderInput(
  context: QuickScreeningRunContext,
  runId: string,
  evaluationCriteria: EvaluationCriterion[]
) {
  return {
    analysisMode: "DETAILED" as const,
    evaluationCriteria,
    evaluationTemplateVersionId: context.evaluation.templateVersionId,
    jobDescription: context.jobDescription,
    jobTitle: context.jobTitle,
    jobProfileId: context.evaluation.jobProfileId,
    jobUnderstandingJson: context.jobUnderstandingJson,
    jobUnderstandingSummary: context.jobUnderstandingSummary,
    resumeText: context.resumeText,
    runId,
    templateVersionId: context.evaluation.templateVersionId
  };
}

async function loadDetailedEvaluationCriteria(
  templateVersionId: string
): Promise<EvaluationCriterion[]> {
  const templateVersion = await evaluationTemplateRepository.findVersionById(templateVersionId);

  if (!templateVersion) {
    throw new ResumeEvaluationRunServiceError("NOT_FOUND", "评价标准版本不存在。");
  }

  let criteria: EvaluationCriterion[];
  try {
    criteria = parseEvaluationCriteriaJson(templateVersion.criteria);
  } catch {
    throw new ResumeEvaluationRunServiceError("VALIDATION_ERROR", "评价标准格式无效。");
  }

  if (criteria.length === 0) {
    throw new ResumeEvaluationRunServiceError("VALIDATION_ERROR", "详细分析需要至少一项评价标准。");
  }

  return criteria;
}

function resolveDetailedProviderResult(
  value: unknown
): DetailedScreeningResolution {
  const detailed = resolveDetailedScreeningResult(value);

  if (!detailed.success) {
    return {
      error:
        detailed.message ||
        "历史详细分析结果格式不完整，请重新运行详细分析。",
      success: false
    };
  }

  return {
    compatibilityStatus: detailed.compatibilityStatus,
    result: detailed.result,
    success: true
  };
}

function createDetailedCompletionInput(
  detailedResult: AnyDetailedScreeningResult,
  legacyOutput: ResumeEvaluationResult,
  metadata: EvaluationProviderMetadata
) {
  return {
    completedAt: new Date(metadata.completedAt),
    evidenceJson: legacyOutput.evidence as unknown as Prisma.InputJsonValue,
    interviewQuestionsJson:
      legacyOutput.interviewQuestions as unknown as Prisma.InputJsonValue,
    latencyMs: metadata.durationMs,
    modelName: metadata.model ?? metadata.providerVersion,
    modelProvider: metadata.providerName,
    parsedOutputJson: detailedResult as unknown as Prisma.InputJsonValue,
    phoneScreenQuestionsJson:
      legacyOutput.interviewQuestions as unknown as Prisma.InputJsonValue,
    promptVersion: metadata.promptVersion ?? null,
    rating: detailedResult.recommendation,
    riskFlagsJson: legacyOutput.risks as unknown as Prisma.InputJsonValue,
    score: detailedResult.overallScore,
    strengthsJson: legacyOutput.strengths as unknown as Prisma.InputJsonValue,
    summary: detailedResult.summary,
    weaknessesJson: legacyOutput.weaknesses as unknown as Prisma.InputJsonValue
  };
}

function getCompletedAt(
  metadata: EvaluationProviderMetadata | undefined,
  now: () => Date
): Date {
  return metadata?.completedAt ? new Date(metadata.completedAt) : now();
}

function toDetailedAnalysisRunDto(
  run: ResumeEvaluationRunSafeRecord,
  screeningResult: AnyDetailedScreeningResult,
  legacyOutput: ResumeEvaluationResult,
  metadata: EvaluationProviderMetadata,
  compatibilityStatus: Exclude<DetailedScreeningCompatibilityStatus, "INVALID">
): DetailedAnalysisRunDto {
  const runDto = toDto(run);

  return {
    completedAt: runDto.completedAt,
    compatibilityStatus,
    createdAt: runDto.createdAt,
    evaluationId: runDto.evaluationId,
    metadata,
    mode: "DETAILED",
    model: runDto.modelName,
    provider: runDto.modelProvider,
    result: legacyOutput,
    run: runDto,
    runId: runDto.id,
    screeningResult,
    status: runDto.status,
    success: true
  };
}

function createHistoricalDetailedMetadata(
  run: ResumeEvaluationRunSafeRecord
): EvaluationProviderMetadata {
  const startedAt = run.createdAt.toISOString();
  const completedAt = run.completedAt?.toISOString() ?? startedAt;

  return {
    completedAt,
    durationMs: Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()),
    model: run.modelName ?? undefined,
    promptFile: "prompts/detailed-analysis.md",
    promptVersion: run.promptVersion ?? undefined,
    providerName: mapHistoricalProviderName(run.modelProvider),
    providerVersion: run.modelName ?? run.modelProvider ?? "historical-detailed-analysis",
    startedAt
  };
}

function mapHistoricalProviderName(
  value: string | null
): EvaluationProviderMetadata["providerName"] {
  if (value === "MOCK") {
    return "MOCK";
  }

  if (value === "RULE_BASED") {
    return "RULE_BASED";
  }

  if (value === "LUMINAI") {
    return "LUMINAI";
  }

  if (value === "GPT_5_5") {
    return "GPT_5_5";
  }

  return "OPENAI_COMPATIBLE";
}

function createJobUnderstandingContext(jobProfile: {
  jobTitle: string;
  jobSummary: string;
  coreResponsibilities: string[];
  requiredCompetencies: string[];
  preferredCompetencies: string[];
  potentialRisks: string[];
  hiringFocus: string[];
  interviewFocus: string[];
  missingInformation?: string[];
  suggestedFollowUpQuestions?: string[];
}): JsonValue {
  return {
    jobTitle: jobProfile.jobTitle,
    jobSummary: jobProfile.jobSummary,
    coreResponsibilities: jobProfile.coreResponsibilities,
    mustHaveRequirements: jobProfile.requiredCompetencies,
    niceToHaveRequirements: jobProfile.preferredCompetencies,
    competencyModel: {
      requiredCompetencies: jobProfile.requiredCompetencies,
      preferredCompetencies: jobProfile.preferredCompetencies
    },
    risks: jobProfile.potentialRisks,
    screeningFocus: jobProfile.hiringFocus,
    interviewFocus: jobProfile.interviewFocus,
    missingInformation: jobProfile.missingInformation ?? [],
    suggestedFollowUpQuestions: jobProfile.suggestedFollowUpQuestions ?? []
  };
}

async function createRunFromProviderResult(
  context: QuickScreeningRunContext,
  providerVersion: string,
  providerResult: EvaluationProviderResult,
  completedAt: Date
): Promise<ResumeEvaluationRunSafeRecord> {
  if (!providerResult.success) {
    return resumeEvaluationRunRepository.createRun({
      completedAt,
      errorCode: providerResult.error.code,
      errorMessage: providerResult.error.message,
      evaluationId: context.evaluation.id,
      jobProfileId: context.evaluation.jobProfileId,
      jobProfileVersion: context.evaluation.jobProfileVersion,
      modelName: providerVersion,
      modelProvider: "RULE_BASED",
      parsedSnapshotId: context.evaluation.parsedSnapshotId,
      resumeId: context.evaluation.resumeId,
      resumeRevisionId: context.evaluation.resumeRevisionId,
      runType: "RULE_BASED",
      status: "FAILED",
      templateVersionId: context.evaluation.templateVersionId
    });
  }

  const quickScreeningResult = providerResult.quickScreeningResult;

  if (!quickScreeningResult) {
    throw new ResumeEvaluationRunServiceError(
      "VALIDATION_ERROR",
      "Rule-based provider did not return a canonical quick screening result."
    );
  }

  const output = adaptQuickScreeningResultToLegacyEvaluationResult(quickScreeningResult);

  return resumeEvaluationRunRepository.createRun({
    completedAt,
    evaluationId: context.evaluation.id,
    evidenceJson: output.evidence as unknown as Prisma.InputJsonValue,
    interviewQuestionsJson: output.interviewQuestions as unknown as Prisma.InputJsonValue,
    jobProfileId: context.evaluation.jobProfileId,
    jobProfileVersion: context.evaluation.jobProfileVersion,
    modelName: providerVersion,
    modelProvider: "RULE_BASED",
    parsedOutputJson: quickScreeningResult as unknown as Prisma.InputJsonValue,
    parsedSnapshotId: context.evaluation.parsedSnapshotId,
    phoneScreenQuestionsJson: output.interviewQuestions as unknown as Prisma.InputJsonValue,
    rating: output.recommendation,
    resumeId: context.evaluation.resumeId,
    resumeRevisionId: context.evaluation.resumeRevisionId,
    riskFlagsJson: output.risks as unknown as Prisma.InputJsonValue,
    runType: "RULE_BASED",
    score: output.overallScore,
    status: "SUCCEEDED",
    strengthsJson: output.strengths as unknown as Prisma.InputJsonValue,
    summary: output.overallSummary,
    templateVersionId: context.evaluation.templateVersionId,
    weaknessesJson: output.weaknesses as unknown as Prisma.InputJsonValue
  });
}

function createJobDescription(jobProfile: {
  jd: string;
  jobSummary: string;
  jobTitle: string;
  coreResponsibilities: string[];
  requiredCompetencies: string[];
  preferredCompetencies: string[];
  potentialRisks: string[];
  hiringFocus: string[];
  interviewFocus: string[];
  missingInformation?: string[];
  suggestedFollowUpQuestions?: string[];
}): string {
  return [
    jobProfile.jobTitle,
    jobProfile.jd,
    jobProfile.jobSummary,
    ...jobProfile.coreResponsibilities,
    ...jobProfile.requiredCompetencies,
    ...jobProfile.preferredCompetencies,
    ...jobProfile.potentialRisks,
    ...jobProfile.hiringFocus,
    ...jobProfile.interviewFocus,
    ...(jobProfile.missingInformation ?? []),
    ...(jobProfile.suggestedFollowUpQuestions ?? [])
  ].join("\n");
}

function createMockParsedOutput(): Prisma.InputJsonObject {
  return {
    schemaVersion: "m07-b2-b-mock-v1",
    status: "MOCK_EVALUATION_RUN_CREATED"
  };
}

function toDto(run: ResumeEvaluationRunSafeRecord): ResumeEvaluationRunDto {
  return {
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    evaluationId: run.evaluationId,
    id: run.id,
    modelName: run.modelName,
    modelProvider: run.modelProvider,
    parsedSnapshotId: run.parsedSnapshotId,
    promptVersion: run.promptVersion,
    rating: run.rating,
    resumeRevisionId: run.resumeRevisionId,
    runType: run.runType,
    score: run.score,
    status: run.status,
    summary: run.summary
  };
}

function normalizeError(
  error: unknown,
  fallbackMessage: string
): ResumeEvaluationRunServiceError {
  if (error instanceof ResumeEvaluationRunServiceError) {
    return error;
  }

  return new ResumeEvaluationRunServiceError("DATABASE_ERROR", fallbackMessage);
}
