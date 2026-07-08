import { randomUUID } from "node:crypto";
import { validateCandidateUnderstandingAiOutput } from "@/ai/schemas/candidateUnderstanding.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import type {
  CandidateInsight,
  CandidateInsightCreateInput,
  CandidateInsightDto,
  CandidateInsightOutput,
  CandidateUnderstandingResumeInputMetadata,
  CandidateUnderstandingGenerateInput,
  CandidateUnderstandingPromptInput,
  CandidateUnderstandingResult,
  ResumeSemanticChunk,
  ResumeStructureChunk
} from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { JsonValue } from "@/types/ai";
import { getNormalizedResumeFileType } from "@/config/resume.config";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";
import { AppError } from "@/utils/errors";
import { normalizeCandidateInsightOutput } from "@/utils/candidateUnderstandingValidation";
import { createSemanticChunks, createStructureChunks } from "@/utils/resumeChunking";
import { generateResumeContentHash } from "@/utils/resumeContentHash";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";

const promptFile = "candidate-understanding.md";
const resumeVersion = "resume-parser-v1";
const parserVersion = "v1";
const promptVersion = "1.0";
const maxCandidateUnderstandingResumeChars = 16000;
const maxCandidateUnderstandingChunkChars = 3200;

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
      const contentHash = generateResumeContentHash(parsedResume.parsedText);
      const promptResumeInput = createPromptResumeInput(
        parsedResume.parsedText,
        structureChunks,
        semanticChunks
      );
      const savedResume = await candidateResumeRepository.create({
        candidateSource: input.candidateSource,
        contentHash,
        fileName: parsedResume.fileName,
        fileSize: parsedResume.fileSize,
        fileType: parsedResume.fileType,
        intakeSource: "CANDIDATE_UNDERSTANDING",
        jobProfileId: jobProfile.id,
        language: null,
        notes: input.notes,
        originalFile: parsedResume.originalFile,
        parserVersion,
        parsedText: parsedResume.parsedText,
        parsingStatus: "PARSED",
        resumeVersion,
        semanticChunks,
        structureChunks,
        workflowId
      });
      await resumeRevisionRepository.createInitialRevision({
        chunkCount: structureChunks.length,
        contentHash,
        parseStatus: "PARSED",
        parsedText: parsedResume.parsedText,
        parserVersion,
        resumeId: savedResume.id,
        source: "CANDIDATE_UNDERSTANDING",
        sourceFileName: parsedResume.fileName,
        structuredData: {
          semanticChunkCount: semanticChunks.length,
          structureChunkCount: structureChunks.length
        }
      });
      const aiStartedAt = Date.now();

      try {
        const aiResult = await aiService.generateValidatedJsonFromPrompt({
          feature: "candidate-understanding",
          promptFile,
          timeoutMs: aiConfig.timeoutMs,
          validate: (value) =>
            normalizeCandidateInsightOutput(validateCandidateUnderstandingAiOutput(value)),
          variables: {
            INPUT: createPromptInput(jobProfile, promptResumeInput)
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
          resumeInputMetadata: promptResumeInput.metadata,
          resumeVersion,
          semanticChunks,
          structureChunks,
          workflowId
        };
      } catch (error) {
        if (isAiTimeoutError(error)) {
          const timeoutMessage = createCandidateUnderstandingTimeoutMessage(aiConfig.timeoutMs);

          return {
            ...createTimeoutFallbackOutput(),
            aiModel: aiConfig.defaultModel,
            aiProvider: aiConfig.defaultProvider,
            fallbackDraft: true,
            generatedAt: new Date().toISOString(),
            generationError: timeoutMessage,
            generationTimeMs: Date.now() - aiStartedAt,
            jobProfileId: jobProfile.id,
            jobProfileTitle: jobProfile.jobTitle,
            jobProfileVersion,
            parsedTextPreview: truncateText(parsedResume.parsedText, 1200),
            parsingStatus: "PARSED",
            promptFile,
            promptVersion,
            resumeFileName: parsedResume.fileName,
            resumeId: savedResume.id,
            resumeInputMetadata: promptResumeInput.metadata,
            resumeVersion,
            semanticChunks,
            structureChunks,
            workflowId
          };
        }

        throw error;
      }
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

  if (!jobProfile.reviewedAt) {
    throw new CandidateUnderstandingServiceError("VALIDATION_ERROR", "该岗位画像尚未完成人工确认。");
  }

  return jobProfile;
}

function createJobProfileVersion(jobProfile: JobProfile): string {
  return `job-profile:${jobProfile.id}:${jobProfile.updatedAt.toISOString()}`;
}

function createPromptInput(
  jobProfile: JobProfile,
  promptResumeInput: {
    parsedText: string;
    structureChunks: ResumeStructureChunk[];
    semanticChunks: ResumeSemanticChunk[];
    metadata: CandidateUnderstandingResumeInputMetadata;
  }
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
      inputMetadata: promptResumeInput.metadata,
      parsedText: promptResumeInput.parsedText,
      resumeVersion
    },
    semanticChunks: promptResumeInput.semanticChunks as unknown as JsonValue,
    structureChunks: promptResumeInput.structureChunks as unknown as JsonValue
  };
}

function createPromptResumeInput(
  parsedText: string,
  structureChunks: ResumeStructureChunk[],
  semanticChunks: ResumeSemanticChunk[]
): {
  parsedText: string;
  structureChunks: ResumeStructureChunk[];
  semanticChunks: ResumeSemanticChunk[];
  metadata: CandidateUnderstandingResumeInputMetadata;
} {
  if (parsedText.length <= maxCandidateUnderstandingResumeChars) {
    return {
      metadata: {
        originalLength: parsedText.length,
        sentLength: parsedText.length,
        truncated: false
      },
      parsedText,
      semanticChunks,
      structureChunks
    };
  }

  const selectedChunks = selectPromptStructureChunks(structureChunks);
  const selectedChunkIds = new Set(selectedChunks.map((chunk) => chunk.chunkId));
  const selectedSemanticChunks = semanticChunks.filter((chunk) =>
    chunk.evidenceChunkIds.some((chunkId) => selectedChunkIds.has(chunkId))
  );
  const promptText = buildPromptTextFromChunks(selectedChunks, parsedText);

  return {
    metadata: {
      originalLength: parsedText.length,
      sentLength: promptText.length,
      truncated: true
    },
    parsedText: promptText,
    semanticChunks: selectedSemanticChunks,
    structureChunks: selectedChunks
  };
}

function selectPromptStructureChunks(
  structureChunks: ResumeStructureChunk[]
): ResumeStructureChunk[] {
  const prioritizedTypes: ResumeStructureChunk["chunkType"][] = [
    "Personal Information",
    "Experience",
    "Projects",
    "Skills",
    "Education"
  ];
  const priorityByType = new Map(prioritizedTypes.map((type, index) => [type, index]));
  const selected: ResumeStructureChunk[] = [];
  let sentLength = 0;

  for (const chunk of [...structureChunks].sort((left, right) => {
    const leftPriority = priorityByType.get(left.chunkType) ?? prioritizedTypes.length;
    const rightPriority = priorityByType.get(right.chunkType) ?? prioritizedTypes.length;

    return leftPriority - rightPriority;
  })) {
    if (sentLength >= maxCandidateUnderstandingResumeChars) {
      break;
    }

    const remainingLength = maxCandidateUnderstandingResumeChars - sentLength;
    const chunkLengthLimit = Math.min(remainingLength, maxCandidateUnderstandingChunkChars);
    const content =
      chunk.content.length > chunkLengthLimit
        ? truncatePromptText(chunk.content, chunkLengthLimit)
        : chunk.content;

    selected.push({
      ...chunk,
      content
    });
    sentLength += content.length;
  }

  return selected;
}

function buildPromptTextFromChunks(
  selectedChunks: ResumeStructureChunk[],
  fallbackParsedText: string
): string {
  const chunkText = selectedChunks
    .map((chunk) => `[${chunk.chunkType}] ${chunk.content.trim()}`)
    .filter((value) => value.length > 0)
    .join("\n\n")
    .trim();

  if (chunkText.length > 0) {
    return truncatePromptText(chunkText, maxCandidateUnderstandingResumeChars);
  }

  return truncatePromptText(fallbackParsedText, maxCandidateUnderstandingResumeChars);
}

function truncatePromptText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function isAiTimeoutError(error: unknown): boolean {
  return error instanceof AppError && /timed out/i.test(error.message);
}

function createCandidateUnderstandingTimeoutMessage(timeoutMs: number): string {
  return `Candidate understanding AI generation timed out after ${timeoutMs} ms.`;
}

function createTimeoutFallbackOutput(): CandidateInsightOutput {
  return {
    evidence: [],
    insights: {
      contextSignals: [],
      openQuestions: ["AI 生成超时，请人工补充候选人理解。"],
      relevantExperience: [],
      transferableStrengths: []
    },
    missingInformation: ["AI 生成超时，请人工补充候选人理解。"],
    potentialRisks: ["简历较长或模型响应较慢，建议缩短输入后重试。"],
    strengths: [],
    suggestedInterviewQuestions: [],
    suggestedNextActions: ["人工检查简历关键信息后，再决定是否重试 AI 生成。"],
    suggestedPhoneScreenQuestions: [
      "请简单介绍你最近一段与该岗位最相关的经历。",
      "你目前的到岗时间、实习周期和每周可出勤天数是怎样的？",
      "你对这个岗位的核心工作内容理解是什么？"
    ],
    summary: {
      candidateOverview: "AI 生成超时，请人工补充候选人理解。",
      evidenceCoverage: "AI 未能在超时时间内完成证据整理，请人工查看简历原文。",
      roleContextUnderstanding: "AI 生成超时，暂未形成与岗位画像的结构化对应关系。"
    }
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

    const savedResume = await candidateResumeRepository.create({
      candidateSource: input.candidateSource,
      contentHash: null,
      fileName: file.name,
      fileSize: file.size,
      fileType: getNormalizedResumeFileType(file.name) ?? "unknown",
      intakeSource: "CANDIDATE_UNDERSTANDING",
      jobProfileId,
      language: null,
      notes: input.notes,
      originalFile,
      parserVersion,
      parsingError: error.message,
      parsingStatus: "FAILED",
      resumeVersion,
      semanticChunks: [],
      structureChunks: [],
      workflowId
    });
    await resumeRevisionRepository.createInitialRevision({
      chunkCount: 0,
      contentHash: null,
      parseStatus: "FAILED",
      parsedText: null,
      parserVersion,
      resumeId: savedResume.id,
      source: "CANDIDATE_UNDERSTANDING",
      sourceFileName: file.name,
      structuredData: {
        semanticChunkCount: 0,
        structureChunkCount: 0
      }
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
    reviewedAt: insight.reviewedAt?.toISOString() ?? null,
    summary: insight.summary as unknown as CandidateInsightDto["summary"],
    updatedAt: insight.updatedAt.toISOString()
  };
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
