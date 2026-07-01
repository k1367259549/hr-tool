import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  InterviewPreparationResult,
  PhonePreparationResult,
  RecruiterSummaryResult,
  RecruitTogetherPageData,
  RecruitTogetherWorkflowDto
} from "@/types/recruitTogether";

const { RecruitTogetherServiceErrorMock, recruitTogetherServiceMock } = vi.hoisted(() => {
  class RecruitTogetherServiceErrorMock extends Error {
    readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

    constructor(
      code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
      message: string
    ) {
      super(message);
      this.name = "RecruitTogetherServiceError";
      this.code = code;
    }
  }

  return {
    RecruitTogetherServiceErrorMock,
    recruitTogetherServiceMock: {
      generateInterviewPreparation: vi.fn(),
      generatePhonePreparation: vi.fn(),
      generateRecruiterSummary: vi.fn(),
      getPageData: vi.fn(),
      saveWorkflow: vi.fn()
    }
  };
});

vi.mock("@/services/recruitTogether.service", () => ({
  RecruitTogetherServiceError: RecruitTogetherServiceErrorMock,
  recruitTogetherService: recruitTogetherServiceMock
}));

const workflowId = "00000000-0000-4000-8000-000000000100";
const jobProfileId = "00000000-0000-4000-8000-000000000101";
const candidateInsightId = "00000000-0000-4000-8000-000000000102";

const phonePreparation: PhonePreparationResult = {
  aiModel: "gpt-test",
  aiProvider: "openai",
  conversationChecklist: ["确认基本信息"],
  conversationGoals: ["了解动机"],
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimeMs: 100,
  informationToConfirm: ["薪资"],
  keyVerificationQuestions: ["请介绍最近项目。"],
  promptFile: "phone-screen-preparation.md",
  promptVersion: "1.0",
  riskVerificationQuestions: ["空窗期原因？"],
  suggestedOpening: "你好，先了解一下你的求职情况。",
  thingsToAvoid: ["不要做录用承诺"],
  workflowId
};

const interviewPreparation: InterviewPreparationResult = {
  aiModel: "gpt-test",
  aiProvider: "openai",
  evidenceToVerify: ["项目规模"],
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimeMs: 120,
  highPriorityTopics: ["协作方式"],
  interviewFocus: ["岗位经验"],
  missingInformation: ["到岗时间"],
  possibleFollowUpQuestions: ["为什么这样推进？"],
  promptFile: "interview-preparation.md",
  promptVersion: "1.0",
  suggestedQuestions: ["请介绍复杂项目。"],
  workflowId
};

const recruiterSummary: RecruiterSummaryResult = {
  aiModel: "gpt-test",
  aiProvider: "openai",
  candidateTimeline: ["电话沟通"],
  confirmedFacts: ["有招聘经验"],
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimeMs: 140,
  openQuestions: ["薪资待确认"],
  promptFile: "recruiter-summary.md",
  promptVersion: "1.0",
  recruiterNotesSummary: "候选人沟通清晰。",
  suggestedNextRecruiterActions: ["同步业务方"],
  unconfirmedFacts: ["团队规模"],
  workflowId
};

describe("Recruit Together API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recruitTogetherServiceMock.getPageData.mockResolvedValue({
      candidateInsights: [],
      jobProfiles: []
    } satisfies RecruitTogetherPageData);
    recruitTogetherServiceMock.generatePhonePreparation.mockResolvedValue(phonePreparation);
    recruitTogetherServiceMock.generateInterviewPreparation.mockResolvedValue(interviewPreparation);
    recruitTogetherServiceMock.generateRecruiterSummary.mockResolvedValue(recruiterSummary);
    recruitTogetherServiceMock.saveWorkflow.mockImplementation(
      async (input): Promise<RecruitTogetherWorkflowDto> => ({
        ...input,
        createdAt: "2026-01-01T00:00:00.000Z",
        humanReview: {
          completed: true,
          required: true,
          reviewedAt: "2026-01-01T00:00:00.000Z",
          reviewType: "manual_notes_and_editable_ai_outputs"
        },
        id: "00000000-0000-4000-8000-000000000103",
        updatedAt: "2026-01-01T00:00:00.000Z"
      })
    );
  });

  it("GET /api/recruit-together returns page data", async () => {
    const { GET } = await import("@/app/api/recruit-together/route");
    const response = await GET();
    const json = await readApiJson<RecruitTogetherPageData>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.candidateInsights).toEqual([]);
  });

  it("POST /api/recruit-together/phone-preparation returns structured result", async () => {
    const { POST } = await import("@/app/api/recruit-together/phone-preparation/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/recruit-together/phone-preparation", {
        candidateInsightId,
        jobProfileId
      }) as never
    );
    const json = await readApiJson<PhonePreparationResult>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.suggestedOpening).toContain("求职情况");
  });

  it("POST /api/recruit-together saves completed workflow", async () => {
    const { POST } = await import("@/app/api/recruit-together/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/recruit-together", {
        aiModel: "gpt-test",
        aiProvider: "openai",
        candidateInsightId,
        generationTimes: {
          interviewPreparation: 120,
          phonePreparation: 100,
          recruiterSummary: 140
        },
        interviewNotes: {
          concerns: [],
          interviewSummary: "面试记录",
          newEvidence: ["有项目经验"],
          overallImpression: "沟通清晰",
          strengths: ["表达清楚"],
          weaknesses: []
        },
        interviewPreparation,
        jobProfileId,
        phoneNotes: {
          availability: "两周",
          candidateMotivation: "看机会",
          communicationQuality: "清晰",
          freeNotes: "无",
          keyFacts: ["有招聘经验"],
          openQuestions: [],
          salaryExpectation: "待确认"
        },
        phonePreparation,
        promptVersions: {
          interviewPreparation: "1.0",
          phonePreparation: "1.0",
          recruiterSummary: "1.0"
        },
        recruiterSummary,
        workflowId
      }) as never
    );
    const json = await readApiJson<RecruitTogetherWorkflowDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.humanReview.completed).toBe(true);
  });
});
