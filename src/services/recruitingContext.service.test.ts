import { beforeEach, describe, expect, it, vi } from "vitest";
import { recruitingContextService } from "@/services/recruitingContext.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import { RECRUITING_CONTEXT_VERSION } from "@/types/recruitingContext";
import type { RecruitmentTask } from "@/types/recruitmentTask";
import type {
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";

const {
  candidateInsightRepositoryMock,
  dailyWorkspaceRepositoryMock,
  jobProfileRepositoryMock,
  recruitmentTaskRepositoryMock,
  recruiterWorkspaceRepositoryMock,
  recruitTogetherRepositoryMock
} = vi.hoisted(() => ({
  candidateInsightRepositoryMock: {
    findMany: vi.fn()
  },
  dailyWorkspaceRepositoryMock: {
    findMany: vi.fn()
  },
  jobProfileRepositoryMock: {
    findMany: vi.fn()
  },
  recruitmentTaskRepositoryMock: {
    findMany: vi.fn()
  },
  recruiterWorkspaceRepositoryMock: {
    findRecentNotes: vi.fn(),
    findScheduleByDate: vi.fn()
  },
  recruitTogetherRepositoryMock: {
    findMany: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: jobProfileRepositoryMock
}));

vi.mock("@/repositories/candidateInsight.repository", () => ({
  candidateInsightRepository: candidateInsightRepositoryMock
}));

vi.mock("@/repositories/recruitTogether.repository", () => ({
  recruitTogetherRepository: recruitTogetherRepositoryMock
}));

vi.mock("@/repositories/dailyWorkspace.repository", () => ({
  dailyWorkspaceRepository: dailyWorkspaceRepositoryMock
}));

vi.mock("@/repositories/recruitmentTask.repository", () => ({
  recruitmentTaskRepository: recruitmentTaskRepositoryMock
}));

vi.mock("@/repositories/recruiterWorkspace.repository", () => ({
  recruiterWorkspaceRepository: recruiterWorkspaceRepositoryMock
}));

describe("recruitingContextService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobProfileRepositoryMock.findMany.mockResolvedValue([createJobProfile()]);
    candidateInsightRepositoryMock.findMany.mockResolvedValue([createCandidateInsight()]);
    recruitTogetherRepositoryMock.findMany.mockResolvedValue([]);
    dailyWorkspaceRepositoryMock.findMany.mockResolvedValue([]);
    recruitmentTaskRepositoryMock.findMany.mockResolvedValue([createRecruitmentTask()]);
    recruiterWorkspaceRepositoryMock.findRecentNotes.mockResolvedValue([createNote()]);
    recruiterWorkspaceRepositoryMock.findScheduleByDate.mockResolvedValue([createScheduleItem()]);
  });

  it("builds a versioned and auditable recruiting context from shared sources", async () => {
    const context = await recruitingContextService.getRecruitingContext({
      date: "2026-01-01",
      recruiterName: "小陈"
    });

    expect(context.contextVersion).toBe(RECRUITING_CONTEXT_VERSION);
    expect(context.recruiter).toEqual({
      name: "小陈",
      source: "input"
    });
    expect(context.today.date).toBe("2026-01-01");
    expect(context.jobs).toHaveLength(1);
    expect(context.candidates).toHaveLength(1);
    expect(context.tasks).toHaveLength(1);
    expect(context.notes).toHaveLength(1);
    expect(context.schedule).toHaveLength(1);
    expect(context.pendingActions.missingJobInformationCount).toBe(1);
    expect(context.pendingActions.missingCandidateInformationCount).toBe(1);
    expect(context.pendingActions.openScheduleItemsCount).toBe(1);
    expect(context.pendingActions.openTasks).toHaveLength(1);
    expect(context.audit.sources.find((source) => source.source === "JobProfile")?.recordCount).toBe(1);
    expect(context.audit.constraints).toContain("No AI calls.");
    expect(context.talentMap.status).toBe("NOT_IMPLEMENTED");
    expect(context.learningAssets.status).toBe("NOT_IMPLEMENTED");
    expect(context.analytics.status).toBe("NOT_IMPLEMENTED");
  });

  it("rejects invalid dates before loading source records", async () => {
    await expect(recruitingContextService.getRecruitingContext({ date: "not-a-date" })).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });

    expect(jobProfileRepositoryMock.findMany).not.toHaveBeenCalled();
  });
});

function createJobProfile(): JobProfile {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    aiModel: "model",
    aiProvider: "provider",
    coreResponsibilities: [],
    createdAt: now,
    generationTimeMs: 100,
    hiringFocus: [],
    hiringGoal: "完成招聘",
    id: "job-1",
    interviewFocus: [],
    jd: "JD",
    jobSummary: "招聘专员",
    jobTitle: "招聘专员",
    leaderRequirements: null,
    missingInformation: ["薪资范围"],
    notes: null,
    potentialRisks: [],
    preferredCompetencies: [],
    promptFile: "job-understanding.md",
    promptVersion: "1.0",
    requiredCompetencies: [],
    reviewedAt: now,
    suggestedFollowUpQuestions: [],
    teamBackground: null,
    updatedAt: now,
    workflowId: "job-workflow-1"
  };
}

function createCandidateInsight(): CandidateInsight {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    aiModel: "model",
    aiProvider: "provider",
    candidateSource: null,
    createdAt: now,
    evidence: [],
    generationTimeMs: 100,
    id: "candidate-1",
    insights: {},
    jobProfileId: "job-1",
    jobProfileVersion: "v1",
    missingInformation: ["期望薪资"],
    notes: null,
    potentialRisks: [],
    promptFile: "candidate-understanding.md",
    promptVersion: "1.0",
    resumeId: "resume-1",
    resumeVersion: "v1",
    reviewedAt: now,
    strengths: [],
    suggestedInterviewQuestions: [],
    suggestedNextActions: [],
    suggestedPhoneScreenQuestions: [],
    summary: {
      candidateOverview: "候选人 A"
    },
    updatedAt: now,
    workflowId: "candidate-workflow-1"
  };
}

function createRecruitmentTask(): RecruitmentTask {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    category: "MISSING_INFORMATION",
    confidence: "HIGH",
    createdAt: now,
    createdBy: "AI_RECRUITER",
    dueTime: null,
    evidence: ["evidence"],
    id: "task-1",
    priority: "HIGH",
    priorityReason: "reason",
    quickStartHref: "/feishu/recruit-together",
    reason: "reason",
    recommendedNextAction: "next",
    relatedCandidate: "候选人 A",
    relatedJob: "招聘专员",
    relatedWorkflow: "candidate-workflow-1",
    reviewedByRecruiter: false,
    sourceKey: "candidate:candidate-1:missing:0",
    sourceType: "CANDIDATE_UNDERSTANDING",
    status: "TODO",
    title: "补充信息",
    updatedAt: now
  };
}

function createNote(): RecruiterWorkspaceNoteRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    category: "Leader feedback",
    content: "确认岗位优先级。",
    createdAt: now,
    date: now,
    id: "note-1",
    searchableText: "确认岗位优先级。",
    source: "MANUAL",
    updatedAt: now
  };
}

function createScheduleItem(): RecruiterWorkspaceScheduleRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    completed: false,
    createdAt: now,
    date: now,
    id: "schedule-1",
    itemType: "PHONE_SCREEN",
    notes: null,
    order: 0,
    relatedName: "候选人 A",
    startTime: "10:00",
    title: "电话初筛",
    updatedAt: now
  };
}
