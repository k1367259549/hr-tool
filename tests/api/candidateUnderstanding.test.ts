import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  CandidateInsightDto,
  CandidateUnderstandingResult
} from "@/types/candidateUnderstanding";

const { CandidateUnderstandingServiceErrorMock, candidateUnderstandingServiceMock } = vi.hoisted(
  () => {
    class CandidateUnderstandingServiceErrorMock extends Error {
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

    return {
      CandidateUnderstandingServiceErrorMock,
      candidateUnderstandingServiceMock: {
        generateCandidateUnderstanding: vi.fn(),
        saveReviewedCandidateInsight: vi.fn()
      }
    };
  }
);

vi.mock("@/services/candidateUnderstanding.service", () => ({
  CandidateUnderstandingServiceError: CandidateUnderstandingServiceErrorMock,
  candidateUnderstandingService: candidateUnderstandingServiceMock
}));

const candidateUnderstandingResult: CandidateUnderstandingResult = {
  aiModel: "gpt-test",
  aiProvider: "openai",
  evidence: [
    {
      claim: "有招聘经验",
      sourceChunkIds: ["structure-experience-1"]
    }
  ],
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimeMs: 1200,
  insights: {
    contextSignals: ["有业务沟通信号"],
    openQuestions: ["团队规模待确认"],
    relevantExperience: ["招聘流程推进"],
    transferableStrengths: ["沟通协调"]
  },
  jobProfileId: "00000000-0000-4000-8000-000000000001",
  jobProfileTitle: "招聘专员",
  jobProfileVersion: "job-profile:test",
  missingInformation: ["期望城市"],
  parsedTextPreview: "负责招聘流程推进。",
  parsingStatus: "PARSED",
  potentialRisks: ["简历缺少团队规模"],
  promptFile: "candidate-understanding.md",
  promptVersion: "1.0",
  resumeFileName: "resume.txt",
  resumeId: "00000000-0000-4000-8000-000000000002",
  resumeVersion: "resume-parser-v1",
  semanticChunks: [
    {
      chunkId: "semantic-recruitment-experience-1",
      chunkType: "Recruitment Experience",
      confidence: 0.8,
      content: "招聘流程推进",
      evidenceChunkIds: ["structure-experience-1"]
    }
  ],
  strengths: ["有招聘执行经验"],
  structureChunks: [
    {
      chunkId: "structure-experience-1",
      chunkType: "Experience",
      confidence: 0.9,
      content: "负责招聘流程推进。",
      sourceLocation: "lines 1-1"
    }
  ],
  suggestedInterviewQuestions: ["请介绍一次招聘项目。"],
  suggestedNextActions: ["电话初筛核实项目规模。"],
  suggestedPhoneScreenQuestions: ["目前求职优先级是什么？"],
  summary: {
    candidateOverview: "候选人具备招聘执行背景。",
    evidenceCoverage: "简历覆盖工作经历。",
    roleContextUnderstanding: "可用于理解其与岗位上下文相关的经历。"
  },
  workflowId: "00000000-0000-4000-8000-000000000003"
};

describe("Candidate Understanding API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("File", TestFile);
    candidateUnderstandingServiceMock.generateCandidateUnderstanding.mockResolvedValue(
      candidateUnderstandingResult
    );
    candidateUnderstandingServiceMock.saveReviewedCandidateInsight.mockImplementation(
      async (input): Promise<CandidateInsightDto> => ({
        ...input,
        candidateSource: input.candidateSource ?? null,
        createdAt: "2026-01-01T00:00:00.000Z",
        generationTimeMs: input.generationTimeMs ?? null,
        id: "00000000-0000-4000-8000-000000000004",
        notes: input.notes ?? null,
        reviewedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      })
    );
  });

  it("POST /api/candidate-understanding/generate returns structured result", async () => {
    const { POST } = await import("@/app/api/candidate-understanding/generate/route");
    const file = new TestFile("resume.txt", "text/plain", "resume text");
    const formData = createMockFormData({
      file,
      jobProfileId: candidateUnderstandingResult.jobProfileId
    });

    const response = await POST(
      {
        formData: async () => formData
      } as never
    );
    const json = await readApiJson<CandidateUnderstandingResult>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.summary.candidateOverview).toContain("招聘执行");
    expect(candidateUnderstandingServiceMock.generateCandidateUnderstanding).toHaveBeenCalled();
  });

  it("POST /api/candidate-insights saves reviewed candidate insight", async () => {
    const { POST } = await import("@/app/api/candidate-insights/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/candidate-insights", {
        ...candidateUnderstandingResult
      }) as never
    );
    const json = await readApiJson<CandidateInsightDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.resumeId).toBe(candidateUnderstandingResult.resumeId);
    expect(candidateUnderstandingServiceMock.saveReviewedCandidateInsight).toHaveBeenCalled();
  });
});

class TestFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  private readonly content: string;

  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
    this.size = content.length;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
}

function createMockFormData(values: Record<string, unknown>): FormData {
  return {
    get(name: string): FormDataEntryValue | null {
      return (values[name] as FormDataEntryValue | undefined) ?? null;
    }
  } as FormData;
}
