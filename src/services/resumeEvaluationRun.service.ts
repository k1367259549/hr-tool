import { Prisma } from "@prisma/client";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";
import { prisma } from "@/lib/prisma";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import type { EvaluationProviderResult } from "@/lib/evaluation/provider-interface";
import type { JsonValue } from "@/types/ai";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type {
  QuickScreeningResultDto,
  QuickScreeningRunDto,
  ResumeEvaluationRunDto,
  ResumeEvaluationRunSafeRecord
} from "@/types/resumeEvaluationRun";

export class ResumeEvaluationRunServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
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

      return {
        run: toDto(run),
        result: toQuickScreeningResult(providerResult.output)
      };
    } catch (error) {
      throw normalizeError(error, "创建快速初筛 run 失败。");
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

  const output = providerResult.output;

  return resumeEvaluationRunRepository.createRun({
    completedAt,
    evaluationId: context.evaluation.id,
    evidenceJson: output.evidence as unknown as Prisma.InputJsonValue,
    interviewQuestionsJson: output.interviewQuestions as unknown as Prisma.InputJsonValue,
    jobProfileId: context.evaluation.jobProfileId,
    jobProfileVersion: context.evaluation.jobProfileVersion,
    modelName: providerVersion,
    modelProvider: "RULE_BASED",
    parsedOutputJson: output as unknown as Prisma.InputJsonValue,
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

function toQuickScreeningResult(output: ResumeEvaluationResult): QuickScreeningResultDto {
  return {
    evidence: output.evidence.map((item) => item.text),
    nextStep: createNextStep(output.recommendation),
    reasons: [
      ...output.strengths.map((item) => `${item.title}: ${item.description}`),
      ...output.weaknesses.map((item) => `${item.title}: ${item.description}`)
    ],
    recommendation: output.recommendation,
    risks: output.risks.map((item) => item.description),
    score: output.overallScore,
    summary: output.overallSummary
  };
}

function createNextStep(recommendation: ResumeEvaluationResult["recommendation"]): string {
  if (recommendation === "POTENTIAL_FIT" || recommendation === "STRONG_FIT") {
    return "建议进入详细分析或电话筛选，并由招聘者人工确认。";
  }

  if (recommendation === "UNCERTAIN") {
    return "建议补充关键信息后，再由招聘者人工确认是否进入详细分析。";
  }

  return "建议先电话确认缺失信息；不要自动拒绝或推进流程。";
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
