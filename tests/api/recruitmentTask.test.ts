import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  RecruitmentTaskAuditDto,
  RecruitmentTaskCenterData,
  RecruitmentTaskDto
} from "@/types/recruitmentTask";

const { RecruitmentTaskServiceErrorMock, recruitmentTaskServiceMock } = vi.hoisted(() => {
  class RecruitmentTaskServiceErrorMock extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

    constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND", message: string) {
      super(message);
      this.name = "RecruitmentTaskServiceError";
      this.code = code;
    }
  }

  return {
    RecruitmentTaskServiceErrorMock,
    recruitmentTaskServiceMock: {
      applyTaskAction: vi.fn(),
      getTaskAudits: vi.fn(),
      getTaskCenter: vi.fn()
    }
  };
});

vi.mock("@/services/recruitmentTask.service", () => ({
  RecruitmentTaskServiceError: RecruitmentTaskServiceErrorMock,
  recruitmentTaskService: recruitmentTaskServiceMock
}));

const task: RecruitmentTaskDto = {
  category: "PHONE_SCREEN",
  confidence: "HIGH",
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: "AI_RECRUITER",
  dueTime: null,
  evidence: ["Candidate Insight: 候选人 A"],
  id: "task-1",
  priority: "HIGH",
  priorityReason: "候选人存在待核实风险。",
  quickStartHref: "/feishu/recruit-together",
  reason: "需要电话初筛核实信息。",
  recommendedNextAction: "打开 Recruit Together 准备电话初筛。",
  relatedCandidate: "候选人 A",
  relatedJob: "招聘专员",
  relatedWorkflow: "workflow-1",
  reviewedByRecruiter: false,
  sourceKey: "candidate:1:phone-screen",
  sourceType: "CANDIDATE_UNDERSTANDING",
  status: "TODO",
  title: "电话初筛：候选人 A",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const centerData: RecruitmentTaskCenterData = {
  counts: {
    cancelled: 0,
    completed: 0,
    deferred: 0,
    inProgress: 0,
    todo: 1,
    total: 1
  },
  generatedAt: "2026-01-01T00:00:00.000Z",
  quickStarts: [
    {
      description: "准备协作。",
      href: "/feishu/recruit-together",
      title: "Recruit Together"
    }
  ],
  tasks: [task]
};

describe("Recruitment Task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recruitmentTaskServiceMock.getTaskCenter.mockResolvedValue(centerData);
    recruitmentTaskServiceMock.applyTaskAction.mockImplementation(async (input) => ({
      ...task,
      reviewedByRecruiter: true,
      status: input.action === "COMPLETE" ? "COMPLETED" : task.status
    }));
    recruitmentTaskServiceMock.getTaskAudits.mockResolvedValue([
      {
        action: "TASK_CREATED",
        actor: "AI_RECRUITER",
        afterStatus: "TODO",
        afterValue: {
          title: task.title
        },
        beforeStatus: null,
        beforeValue: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "audit-1",
        note: null,
        taskId: task.id
      } satisfies RecruitmentTaskAuditDto
    ]);
  });

  it("GET /api/recruitment-tasks returns generated task center data", async () => {
    const { GET } = await import("@/app/api/recruitment-tasks/route");
    const response = await GET();
    const json = await readApiJson<RecruitmentTaskCenterData>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.tasks[0]?.priorityReason).toContain("风险");
  });

  it("PATCH /api/recruitment-tasks updates task status through service", async () => {
    const { PATCH } = await import("@/app/api/recruitment-tasks/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/recruitment-tasks", {
        action: "COMPLETE",
        taskId: task.id
      }) as never
    );
    const json = await readApiJson<RecruitmentTaskDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.status).toBe("COMPLETED");
    expect(recruitmentTaskServiceMock.applyTaskAction).toHaveBeenCalled();
  });

  it("GET /api/recruitment-tasks/:id/audit returns audit records", async () => {
    const { GET } = await import("@/app/api/recruitment-tasks/[id]/audit/route");
    const response = await GET(createGetRequest("http://localhost/api/recruitment-tasks/task-1/audit") as never, {
      params: Promise.resolve({
        id: task.id
      })
    });
    const json = await readApiJson<RecruitmentTaskAuditDto[]>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.[0]?.action).toBe("TASK_CREATED");
  });
});
