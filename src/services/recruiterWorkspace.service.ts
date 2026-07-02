import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { dailyWorkspaceRepository } from "@/repositories/dailyWorkspace.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { recruiterWorkspaceRepository } from "@/repositories/recruiterWorkspace.repository";
import { recruitTogetherRepository } from "@/repositories/recruitTogether.repository";
import { nextBestActionService } from "@/services/nextBestAction.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { NextBestActionCard } from "@/types/nextBestAction";
import type { RecruitTogetherWorkflow } from "@/types/recruitTogether";
import type {
  RecruiterWorkspaceActivity,
  RecruiterWorkspaceActionCard,
  RecruiterWorkspaceAiSuggestions,
  RecruiterWorkspaceCandidateCard,
  RecruiterWorkspaceCandidateGroup,
  RecruiterWorkspaceData,
  RecruiterWorkspaceJobCard,
  RecruiterWorkspaceNoteDto,
  RecruiterWorkspaceNoteInput,
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceOverview,
  RecruiterWorkspaceScheduleItemDto,
  RecruiterWorkspaceScheduleItemInput,
  RecruiterWorkspaceScheduleRecord,
  RecruiterWorkspaceWorkflowProgressItem
} from "@/types/recruiterWorkspace";

export class RecruiterWorkspaceServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR";

  constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
    super(message);
    this.name = "RecruiterWorkspaceServiceError";
    this.code = code;
  }
}

export const recruiterWorkspaceService = {
  async getWorkspace(input: { date?: string } = {}): Promise<RecruiterWorkspaceData> {
    const date = normalizeDateInput(input.date);
    const { endDate, startDate } = getDayRange(date);
    const [jobProfiles, todaysCandidateInsights, todaysWorkflows, schedule, notes, dailyWorkspaces, nextBestAction] =
      await Promise.all([
        jobProfileRepository.findMany(),
        candidateInsightRepository.findManyCreatedBetween(startDate, endDate),
        recruitTogetherRepository.findManyCreatedBetween(startDate, endDate),
        recruiterWorkspaceRepository.findScheduleByDate(date),
        recruiterWorkspaceRepository.findNotesByDate(date),
        dailyWorkspaceRepository.findManyCreatedBetween(startDate, endDate),
        nextBestActionService.getActionCards({ date: toDateString(date) })
      ]);
    const jobMap = new Map(jobProfiles.map((profile) => [profile.id, profile]));
    const overview = createOverview(date, jobProfiles, todaysCandidateInsights, todaysWorkflows);
    const todaysJobs = createJobCards(jobProfiles, todaysCandidateInsights, todaysWorkflows);
    const candidateGroups = createCandidateGroups(todaysCandidateInsights, todaysWorkflows, jobMap);
    const aiSuggestions = createAiSuggestions(nextBestAction.actionCards);
    const actionCards = nextBestAction.actionCards.map(toWorkspaceActionCard);
    const focusItems = createFocusItems(actionCards);
    const workflowProgress = createWorkflowProgress({
      actionCards,
      dailyWorkspaces,
      jobProfiles,
      todaysCandidateInsights,
      todaysWorkflows
    });
    const recentActivity = createRecentActivity({
      dailyWorkspaces,
      jobProfiles,
      notes,
      todaysCandidateInsights,
      todaysWorkflows
    });

    return {
      actionCards,
      aiSuggestions,
      candidateGroups,
      focusItems,
      futurePlaceholders: [
        {
          description: "后续只展示经过人工发布的 Talent Map，不在本页自动创建。",
          title: "Talent Map"
        },
        {
          description: "Learning Assets 需要单独的人审、版本和审计流程。",
          title: "Learning Assets"
        },
        {
          description: "招聘分析会基于已审阅数据生成，不替代 Recruiter 判断。",
          title: "Recruitment Analytics"
        }
      ],
      notes: notes.map(toNoteDto),
      overview,
      quickActions: [
        {
          description: "粘贴 JD，生成岗位理解。",
          href: "/feishu/job-profile/new",
          title: "Create Job Profile"
        },
        {
          description: "上传简历，生成候选人理解。",
          href: "/feishu/candidate-understanding/new",
          title: "Candidate Understanding"
        },
        {
          description: "准备电话初筛、面试和协作总结。",
          href: "/feishu/recruit-together",
          title: "Recruit Together"
        },
        {
          description: "生成每日总结、洞察和明日优先级。",
          href: "/feishu/daily-workspace",
          title: "Daily Workspace"
        },
        {
          description: "查看 AI Recruiter 推荐的下一步动作。",
          href: "/feishu/tasks",
          title: "Task Center"
        },
        {
          description: "进入简历模块占位页。",
          href: "/feishu/resumes",
          title: "Upload Resume"
        }
      ],
      recentActivity,
      schedule: schedule.map(toScheduleDto),
      todaysJobs,
      workflowProgress
    };
  },

  async addNote(input: { date?: string } & RecruiterWorkspaceNoteInput): Promise<RecruiterWorkspaceNoteDto> {
    const content = input.content.trim();

    if (content.length === 0) {
      throw new RecruiterWorkspaceServiceError("VALIDATION_ERROR", "笔记内容不能为空。");
    }

    if (content.length > 5000) {
      throw new RecruiterWorkspaceServiceError("VALIDATION_ERROR", "笔记内容不能超过 5000 个字符。");
    }

    try {
      const note = await recruiterWorkspaceRepository.createNote(normalizeDateInput(input.date), {
        category: input.category,
        content
      });

      return toNoteDto(note);
    } catch (error) {
      if (error instanceof RecruiterWorkspaceServiceError) {
        throw error;
      }

      throw new RecruiterWorkspaceServiceError("DATABASE_ERROR", "保存 Recruiter Notes 失败。");
    }
  },

  async saveSchedule(input: {
    date?: string;
    items: RecruiterWorkspaceScheduleItemInput[];
  }): Promise<RecruiterWorkspaceScheduleItemDto[]> {
    const items = input.items.map((item, index) => normalizeScheduleItem(item, index));

    try {
      const savedItems = await recruiterWorkspaceRepository.replaceSchedule(
        normalizeDateInput(input.date),
        items
      );

      return savedItems.map(toScheduleDto);
    } catch {
      throw new RecruiterWorkspaceServiceError("DATABASE_ERROR", "保存今日日程失败。");
    }
  }
};

function createOverview(
  date: Date,
  jobProfiles: JobProfile[],
  candidateInsights: CandidateInsight[],
  workflows: RecruitTogetherWorkflow[]
): RecruiterWorkspaceOverview {
  return {
    date: toDateString(date),
    greeting: getGreeting(date),
    overview: `今天有 ${jobProfiles.length} 个已确认岗位画像，${candidateInsights.length} 个候选人需要关注，${workflows.length} 条协作流程记录。`,
    recruiterName: "Recruiter"
  };
}

function createFocusItems(actionCards: RecruiterWorkspaceActionCard[]): RecruiterWorkspaceActionCard[] {
  const activeCards = actionCards.filter(
    (card) => card.status !== "COMPLETED" && card.status !== "CANCELLED"
  );
  const highPriorityCards = activeCards.filter((card) => card.priority === "HIGH");

  return (highPriorityCards.length > 0 ? highPriorityCards : activeCards).slice(0, 2);
}

function createWorkflowProgress({
  actionCards,
  dailyWorkspaces,
  jobProfiles,
  todaysCandidateInsights,
  todaysWorkflows
}: {
  jobProfiles: JobProfile[];
  todaysCandidateInsights: CandidateInsight[];
  todaysWorkflows: RecruitTogetherWorkflow[];
  dailyWorkspaces: Array<{ id: string }>;
  actionCards: RecruiterWorkspaceActionCard[];
}): RecruiterWorkspaceWorkflowProgressItem[] {
  const activeActionCards = actionCards.filter(
    (card) => card.status !== "COMPLETED" && card.status !== "CANCELLED"
  );
  const jobCompleted = jobProfiles.length > 0;
  const candidateCompleted = todaysCandidateInsights.length > 0;
  const recruitTogetherCompleted = todaysWorkflows.length > 0;
  const dailyWorkspaceCompleted = dailyWorkspaces.length > 0;
  const taskCenterStatus = activeActionCards.length > 0 ? "IN_PROGRESS" : "NOT_STARTED";

  return [
    {
      href: "/feishu/job-profile/new",
      nextAction: jobCompleted ? "继续候选人理解。" : "粘贴 JD 并保存岗位画像。",
      status: jobCompleted ? "COMPLETED" : "NOT_STARTED",
      title: "Job Understanding",
      workflow: "JOB_UNDERSTANDING"
    },
    {
      href: "/feishu/candidate-understanding/new",
      nextAction: candidateCompleted ? "进入 Recruit Together。" : "上传简历并保存候选人洞察。",
      status: candidateCompleted ? "COMPLETED" : jobCompleted ? "IN_PROGRESS" : "NOT_STARTED",
      title: "Candidate Understanding",
      workflow: "CANDIDATE_UNDERSTANDING"
    },
    {
      href: "/feishu/recruit-together",
      nextAction: recruitTogetherCompleted ? "生成 Daily Workspace。" : "准备电话初筛和面试协作。",
      status: recruitTogetherCompleted ? "COMPLETED" : candidateCompleted ? "IN_PROGRESS" : "NOT_STARTED",
      title: "Recruit Together",
      workflow: "RECRUIT_TOGETHER"
    },
    {
      href: "/feishu/daily-workspace",
      nextAction: dailyWorkspaceCompleted ? "打开 Task Center。" : "生成每日总结和明日优先级。",
      status: dailyWorkspaceCompleted ? "COMPLETED" : recruitTogetherCompleted ? "IN_PROGRESS" : "NOT_STARTED",
      title: "Daily Workspace",
      workflow: "DAILY_WORKSPACE"
    },
    {
      href: "/feishu/tasks",
      nextAction: activeActionCards.length > 0 ? "处理下一步 Recruiter 动作。" : "同步任务并回到 Workspace。",
      status: taskCenterStatus,
      title: "Task Center",
      workflow: "TASK_CENTER"
    }
  ];
}

function createJobCards(
  jobProfiles: JobProfile[],
  candidateInsights: CandidateInsight[],
  workflows: RecruitTogetherWorkflow[]
): RecruiterWorkspaceJobCard[] {
  return jobProfiles.slice(0, 8).map((profile) => {
    const relatedCandidates = candidateInsights.filter((insight) => insight.jobProfileId === profile.id);
    const relatedWorkflows = workflows.filter((workflow) => workflow.jobProfileId === profile.id);

    return {
      candidatesToday: relatedCandidates.length,
      currentStage: relatedWorkflows.length > 0 ? "协作跟进中" : "岗位理解已确认",
      hiringGoal: profile.hiringGoal ?? "待补充 Hiring Goal",
      href: "/feishu/job-profile/new",
      id: profile.id,
      jobTitle: profile.jobTitle,
      pendingActions: createJobPendingActions(profile, relatedCandidates.length, relatedWorkflows.length)
    };
  });
}

function createJobPendingActions(
  profile: JobProfile,
  candidateCount: number,
  workflowCount: number
): string[] {
  const actions: string[] = [];

  if (profile.missingInformation.length > 0) {
    actions.push(`补充岗位缺失信息：${profile.missingInformation[0]}`);
  }

  if (candidateCount === 0) {
    actions.push("今天还没有候选人洞察，建议补充简历理解。");
  }

  if (candidateCount > workflowCount) {
    actions.push("有候选人尚未进入 Recruit Together。");
  }

  return actions.length > 0 ? actions : ["保持跟进，无自动流转。"];
}

function createCandidateGroups(
  candidateInsights: CandidateInsight[],
  workflows: RecruitTogetherWorkflow[],
  jobMap: Map<string, JobProfile>
): RecruiterWorkspaceCandidateGroup[] {
  const workflowByCandidate = new Map(workflows.map((workflow) => [workflow.candidateInsightId, workflow]));
  const candidates = candidateInsights.map((insight) =>
    createCandidateCard(insight, workflowByCandidate.get(insight.id), jobMap.get(insight.jobProfileId))
  );

  return [
    {
      candidates: candidates.filter((candidate) => candidate.currentWorkflow === "候选人理解已确认"),
      group: "Need Phone Screen",
      title: "需要电话初筛"
    },
    {
      candidates: candidates.filter((candidate) => candidate.currentWorkflow === "电话初筛后待面试准备"),
      group: "Need Interview",
      title: "需要面试准备"
    },
    {
      candidates: candidates.filter((candidate) => candidate.nextAction.includes("跟进")),
      group: "Need Follow-up",
      title: "需要跟进"
    },
    {
      candidates: candidates.filter((candidate) => candidate.attention.length > 0),
      group: "Waiting Information",
      title: "等待信息补充"
    },
    {
      candidates: candidates.slice(0, 6),
      group: "Recently Updated",
      title: "最近更新"
    }
  ];
}

function createCandidateCard(
  insight: CandidateInsight,
  workflow: RecruitTogetherWorkflow | undefined,
  jobProfile: JobProfile | undefined
): RecruiterWorkspaceCandidateCard {
  const candidateName = readCandidateOverview(insight.summary);
  const hasPhoneNotes = workflow ? hasJsonContent(workflow.phoneNotes) : false;
  const hasInterviewNotes = workflow ? hasJsonContent(workflow.interviewNotes) : false;
  let currentWorkflow = "候选人理解已确认";
  let nextAction = "准备电话初筛";

  if (hasPhoneNotes && !hasInterviewNotes) {
    currentWorkflow = "电话初筛后待面试准备";
    nextAction = "准备面试问题和证据核实";
  } else if (hasInterviewNotes) {
    currentWorkflow = "面试记录已补充";
    nextAction = "跟进未确认事实和开放问题";
  }

  return {
    attention: [...insight.potentialRisks.slice(0, 2), ...insight.missingInformation.slice(0, 2)],
    candidateName,
    currentWorkflow,
    href: "/feishu/recruit-together",
    id: insight.id,
    nextAction,
    relatedJob: jobProfile?.jobTitle ?? "未关联岗位"
  };
}

function createAiSuggestions(actionCards: NextBestActionCard[]): RecruiterWorkspaceAiSuggestions {
  const activeCards = actionCards.filter(
    (card) => card.status !== "COMPLETED" && card.status !== "CANCELLED"
  );
  const highPriorityCards = activeCards.filter((card) => card.priority === "HIGH");
  const riskCards = activeCards.filter(
    (card) => card.category === "PHONE_SCREEN" || card.category === "MISSING_INFORMATION"
  );
  const clarificationCards = activeCards.filter(
    (card) => card.category === "JOB_CLARIFICATION" || card.category === "LEADER_CONFIRMATION"
  );

  return {
    candidatesRequiringAttention: activeCards
      .filter((card) => card.relatedCandidate)
      .slice(0, 5)
      .map((card) => `${card.relatedCandidate}：${card.recommendedNextAction}`),
    evidence: [
      `基于 ${actionCards.length} 张 Next Best Action Cards。`,
      "Action Cards 聚合 Reviewed Job Profile、Candidate Insight、Recruit Together、Daily Workspace、Recruiter Notes、Schedule 和 Workflow History。",
      "所有建议只提供 Decision Support，不自动执行。"
    ],
    jobsRequiringClarification: clarificationCards
      .slice(0, 5)
      .map((card) => `${card.relatedJob ?? card.title}：${card.reason}`),
    missingInformation: riskCards
      .filter((card) => card.category === "MISSING_INFORMATION")
      .slice(0, 5)
      .map((card) => card.title),
    potentialRisks: riskCards.slice(0, 5).map((card) => card.priorityReason),
    priorities:
      highPriorityCards.length > 0
        ? highPriorityCards.slice(0, 5).map((card) => card.title)
        : activeCards.slice(0, 5).map((card) => card.title)
  };
}

function createRecentActivity({
  dailyWorkspaces,
  jobProfiles,
  notes,
  todaysCandidateInsights,
  todaysWorkflows
}: {
  jobProfiles: JobProfile[];
  todaysCandidateInsights: CandidateInsight[];
  todaysWorkflows: RecruitTogetherWorkflow[];
  dailyWorkspaces: Array<{ id: string; workflowId: string; createdAt: Date }>;
  notes: RecruiterWorkspaceNoteRecord[];
}): RecruiterWorkspaceActivity[] {
  const activities: RecruiterWorkspaceActivity[] = [
    ...jobProfiles.slice(0, 6).map((profile) => ({
      description: profile.jobSummary,
      href: "/feishu/job-profile/new",
      id: profile.id,
      source: "Job Profile" as const,
      status: "reviewed",
      time: profile.createdAt.toISOString(),
      title: `岗位画像已确认：${profile.jobTitle}`
    })),
    ...todaysCandidateInsights.map((insight) => ({
      description: readCandidateOverview(insight.summary),
      href: "/feishu/recruit-together",
      id: insight.id,
      source: "Candidate Insight" as const,
      status: "reviewed",
      time: insight.createdAt.toISOString(),
      title: "候选人洞察已确认"
    })),
    ...todaysWorkflows.map((workflow) => ({
      description: `Workflow ID: ${workflow.workflowId}`,
      href: "/feishu/recruit-together",
      id: workflow.id,
      source: "Recruit Together" as const,
      status: "saved",
      time: workflow.createdAt.toISOString(),
      title: "Recruit Together 已保存"
    })),
    ...dailyWorkspaces.map((workspace) => ({
      description: `Workflow ID: ${workspace.workflowId}`,
      href: "/feishu/daily-workspace",
      id: workspace.id,
      source: "Daily Workspace" as const,
      status: "saved",
      time: workspace.createdAt.toISOString(),
      title: "Daily Workspace 已保存"
    })),
    ...notes.map((note) => ({
      description: note.content,
      id: note.id,
      source: "Recruiter Note" as const,
      status: "manual",
      time: note.createdAt.toISOString(),
      title: note.category ? `Recruiter Note：${note.category}` : "Recruiter Note"
    }))
  ];

  return activities
    .sort((first, second) => new Date(second.time).getTime() - new Date(first.time).getTime())
    .slice(0, 12);
}

function toWorkspaceActionCard(card: NextBestActionCard): RecruiterWorkspaceActionCard {
  return {
    category: card.category,
    confidence: card.confidence,
    dueTime: card.dueTime?.toISOString(),
    evidence: card.evidence,
    priority: card.priority,
    priorityReason: card.priorityReason,
    quickStartHref: card.quickStartHref,
    reason: card.reason,
    recommendedNextAction: card.recommendedNextAction,
    relatedCandidate: card.relatedCandidate,
    relatedJob: card.relatedJob,
    relatedWorkflow: card.relatedWorkflow,
    sourceKey: card.sourceKey,
    sourceType: card.sourceType,
    status: card.status,
    title: card.title
  };
}

function normalizeScheduleItem(
  item: RecruiterWorkspaceScheduleItemInput,
  index: number
): RecruiterWorkspaceScheduleItemInput {
  const title = item.title.trim();

  if (title.length === 0) {
    throw new RecruiterWorkspaceServiceError("VALIDATION_ERROR", "日程标题不能为空。");
  }

  if (title.length > 200) {
    throw new RecruiterWorkspaceServiceError("VALIDATION_ERROR", "日程标题不能超过 200 个字符。");
  }

  return {
    completed: item.completed ?? false,
    itemType: item.itemType,
    notes: item.notes?.trim(),
    order: item.order ?? index,
    relatedName: item.relatedName?.trim(),
    startTime: item.startTime?.trim(),
    title
  };
}

function normalizeDateInput(value: string | undefined): Date {
  if (!value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new RecruiterWorkspaceServiceError("VALIDATION_ERROR", "日期格式无效。");
  }

  return parsedDate;
}

function getDayRange(date: Date): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return { endDate, startDate };
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 18) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function readCandidateOverview(value: unknown): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const candidate = value as { candidateOverview?: unknown };

    if (typeof candidate.candidateOverview === "string" && candidate.candidateOverview.trim()) {
      return candidate.candidateOverview.trim().slice(0, 80);
    }
  }

  return "Candidate Insight";
}

function hasJsonContent(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return JSON.stringify(value).replace(/[{}\[\]",:\s]/g, "").length > 0;
}

function toNoteDto(note: RecruiterWorkspaceNoteRecord): RecruiterWorkspaceNoteDto {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    date: toDateString(note.date),
    updatedAt: note.updatedAt.toISOString()
  };
}

function toScheduleDto(item: RecruiterWorkspaceScheduleRecord): RecruiterWorkspaceScheduleItemDto {
  return {
    completed: item.completed,
    createdAt: item.createdAt.toISOString(),
    date: toDateString(item.date),
    id: item.id,
    itemType: item.itemType as RecruiterWorkspaceScheduleItemDto["itemType"],
    notes: item.notes ?? undefined,
    order: item.order,
    relatedName: item.relatedName ?? undefined,
    startTime: item.startTime ?? undefined,
    title: item.title,
    updatedAt: item.updatedAt.toISOString()
  };
}
