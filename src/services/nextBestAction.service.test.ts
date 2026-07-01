import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextBestActionService } from "@/services/nextBestAction.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { RecruitingContext } from "@/types/recruitingContext";
import { RECRUITING_CONTEXT_VERSION } from "@/types/recruitingContext";
import type { RecruitmentTask } from "@/types/recruitmentTask";
import type {
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";

const { recruitingContextServiceMock } = vi.hoisted(() => ({
  recruitingContextServiceMock: {
    getRecruitingContext: vi.fn()
  }
}));

vi.mock("@/services/recruitingContext.service", () => ({
  RecruitingContextServiceError: class RecruitingContextServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR";

    constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
      super(message);
      this.name = "RecruitingContextServiceError";
      this.code = code;
    }
  },
  recruitingContextService: recruitingContextServiceMock
}));

describe("nextBestActionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recruitingContextServiceMock.getRecruitingContext.mockResolvedValue(createRecruitingContext());
  });

  it("generates evidence-backed action cards from shared recruiting context", async () => {
    const result = await nextBestActionService.getActionCards({ date: "2026-01-01" });

    expect(recruitingContextServiceMock.getRecruitingContext).toHaveBeenCalledWith({
      date: "2026-01-01"
    });
    expect(result.contextSummary.jobProfiles).toBe(1);
    expect(result.contextSummary.candidateInsights).toBe(1);
    expect(result.actionCards.length).toBeGreaterThanOrEqual(4);
    expect(result.actionCards.every((card) => card.reason.length > 0)).toBe(true);
    expect(result.actionCards.every((card) => card.evidence.length > 0)).toBe(true);
    expect(result.actionCards.every((card) => card.confidence)).toBe(true);
    expect(result.actionCards.find((card) => card.sourceKey === "candidate:candidate-1:phone-screen")?.status).toBe(
      "IN_PROGRESS"
    );
  });
});

function createRecruitingContext(): RecruitingContext {
  const generatedAt = "2026-01-01T00:00:00.000Z";
  const jobProfile = createJobProfile();
  const candidateInsight = createCandidateInsight();
  const recruitmentTask = createRecruitmentTask({
    sourceKey: "candidate:candidate-1:phone-screen",
    status: "IN_PROGRESS"
  });
  const note = createNote();
  const scheduleItem = createScheduleItem();

  return {
    analytics: {
      reason: "Reserved.",
      status: "NOT_IMPLEMENTED"
    },
    audit: {
      constraints: ["No AI calls."],
      contextVersion: RECRUITING_CONTEXT_VERSION,
      generatedAt,
      sources: []
    },
    candidates: [candidateInsight],
    contextVersion: RECRUITING_CONTEXT_VERSION,
    generatedAt,
    jobs: [jobProfile],
    learningAssets: {
      reason: "Reserved.",
      status: "NOT_IMPLEMENTED"
    },
    notes: [note],
    pendingActions: {
      missingCandidateInformationCount: 1,
      missingJobInformationCount: 1,
      openScheduleItemsCount: 1,
      openTasks: [recruitmentTask]
    },
    recruiter: {
      name: "Recruiter",
      source: "system_default"
    },
    reviewedInsights: {
      candidateInsights: [candidateInsight],
      dailyWorkspaces: [],
      jobProfiles: [jobProfile],
      recruitTogetherRecords: []
    },
    schedule: [scheduleItem],
    talentMap: {
      reason: "Reserved.",
      status: "NOT_IMPLEMENTED"
    },
    tasks: [recruitmentTask],
    today: {
      date: "2026-01-01",
      endDate: "2026-01-02T00:00:00.000Z",
      startDate: generatedAt
    },
    workflowHistory: ["Job Profile reviewed: 招聘专员"]
  };
}

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
    suggestedFollowUpQuestions: ["确认到岗时间"],
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
    potentialRisks: ["项目规模待核实"],
    promptFile: "candidate-understanding.md",
    promptVersion: "1.0",
    resumeId: "resume-1",
    resumeVersion: "v1",
    reviewedAt: now,
    strengths: [],
    suggestedInterviewQuestions: [],
    suggestedNextActions: [],
    suggestedPhoneScreenQuestions: ["请确认求职动机。"],
    summary: {
      candidateOverview: "候选人 A"
    },
    updatedAt: now,
    workflowId: "candidate-workflow-1"
  };
}

function createRecruitmentTask(overrides: Partial<RecruitmentTask> = {}): RecruitmentTask {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    category: "PHONE_SCREEN",
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
    sourceKey: "candidate:candidate-1:phone-screen",
    sourceType: "CANDIDATE_UNDERSTANDING",
    status: "TODO",
    title: "电话初筛",
    updatedAt: now,
    ...overrides
  };
}

function createNote(): RecruiterWorkspaceNoteRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    category: "Leader feedback",
    content: "紧急确认业务方反馈。",
    createdAt: now,
    date: now,
    id: "note-1",
    searchableText: "紧急确认业务方反馈。",
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
