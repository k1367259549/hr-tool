import { randomUUID } from "node:crypto";
import { validateCandidateUnderstandingAiOutput } from "@/ai/schemas/candidateUnderstanding.schema";
import { aiService } from "@/ai/ai.service";
import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type {
  CandidateInsight,
  CandidateInsightCreateInput,
  CandidateInsightDto,
  CandidateUnderstandingGenerateInput,
  CandidateUnderstandingPromptInput,
  CandidateUnderstandingResult,
  ResumeSemanticChunk,
  ResumeStructureChunk
} from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { JsonValue } from "@/types/ai";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";
import { AppError } from "@/utils/errors";
import { normalizeCandidateInsightOutput } from "@/utils/candidateUnderstandingValidation";
import { createSemanticChunks, createStructureChunks } from "@/utils/resumeChunking";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";

const promptFile = "candidate-understanding.md";
const resumeVersion = "resume-parser-v1";

export class CandidateUnderstandingServiceError extends Error {
  readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(
    code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "CandidateUnderstandingServiceError";
    this.code = code;
  }
}

export const candidateUnderstandingService = {
  async generateCandidateUnderstanding(
    input: CandidateUnderstandingGenerateInput
  ): Promise<CandidateUnderstandingResult> {
    const workflowId = randomUUID();
    const jobProfile = await findRequiredJobProfile(input.jobProfileId);
    const jobProfileVersion = createJobProfileVersion(jobProfile);

    try {
      const parsedResume = await parseResumeFile(input.file);
      const structureChunks = createStructureChunks(parsedResume.parsedText);
      const semanticChunks = createSemanticChunks(structureChunks);
      const savedResume = await candidateResumeRepository.create({
        candidateSource: input.candidateSource,
        fileName: parsedResume.fileName,
        fileSize: parsedResume.fileSize,
        fileType: parsedResume.fileType,
        jobProfileId: jobProfile.id,
        notes: input.notes,
        originalFile: parsedResume.originalFile,
        parsedText: parsedResume.parsedText,
        parsingStatus: "PARSED",
        resumeVersion,
        semanticChunks,
        structureChunks,
        workflowId
      });
      const aiResult = await aiService.generateValidatedJsonFromPrompt({
        feature: "candidate-understanding",
        promptFile,
        validate: (value) =>
          normalizeCandidateInsightOutput(validateCandidateUnderstandingAiOutput(value)),
        variables: {
          INPUT: createPromptInput(jobProfile, parsedResume.parsedText, structureChunks, semanticChunks)
        },
        workflow: "Workflow-02 Candidate Understanding"
      });

      return {
        ...aiResult.output,
        aiModel: aiResult.model,
        aiProvider: aiResult.provider,
        generatedAt: new Date().toISOString(),
        generationTimeMs: aiResult.generationTimeMs,
        jobProfileId: jobProfile.id,
        jobProfileTitle: jobProfile.jobTitle,
        jobProfileVersion,
        parsedTextPreview: truncateText(parsedResume.parsedText, 1200),
        parsingStatus: "PARSED",
        promptFile: aiResult.prompt.fileName,
        promptVersion: aiResult.prompt.version,
        resumeFileName: parsedResume.fileName,
        resumeId: savedResume.id,
        resumeVersion,
        semanticChunks,
        structureChunks,
        workflowId
      };
    } catch (error) {
      await persistFailedResumeIfPossible({
        error,
        file: input.file,
        input,
        jobProfileId: jobProfile.id,
        workflowId
      });

      if (error instanceof ResumeParserError) {
        throw new CandidateUnderstandingServiceError("VALIDATION_ERROR", error.message);
      }

      if (error instanceof AppError) {
        throw new CandidateUnderstandingServiceError(
          "AI_ERROR",
          getSafeAiErrorMessage(error, "候选人理解生成失败。")
        );
      }

      throw new CandidateUnderstandingServiceError("AI_ERROR", "AI 候选人理解输出无效。");
    }
  },

  async saveReviewedCandidateInsight(input: CandidateInsightCreateInput): Promise<CandidateInsightDto> {
    try {
      const resume = await candidateResumeRepository.findById(input.resumeId);

      if (!resume) {
        throw new CandidateUnderstandingServiceError("NOT_FOUND", "未找到简历解析记录。");
      }

      if (resume.jobProfileId !== input.jobProfileId) {
        throw new CandidateUnderstandingServiceError("VALIDATION_ERROR", "简历与岗位画像不匹配。");
      }

      const insight = await candidateInsightRepository.create(input);

      return toCandidateInsightDto(insight);
    } catch (error) {
      if (error instanceof CandidateUnderstandingServiceError) {
        throw error;
      }

      throw new CandidateUnderstandingServiceError("DATABASE_ERROR", "保存候选人洞察失败。");
    }
  }
};

async function findRequiredJobProfile(jobProfileId: string): Promise<JobProfile> {
  const jobProfile = await jobProfileRepository.findById(jobProfileId);

  if (!jobProfile) {
    throw new CandidateUnderstandingServiceError("NOT_FOUND", "未找到已确认的岗位画像。");
  }

  return jobProfile;
}

function createJobProfileVersion(jobProfile: JobProfile): string {
  return `job-profile:${jobProfile.id}:${jobProfile.updatedAt.toISOString()}`;
}

function createPromptInput(
  jobProfile: JobProfile,
  parsedText: string,
  structureChunks: ResumeStructureChunk[],
  semanticChunks: ResumeSemanticChunk[]
): CandidateUnderstandingPromptInput {
  return {
    jobProfile: {
      coreResponsibilities: jobProfile.coreResponsibilities,
      hiringFocus: jobProfile.hiringFocus,
      interviewFocus: jobProfile.interviewFocus,
      jobSummary: jobProfile.jobSummary,
      jobTitle: jobProfile.jobTitle,
      missingInformation: jobProfile.missingInformation,
      potentialRisks: jobProfile.potentialRisks,
      requiredCompetencies: jobProfile.requiredCompetencies
    },
    resume: {
      parsedText: truncateText(parsedText, 12000),
      resumeVersion
    },
    semanticChunks: semanticChunks as unknown as JsonValue,
    structureChunks: structureChunks as unknown as JsonValue
  };
}

async function persistFailedResumeIfPossible({
  error,
  file,
  input,
  jobProfileId,
  workflowId
}: {
  error: unknown;
  file: File;
  input: CandidateUnderstandingGenerateInput;
  jobProfileId: string;
  workflowId: string;
}): Promise<void> {
  if (!(error instanceof ResumeParserError) || error.code !== "RESUME_PARSE_ERROR") {
    return;
  }

  try {
    const originalFile = new Uint8Array(await file.arrayBuffer());

    await candidateResumeRepository.create({
      candidateSource: input.candidateSource,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "unknown",
      jobProfileId,
      notes: input.notes,
      originalFile,
      parsingError: error.message,
      parsingStatus: "FAILED",
      resumeVersion,
      semanticChunks: [],
      structureChunks: [],
      workflowId
    });
  } catch {
    // Parsing failure should remain the user-facing error; failed-resume persistence is best effort.
  }
}

export function toCandidateInsightDto(insight: CandidateInsight): CandidateInsightDto {
  return {
    ...insight,
    createdAt: insight.createdAt.toISOString(),
    evidence: insight.evidence as unknown as CandidateInsightDto["evidence"],
    insights: insight.insights as unknown as CandidateInsightDto["insights"],
    reviewedAt: insight.reviewedAt.toISOString(),
    summary: insight.summary as unknown as CandidateInsightDto["summary"],
    updatedAt: insight.updatedAt.toISOString()
  };
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
