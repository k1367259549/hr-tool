import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  DailyRecruitingWorkspaceDto,
  DailyWorkspaceActivitySnapshot,
  DailyWorkspaceGenerateResult
} from "@/types/dailyWorkspace";

const { DailyWorkspaceServiceErrorMock, dailyWorkspaceServiceMock } = vi.hoisted(() => {
  class DailyWorkspaceServiceErrorMock extends Error {
    readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR";

    constructor(code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
      super(message);
      this.name = "DailyWorkspaceServiceError";
      this.code = code;
    }
  }

  return {
    DailyWorkspaceServiceErrorMock,
    dailyWorkspaceServiceMock: {
      generateDailyWorkspace: vi.fn(),
      getActivitySnapshot: vi.fn(),
      saveDailyWorkspace: vi.fn()
    }
  };
});

vi.mock("@/services/dailyWorkspace.service", () => ({
  DailyWorkspaceServiceError: DailyWorkspaceServiceErrorMock,
  dailyWorkspaceService: dailyWorkspaceServiceMock
}));

const snapshot: DailyWorkspaceActivitySnapshot = {
  candidateInsights: [],
  counts: {
    candidateInsights: 0,
    interviews: 0,
    jobProfiles: 1,
    phoneScreens: 0,
    recruitTogetherWorkflows: 0
  },
  date: "2026-01-01",
  jobProfiles: [
    {
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "job-1",
      jobSummary: "招聘专员岗位",
      jobTitle: "招聘专员"
    }
  ],
  recruitTogetherWorkflows: [],
  workflowHistory: ["Job Profile reviewed: 招聘专员"]
};

const unified = {
  attention: ["人工确认"],
  audit: ["基于快照"],
  confidence: "medium",
  evidence: ["1 个岗位画像"],
  insights: ["今日有岗位工作"],
  suggestedActions: ["明日继续跟进"],
  summary: "今日总结"
};

const generated: DailyWorkspaceGenerateResult = {
  activitySnapshot: snapshot,
  aiModel: "gpt-test",
  aiProvider: "openai",
  dailySummary: {
    ...unified,
    candidatesProcessed: [],
    interviewsCompleted: [],
    jobsWorkedOn: ["招聘专员"],
    keyAchievements: ["确认岗位"],
    pendingWork: ["补充候选人"],
    phoneScreensCompleted: [],
    todaysWorkSummary: "今天确认了岗位画像。"
  },
  date: "2026-01-01",
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimes: {
    dailyInsights: 100,
    dailySummary: 100,
    improvementSuggestions: 100,
    tomorrowPriorities: 100
  },
  improvementSuggestions: {
    ...unified,
    aiSuggestions: ["继续保持人工确认"],
    potentialProductImprovementNotes: [],
    promptImprovementIdeas: [],
    recruiterEfficiencySuggestions: [],
    workflowImprovementIdeas: []
  },
  promptVersions: {
    dailyInsights: "1.0",
    dailySummary: "1.0",
    improvementSuggestions: "1.0",
    tomorrowPriorities: "1.0"
  },
  recruitingInsights: {
    ...unified,
    attentionPoints: [],
    candidateUnderstandingImprovements: [],
    evidenceCoverage: ["岗位证据充分"],
    jobUnderstandingImprovements: [],
    recruitingObservations: ["今日候选人较少"],
    repeatedCandidateRisks: [],
    repeatedMissingInformation: [],
    todaysRecruitingInsights: ["需要补充候选人"]
  },
  tomorrowPriorities: {
    ...unified,
    candidatesToContact: [],
    candidatesWaitingFollowUp: [],
    highPriorityTasks: ["寻找候选人"],
    interviewsToPrepare: [],
    missingInformationToVerify: [],
    recruiterSuggestions: ["更新渠道"]
  },
  workflowId: "workflow-1"
};

describe("Daily Workspace API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dailyWorkspaceServiceMock.getActivitySnapshot.mockResolvedValue(snapshot);
    dailyWorkspaceServiceMock.generateDailyWorkspace.mockResolvedValue(generated);
    dailyWorkspaceServiceMock.saveDailyWorkspace.mockImplementation(
      async (input): Promise<DailyRecruitingWorkspaceDto> => ({
        ...input,
        createdAt: "2026-01-01T00:00:00.000Z",
        humanReview: {
          completed: true,
          learningAssetsCreated: false,
          required: true,
          reviewedAt: "2026-01-01T00:00:00.000Z",
          reviewType: "daily_workspace_manual_review"
        },
        id: "workspace-1",
        manualNotes: input.manualNotes ?? null,
        updatedAt: "2026-01-01T00:00:00.000Z"
      })
    );
  });

  it("GET /api/daily-workspace returns activity snapshot", async () => {
    const { GET } = await import("@/app/api/daily-workspace/route");
    const response = await GET(createGetRequest("http://localhost/api/daily-workspace") as never);
    const json = await readApiJson<DailyWorkspaceActivitySnapshot>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.counts.jobProfiles).toBe(1);
  });

  it("POST /api/daily-workspace generates workspace", async () => {
    const { POST } = await import("@/app/api/daily-workspace/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/daily-workspace", {
        date: "2026-01-01",
        manualNotes: "今天重点确认岗位。"
      }) as never
    );
    const json = await readApiJson<DailyWorkspaceGenerateResult>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.workflowId).toBe("workflow-1");
  });

  it("POST /api/daily-workspace/save saves reviewed workspace", async () => {
    const { POST } = await import("@/app/api/daily-workspace/save/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/daily-workspace/save", {
        ...generated,
        manualNotes: "人工确认。"
      }) as never
    );
    const json = await readApiJson<DailyRecruitingWorkspaceDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.humanReview.learningAssetsCreated).toBe(false);
  });
});
