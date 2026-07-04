import { beforeEach, describe, expect, it, vi } from "vitest";
import { aiService } from "@/ai/ai.service";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import {
  candidateUnderstandingService,
  CandidateUnderstandingServiceError,
  toCandidateInsightDto
} from "@/services/candidateUnderstanding.service";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import { generateResumeContentHash } from "@/utils/resumeContentHash";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";

vi.mock("@/ai/ai.service", () => ({
  aiService: {
    generateValidatedJsonFromPrompt: vi.fn()
  }
}));

vi.mock("@/repositories/candidateInsight.repository", () => ({
  candidateInsightRepository: {
    create: vi.fn()
  }
}));

vi.mock("@/repositories/candidateResume.repository", () => ({
  candidateResumeRepository: {
    create: vi.fn(),
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/resumeRevision.repository", () => ({
  resumeRevisionRepository: {
    createInitialRevision: vi.fn()
  }
}));

vi.mock("@/utils/resumeParser", () => ({
  parseResumeFile: vi.fn(),
  ResumeParserError: class ResumeParserError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "ResumeParserError";
      this.code = code;
    }
  }
}));

const baseCandidateInsight: CandidateInsight = {
  aiModel: "test-model",
  aiProvider: "openai-compatible",
  candidateSource: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  evidence: [
    {
      claim: "有招聘经验",
      sourceChunkIds: ["chunk-1"]
    }
  ],
  generationTimeMs: 1000,
  id: "candidate-insight-id",
  insights: {
    contextSignals: ["跨部门沟通"],
    openQuestions: ["团队规模"],
    relevantExperience: ["招聘执行"],
    transferableStrengths: ["协调"]
  },
  jobProfileId: "job-profile-id",
  jobProfileVersion: "job-profile-version",
  missingInformation: ["期望城市"],
  notes: null,
  potentialRisks: ["信息不足"],
  promptFile: "candidate-understanding.md",
  promptVersion: "1.0",
  resumeId: "resume-id",
  resumeVersion: "resume-parser-v1",
  reviewedAt: null,
  strengths: ["招聘执行"],
  suggestedInterviewQuestions: ["介绍招聘项目"],
  suggestedNextActions: ["电话初筛"],
  suggestedPhoneScreenQuestions: ["求职优先级？"],
  summary: {
    candidateOverview: "候选人具备招聘经验。",
    evidenceCoverage: "简历覆盖工作经历。",
    roleContextUnderstanding: "与岗位相关。"
  },
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  workflowId: "workflow-id"
};

describe("toCandidateInsightDto", () => {
  it("serializes nullable reviewedAt as null", () => {
    expect(toCandidateInsightDto(baseCandidateInsight).reviewedAt).toBeNull();
  });

  it("serializes reviewedAt after human confirmation", () => {
    expect(
      toCandidateInsightDto({
        ...baseCandidateInsight,
        reviewedAt: new Date("2026-01-03T00:00:00.000Z")
      }).reviewedAt
    ).toBe("2026-01-03T00:00:00.000Z");
  });
});

describe("candidateUnderstandingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeRevisionRepository.createInitialRevision).mockResolvedValue({} as never);
  });

  it("stores contentHash from normalized parsed resume text", async () => {
    const reviewedJobProfile = {
      aiModel: "test-model",
      aiProvider: "openai-compatible",
      coreResponsibilities: ["招聘交付"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      generationTimeMs: 1000,
      hiringFocus: ["沟通业务需求"],
      hiringGoal: null,
      id: "job-profile-id",
      interviewFocus: ["候选人沟通"],
      jd: "负责招聘。",
      jobSummary: "招聘岗位。",
      jobTitle: "招聘专员",
      leaderRequirements: null,
      missingInformation: [],
      notes: null,
      potentialRisks: [],
      preferredCompetencies: [],
      promptFile: "job-understanding.md",
      promptVersion: "1.0",
      requiredCompetencies: ["招聘执行"],
      reviewedAt: new Date("2026-01-03T00:00:00.000Z"),
      suggestedFollowUpQuestions: [],
      teamBackground: null,
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      workflowId: "workflow-id"
    };
    const parsedText = "  候选人简历\r\n招聘经验  ";

    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(reviewedJobProfile);
    vi.mocked(parseResumeFile).mockResolvedValueOnce({
      fileName: "resume.txt",
      fileSize: 24,
      fileType: "TXT",
      originalFile: new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>,
      parsedText
    });
    vi.mocked(candidateResumeRepository.create).mockResolvedValueOnce({
      candidateId: null,
      candidateSource: null,
      contentHash: generateResumeContentHash(parsedText),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      fileName: "resume.txt",
      fileSize: 24,
      fileType: "TXT",
      id: "resume-id",
      intakeSource: "CANDIDATE_UNDERSTANDING",
      jobProfileId: "job-profile-id",
      language: null,
      notes: null,
      originalFile: new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>,
      parserVersion: "v1",
      parsedText,
      parsingError: null,
      parsingStatus: "PARSED",
      resumeVersion: "resume-parser-v1",
      semanticChunks: [],
      structureChunks: [],
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      workflowId: "workflow-id"
    });
    vi.mocked(aiService.generateValidatedJsonFromPrompt).mockResolvedValueOnce({
      generationTimeMs: 1000,
      model: "test-model",
      output: {
        evidence: [],
        insights: {
          contextSignals: [],
          openQuestions: [],
          relevantExperience: [],
          transferableStrengths: []
        },
        missingInformation: [],
        potentialRisks: [],
        strengths: [],
        suggestedInterviewQuestions: [],
        suggestedNextActions: [],
        suggestedPhoneScreenQuestions: [],
        summary: {
          candidateOverview: "候选人具备招聘经验。",
          evidenceCoverage: "简历覆盖工作经历。",
          roleContextUnderstanding: "与岗位相关。"
        }
      },
      prompt: {
        category: "candidate-understanding",
        fileName: "candidate-understanding.md",
        path: "prompts/candidate-understanding.md",
        version: "1.0"
      },
      provider: "openai-compatible",
      providerRetryCount: 0,
      rawOutput: "{}",
      retryCount: 0,
      validationResult: "success"
    });

    await candidateUnderstandingService.generateCandidateUnderstanding({
      file: new File(["resume"], "resume.txt"),
      jobProfileId: "job-profile-id"
    });

    expect(candidateResumeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contentHash: generateResumeContentHash(parsedText),
        fileName: "resume.txt",
        jobProfileId: "job-profile-id",
        parsingStatus: "PARSED"
      })
    );
    expect(resumeRevisionRepository.createInitialRevision).toHaveBeenCalledWith({
      chunkCount: 1,
      contentHash: generateResumeContentHash(parsedText),
      parseStatus: "PARSED",
      parsedText,
      parserVersion: "v1",
      resumeId: "resume-id",
      source: "CANDIDATE_UNDERSTANDING",
      sourceFileName: "resume.txt",
      structuredData: {
        semanticChunkCount: 1,
        structureChunkCount: 1
      }
    });
  });

  it("rejects candidate understanding when job profile is not reviewed", async () => {
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce({
      aiModel: "test-model",
      aiProvider: "openai-compatible",
      coreResponsibilities: ["招聘交付"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      generationTimeMs: 1000,
      hiringFocus: ["沟通业务需求"],
      hiringGoal: null,
      id: "unreviewed-job-profile-id",
      interviewFocus: ["候选人沟通"],
      jd: "负责招聘。",
      jobSummary: "招聘岗位。",
      jobTitle: "招聘专员",
      leaderRequirements: null,
      missingInformation: [],
      notes: null,
      potentialRisks: [],
      preferredCompetencies: [],
      promptFile: "job-understanding.md",
      promptVersion: "1.0",
      requiredCompetencies: ["招聘执行"],
      reviewedAt: null,
      suggestedFollowUpQuestions: [],
      teamBackground: null,
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      workflowId: "workflow-id"
    });

    await expect(
      candidateUnderstandingService.generateCandidateUnderstanding({
        file: {} as File,
        jobProfileId: "unreviewed-job-profile-id"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "该岗位画像尚未完成人工确认。"
    } satisfies Partial<CandidateUnderstandingServiceError>);
  });

  it("creates failed initial revision when resume parsing fails after reviewed job profile", async () => {
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce({
      aiModel: "test-model",
      aiProvider: "openai-compatible",
      coreResponsibilities: ["招聘交付"],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      generationTimeMs: 1000,
      hiringFocus: ["沟通业务需求"],
      hiringGoal: null,
      id: "job-profile-id",
      interviewFocus: ["候选人沟通"],
      jd: "负责招聘。",
      jobSummary: "招聘岗位。",
      jobTitle: "招聘专员",
      leaderRequirements: null,
      missingInformation: [],
      notes: null,
      potentialRisks: [],
      preferredCompetencies: [],
      promptFile: "job-understanding.md",
      promptVersion: "1.0",
      requiredCompetencies: ["招聘执行"],
      reviewedAt: new Date("2026-01-03T00:00:00.000Z"),
      suggestedFollowUpQuestions: [],
      teamBackground: null,
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      workflowId: "workflow-id"
    });
    vi.mocked(parseResumeFile).mockRejectedValueOnce(
      new ResumeParserError("RESUME_PARSE_ERROR", "未能从简历中解析出文本。")
    );
    vi.mocked(candidateResumeRepository.create).mockResolvedValueOnce({
      candidateId: null,
      candidateSource: null,
      contentHash: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      fileName: "resume.pdf",
      fileSize: 11,
      fileType: "PDF",
      id: "failed-resume-id",
      intakeSource: "CANDIDATE_UNDERSTANDING",
      jobProfileId: "job-profile-id",
      language: null,
      notes: null,
      originalFile: new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>,
      parserVersion: "v1",
      parsedText: null,
      parsingError: "未能从简历中解析出文本。",
      parsingStatus: "FAILED",
      resumeVersion: "resume-parser-v1",
      semanticChunks: [],
      structureChunks: [],
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      workflowId: "workflow-id"
    });

    await expect(
      candidateUnderstandingService.generateCandidateUnderstanding({
        file: new File(["broken pdf"], "resume.pdf"),
        jobProfileId: "job-profile-id"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "未能从简历中解析出文本。"
    } satisfies Partial<CandidateUnderstandingServiceError>);

    expect(resumeRevisionRepository.createInitialRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkCount: 0,
        contentHash: null,
        parseStatus: "FAILED",
        parsedText: null,
        parserVersion: "v1",
        resumeId: "failed-resume-id"
      })
    );
  });
});
