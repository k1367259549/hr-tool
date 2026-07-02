import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  RecruiterWorkspaceData,
  RecruiterWorkspaceNoteDto,
  RecruiterWorkspaceScheduleItemDto,
  RecruiterWorkspaceScheduleItemInput
} from "@/types/recruiterWorkspace";

const { RecruiterWorkspaceServiceErrorMock, recruiterWorkspaceServiceMock } = vi.hoisted(() => {
  class RecruiterWorkspaceServiceErrorMock extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR";

    constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
      super(message);
      this.name = "RecruiterWorkspaceServiceError";
      this.code = code;
    }
  }

  return {
    RecruiterWorkspaceServiceErrorMock,
    recruiterWorkspaceServiceMock: {
      addNote: vi.fn(),
      getWorkspace: vi.fn(),
      saveSchedule: vi.fn()
    }
  };
});

vi.mock("@/services/recruiterWorkspace.service", () => ({
  RecruiterWorkspaceServiceError: RecruiterWorkspaceServiceErrorMock,
  recruiterWorkspaceService: recruiterWorkspaceServiceMock
}));

const workspaceData: RecruiterWorkspaceData = {
  actionCards: [
    {
      category: "PHONE_SCREEN",
      confidence: "HIGH",
      evidence: ["候选人洞察建议电话初筛。"],
      priority: "HIGH",
      priorityReason: "候选人存在待核实风险。",
      quickStartHref: "/feishu/recruit-together",
      reason: "需要先核实候选人关键信息。",
      recommendedNextAction: "打开 Recruit Together 准备电话初筛。",
      relatedCandidate: "候选人 A",
      relatedJob: "招聘专员",
      relatedWorkflow: "candidate-workflow-1",
      sourceKey: "candidate:candidate-1:phone-screen",
      sourceType: "CANDIDATE_UNDERSTANDING",
      status: "TODO",
      title: "电话初筛：候选人 A"
    }
  ],
  aiSuggestions: {
    candidatesRequiringAttention: ["候选人 A：薪资待确认"],
    evidence: ["基于 1 个候选人洞察。"],
    jobsRequiringClarification: ["招聘专员：补充岗位缺失信息"],
    missingInformation: ["薪资范围"],
    potentialRisks: ["简历缺少团队规模"],
    priorities: ["优先完成电话初筛准备。"]
  },
  candidateGroups: [],
  focusItems: [
    {
      category: "PHONE_SCREEN",
      confidence: "HIGH",
      evidence: ["候选人洞察建议电话初筛。"],
      priority: "HIGH",
      priorityReason: "候选人存在待核实风险。",
      quickStartHref: "/feishu/recruit-together",
      reason: "需要先核实候选人关键信息。",
      recommendedNextAction: "打开 Recruit Together 准备电话初筛。",
      relatedCandidate: "候选人 A",
      relatedJob: "招聘专员",
      relatedWorkflow: "candidate-workflow-1",
      sourceKey: "candidate:candidate-1:phone-screen",
      sourceType: "CANDIDATE_UNDERSTANDING",
      status: "TODO",
      title: "电话初筛：候选人 A"
    }
  ],
  futurePlaceholders: [],
  notes: [],
  overview: {
    date: "2026-01-01",
    greeting: "Good Morning",
    overview: "今天有 1 个岗位画像。",
    recruiterName: "Recruiter"
  },
  quickActions: [],
  recentActivity: [],
  schedule: [],
  todaysJobs: [
    {
      candidatesToday: 1,
      currentStage: "岗位理解已确认",
      hiringGoal: "本周完成初筛",
      href: "/feishu/job-profile/new",
      id: "job-1",
      jobTitle: "招聘专员",
      pendingActions: ["补充岗位缺失信息"]
    }
  ],
  workflowProgress: [
    {
      href: "/feishu/job-profile/new",
      nextAction: "继续候选人理解。",
      status: "COMPLETED",
      title: "Job Understanding",
      workflow: "JOB_UNDERSTANDING"
    },
    {
      href: "/feishu/candidate-understanding/new",
      nextAction: "上传简历并保存候选人洞察。",
      status: "IN_PROGRESS",
      title: "Candidate Understanding",
      workflow: "CANDIDATE_UNDERSTANDING"
    },
    {
      href: "/feishu/recruit-together",
      nextAction: "准备电话初筛和面试协作。",
      status: "NOT_STARTED",
      title: "Recruit Together",
      workflow: "RECRUIT_TOGETHER"
    },
    {
      href: "/feishu/daily-workspace",
      nextAction: "生成每日总结和明日优先级。",
      status: "NOT_STARTED",
      title: "Daily Workspace",
      workflow: "DAILY_WORKSPACE"
    },
    {
      href: "/feishu/tasks",
      nextAction: "同步任务并回到 Workspace。",
      status: "NOT_STARTED",
      title: "Task Center",
      workflow: "TASK_CENTER"
    }
  ]
};

describe("Recruiter Workspace API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recruiterWorkspaceServiceMock.getWorkspace.mockResolvedValue(workspaceData);
    recruiterWorkspaceServiceMock.addNote.mockImplementation(
      async (input): Promise<RecruiterWorkspaceNoteDto> => ({
        category: input.category ?? null,
        content: input.content,
        createdAt: "2026-01-01T00:00:00.000Z",
        date: input.date ?? "2026-01-01",
        id: "note-1",
        searchableText: input.content,
        source: "MANUAL",
        updatedAt: "2026-01-01T00:00:00.000Z"
      })
    );
    recruiterWorkspaceServiceMock.saveSchedule.mockImplementation(
      async (input: {
        date?: string;
        items: RecruiterWorkspaceScheduleItemInput[];
      }): Promise<RecruiterWorkspaceScheduleItemDto[]> =>
        input.items.map((item, index) => ({
          completed: item.completed ?? false,
          createdAt: "2026-01-01T00:00:00.000Z",
          date: input.date ?? "2026-01-01",
          id: `schedule-${index}`,
          itemType: item.itemType,
          notes: item.notes,
          order: item.order ?? index,
          relatedName: item.relatedName,
          startTime: item.startTime,
          title: item.title,
          updatedAt: "2026-01-01T00:00:00.000Z"
        }))
    );
  });

  it("GET /api/recruiter-workspace returns homepage data", async () => {
    const { GET } = await import("@/app/api/recruiter-workspace/route");
    const response = await GET(
      createGetRequest("http://localhost/api/recruiter-workspace?date=2026-01-01") as never
    );
    const json = await readApiJson<RecruiterWorkspaceData>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.todaysJobs[0]?.jobTitle).toBe("招聘专员");
    expect(recruiterWorkspaceServiceMock.getWorkspace).toHaveBeenCalledWith({
      date: "2026-01-01"
    });
  });

  it("POST /api/recruiter-workspace/notes saves recruiter note", async () => {
    const { POST } = await import("@/app/api/recruiter-workspace/notes/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/recruiter-workspace/notes", {
        category: "Leader feedback",
        content: "业务方希望优先看沟通能力。",
        date: "2026-01-01"
      }) as never
    );
    const json = await readApiJson<RecruiterWorkspaceNoteDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.content).toContain("业务方");
    expect(recruiterWorkspaceServiceMock.addNote).toHaveBeenCalled();
  });

  it("POST /api/recruiter-workspace/schedule saves adjusted schedule", async () => {
    const { POST } = await import("@/app/api/recruiter-workspace/schedule/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/recruiter-workspace/schedule", {
        date: "2026-01-01",
        items: [
          {
            itemType: "PHONE_SCREEN",
            startTime: "10:00",
            title: "候选人电话初筛"
          }
        ]
      }) as never
    );
    const json = await readApiJson<RecruiterWorkspaceScheduleItemDto[]>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.[0]?.itemType).toBe("PHONE_SCREEN");
    expect(recruiterWorkspaceServiceMock.saveSchedule).toHaveBeenCalled();
  });
});
