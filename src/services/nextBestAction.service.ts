import {
  RecruitingContextServiceError,
  recruitingContextService
} from "@/services/recruitingContext.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { DailyRecruitingWorkspace } from "@/types/dailyWorkspace";
import type { JobProfile } from "@/types/jobProfile";
import type {
  NextBestActionCard,
  NextBestActionInput,
  NextBestActionResult
} from "@/types/nextBestAction";
import type { RecruitingContext } from "@/types/recruitingContext";
import type { RecruitTogetherWorkflow } from "@/types/recruitTogether";
import type { RecruitmentTaskStatus } from "@/types/recruitmentTask";
import type {
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";

export class NextBestActionServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR";

  constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
    super(message);
    this.name = "NextBestActionServiceError";
    this.code = code;
  }
}

export const nextBestActionService = {
  async getActionCards(input: NextBestActionInput = {}): Promise<NextBestActionResult> {
    const context = await loadContext(input);
    const statusBySourceKey = new Map(
      context.tasks.map((task) => [task.sourceKey, task.status as RecruitmentTaskStatus])
    );
    const actionCards = createActionCards(context).map((card) => ({
      ...card,
      status: statusBySourceKey.get(card.sourceKey) ?? card.status
    }));

    return {
      actionCards,
      contextSummary: {
        candidateInsights: context.candidates.length,
        dailyWorkspaces: context.reviewedInsights.dailyWorkspaces.length,
        jobProfiles: context.jobs.length,
        recruiterNotes: context.notes.length,
        recruitmentTasks: context.tasks.length,
        recruitTogetherRecords: context.reviewedInsights.recruitTogetherRecords.length,
        scheduleItems: context.schedule.length,
        workflowHistory: context.workflowHistory.length
      },
      generatedAt: context.generatedAt
    };
  }
};

async function loadContext(input: NextBestActionInput): Promise<RecruitingContext> {
  try {
    return await recruitingContextService.getRecruitingContext({
      date: input.date
    });
  } catch (error) {
    if (error instanceof RecruitingContextServiceError) {
      throw new NextBestActionServiceError(error.code, error.message);
    }

    throw new NextBestActionServiceError("DATABASE_ERROR", "招聘上下文加载失败。");
  }
}

function createActionCards(context: RecruitingContext): NextBestActionCard[] {
  const jobMap = new Map(context.jobs.map((job) => [job.id, job]));
  const workflowByCandidate = new Map(
    context.reviewedInsights.recruitTogetherRecords.map((workflow) => [workflow.candidateInsightId, workflow])
  );

  return [
    ...createJobActionCards(context.jobs),
    ...createCandidateActionCards(context.candidates, jobMap, workflowByCandidate),
    ...createRecruitTogetherActionCards(
      context.reviewedInsights.recruitTogetherRecords,
      context.candidates,
      jobMap
    ),
    ...createDailyWorkspaceActionCards(context.reviewedInsights.dailyWorkspaces),
    ...createRecruiterNoteActionCards(context.notes),
    ...createScheduleActionCards(context.schedule)
  ];
}

function createJobActionCards(jobProfiles: JobProfile[]): NextBestActionCard[] {
  return jobProfiles.flatMap((job) => {
    const cards: NextBestActionCard[] = [];

    job.missingInformation.slice(0, 3).forEach((missingItem, index) => {
      cards.push({
        category: "JOB_CLARIFICATION",
        confidence: "HIGH",
        evidence: [`Job Profile: ${job.jobTitle}`, `Missing information: ${missingItem}`],
        priority: index === 0 ? "HIGH" : "MEDIUM",
        priorityReason: "岗位画像存在缺失信息，会影响候选人理解和沟通准备。",
        quickStartHref: "/feishu/job-profile/new",
        reason: "Reviewed Job Profile 显示岗位信息仍需澄清。",
        recommendedNextAction: "向业务方确认该信息，并人工更新岗位上下文。",
        relatedJob: job.jobTitle,
        relatedWorkflow: job.workflowId,
        sourceKey: `job:${job.id}:missing:${index}:${hashText(missingItem)}`,
        sourceType: "JOB_UNDERSTANDING",
        status: "TODO",
        title: `澄清岗位信息：${job.jobTitle}`
      });
    });

    job.suggestedFollowUpQuestions.slice(0, 2).forEach((question, index) => {
      cards.push({
        category: "LEADER_CONFIRMATION",
        confidence: "MEDIUM",
        evidence: [`Job Profile: ${job.jobTitle}`, `Suggested follow-up: ${question}`],
        priority: "MEDIUM",
        priorityReason: "该问题来自已确认岗位理解，需要 Recruiter 向业务方确认。",
        quickStartHref: "/feishu/job-profile/new",
        reason: "岗位理解中存在建议追问业务方的问题。",
        recommendedNextAction: "在下一次业务方沟通中确认该问题。",
        relatedJob: job.jobTitle,
        relatedWorkflow: job.workflowId,
        sourceKey: `job:${job.id}:leader:${index}:${hashText(question)}`,
        sourceType: "JOB_UNDERSTANDING",
        status: "TODO",
        title: `确认业务方问题：${job.jobTitle}`
      });
    });

    return cards;
  });
}

function createCandidateActionCards(
  insights: CandidateInsight[],
  jobMap: Map<string, JobProfile>,
  workflowByCandidate: Map<string, RecruitTogetherWorkflow>
): NextBestActionCard[] {
  return insights.flatMap((insight) => {
    const job = jobMap.get(insight.jobProfileId);
    const workflow = workflowByCandidate.get(insight.id);
    const candidateName = readCandidateOverview(insight.summary);
    const cards: NextBestActionCard[] = [];

    if (!workflow && insight.suggestedPhoneScreenQuestions.length > 0) {
      cards.push({
        category: "PHONE_SCREEN",
        confidence: insight.evidence ? "HIGH" : "MEDIUM",
        evidence: [
          `Candidate Insight: ${candidateName}`,
          `Phone screen questions: ${insight.suggestedPhoneScreenQuestions.slice(0, 2).join(" / ")}`
        ],
        priority: insight.potentialRisks.length > 0 || insight.missingInformation.length > 0 ? "HIGH" : "MEDIUM",
        priorityReason:
          insight.potentialRisks.length > 0
            ? "候选人洞察存在风险，需要先通过电话初筛核实。"
            : "候选人洞察已确认，但还没有 Recruit Together 记录。",
        quickStartHref: "/feishu/recruit-together",
        reason: "Reviewed Candidate Insight 输出建议进行电话初筛。",
        recommendedNextAction: "打开 Recruit Together，生成电话初筛准备并记录电话笔记。",
        relatedCandidate: candidateName,
        relatedJob: job?.jobTitle,
        relatedWorkflow: insight.workflowId,
        sourceKey: `candidate:${insight.id}:phone-screen`,
        sourceType: "CANDIDATE_UNDERSTANDING",
        status: "TODO",
        title: `电话初筛：${candidateName}`
      });
    }

    insight.missingInformation.slice(0, 3).forEach((missingItem, index) => {
      cards.push({
        category: "MISSING_INFORMATION",
        confidence: "HIGH",
        evidence: [`Candidate Insight: ${candidateName}`, `Missing information: ${missingItem}`],
        priority: index === 0 ? "HIGH" : "MEDIUM",
        priorityReason: "候选人关键信息缺失，后续沟通前需要人工核实。",
        quickStartHref: "/feishu/recruit-together",
        reason: "Reviewed Candidate Insight 显示候选人信息不完整。",
        recommendedNextAction: "在电话或后续沟通中核实该信息。",
        relatedCandidate: candidateName,
        relatedJob: job?.jobTitle,
        relatedWorkflow: insight.workflowId,
        sourceKey: `candidate:${insight.id}:missing:${index}:${hashText(missingItem)}`,
        sourceType: "CANDIDATE_UNDERSTANDING",
        status: "TODO",
        title: `补充候选人信息：${candidateName}`
      });
    });

    return cards;
  });
}

function createRecruitTogetherActionCards(
  workflows: RecruitTogetherWorkflow[],
  insights: CandidateInsight[],
  jobMap: Map<string, JobProfile>
): NextBestActionCard[] {
  const insightMap = new Map(insights.map((insight) => [insight.id, insight]));

  return workflows.flatMap((workflow) => {
    const insight = insightMap.get(workflow.candidateInsightId);
    const job = jobMap.get(workflow.jobProfileId);
    const candidateName = insight ? readCandidateOverview(insight.summary) : "Candidate";
    const cards: NextBestActionCard[] = [];

    if (hasJsonContent(workflow.phoneNotes) && !hasJsonContent(workflow.interviewNotes)) {
      cards.push({
        category: "INTERVIEW_PREPARATION",
        confidence: "HIGH",
        evidence: [`Recruit Together: ${workflow.workflowId}`, "Phone notes exist, interview notes are empty."],
        priority: "HIGH",
        priorityReason: "电话初筛已记录，但面试准备尚未完成。",
        quickStartHref: "/feishu/recruit-together",
        reason: "Recruit Together 流程显示候选人已完成电话沟通，需要准备下一步面试。",
        recommendedNextAction: "生成面试准备，核实关键证据和开放问题。",
        relatedCandidate: candidateName,
        relatedJob: job?.jobTitle,
        relatedWorkflow: workflow.workflowId,
        sourceKey: `recruit-together:${workflow.id}:interview-prep`,
        sourceType: "RECRUIT_TOGETHER",
        status: "TODO",
        title: `准备面试：${candidateName}`
      });
    }

    readStringArrayFromJson(workflow.recruiterSummary, "openQuestions")
      .slice(0, 3)
      .forEach((question, index) => {
        cards.push({
          category: "FOLLOW_UP",
          confidence: "MEDIUM",
          evidence: [`Recruiter Summary: ${workflow.workflowId}`, `Open question: ${question}`],
          priority: "MEDIUM",
          priorityReason: "Recruiter Summary 中仍有开放问题，需要人工跟进。",
          quickStartHref: "/feishu/recruit-together",
          reason: "Recruit Together 总结里存在未关闭的问题。",
          recommendedNextAction: "联系候选人或业务方补充该问题的事实。",
          relatedCandidate: candidateName,
          relatedJob: job?.jobTitle,
          relatedWorkflow: workflow.workflowId,
          sourceKey: `recruit-together:${workflow.id}:open:${index}:${hashText(question)}`,
          sourceType: "RECRUIT_TOGETHER",
          status: "TODO",
          title: `跟进开放问题：${candidateName}`
        });
      });

    return cards;
  });
}

function createDailyWorkspaceActionCards(workspaces: DailyRecruitingWorkspace[]): NextBestActionCard[] {
  return workspaces.flatMap((workspace) => {
    const priorities = readStringArrayFromJson(workspace.tomorrowPriorities, "highPriorityTasks");
    const candidates = readStringArrayFromJson(workspace.tomorrowPriorities, "candidatesToContact");
    const waiting = readStringArrayFromJson(workspace.tomorrowPriorities, "candidatesWaitingFollowUp");

    return [
      ...priorities.slice(0, 5).map((priority, index) => ({
        category: "RECRUITER_REMINDER" as const,
        confidence: "MEDIUM" as const,
        dueTime: addDays(workspace.date, 1),
        evidence: [`Daily Workspace: ${workspace.workflowId}`, `High priority task: ${priority}`],
        priority: index === 0 ? ("HIGH" as const) : ("MEDIUM" as const),
        priorityReason: "该动作来自已保存 Daily Workspace 的明日高优先级事项。",
        quickStartHref: "/feishu/daily-workspace",
        reason: "Daily Workspace 输出了需要 Recruiter 明日处理的事项。",
        recommendedNextAction: "检查上下文后手动执行该动作。",
        relatedWorkflow: workspace.workflowId,
        sourceKey: `daily:${workspace.id}:priority:${index}:${hashText(priority)}`,
        sourceType: "DAILY_WORKSPACE" as const,
        status: "TODO" as const,
        title: priority
      })),
      ...candidates.slice(0, 5).map((candidate, index) => ({
        category: "FOLLOW_UP" as const,
        confidence: "HIGH" as const,
        dueTime: addDays(workspace.date, 1),
        evidence: [`Daily Workspace: ${workspace.workflowId}`, `Candidate to contact: ${candidate}`],
        priority: "HIGH" as const,
        priorityReason: "Daily Workspace 明确标记该候选人需要联系。",
        quickStartHref: "/feishu/recruit-together",
        reason: "明日优先级中包含需联系候选人。",
        recommendedNextAction: "打开相关候选人上下文并手动联系。",
        relatedCandidate: candidate,
        relatedWorkflow: workspace.workflowId,
        sourceKey: `daily:${workspace.id}:contact:${index}:${hashText(candidate)}`,
        sourceType: "DAILY_WORKSPACE" as const,
        status: "TODO" as const,
        title: `联系候选人：${candidate}`
      })),
      ...waiting.slice(0, 5).map((candidate, index) => ({
        category: "FOLLOW_UP" as const,
        confidence: "MEDIUM" as const,
        dueTime: addDays(workspace.date, 1),
        evidence: [`Daily Workspace: ${workspace.workflowId}`, `Waiting follow-up: ${candidate}`],
        priority: "MEDIUM" as const,
        priorityReason: "该候选人处于待跟进状态，需要 Recruiter 人工确认下一步。",
        quickStartHref: "/feishu/recruit-together",
        reason: "Daily Workspace 输出了待跟进候选人。",
        recommendedNextAction: "检查最近沟通记录，并决定是否跟进。",
        relatedCandidate: candidate,
        relatedWorkflow: workspace.workflowId,
        sourceKey: `daily:${workspace.id}:waiting:${index}:${hashText(candidate)}`,
        sourceType: "DAILY_WORKSPACE" as const,
        status: "TODO" as const,
        title: `候选人待跟进：${candidate}`
      }))
    ];
  });
}

function createRecruiterNoteActionCards(notes: RecruiterWorkspaceNoteRecord[]): NextBestActionCard[] {
  return notes.slice(0, 50).map((note) => {
    const urgent = note.content.includes("紧急") || note.content.toLowerCase().includes("urgent");

    return {
      category: "RECRUITER_REMINDER",
      confidence: "LOW",
      dueTime: note.date,
      evidence: [`Recruiter Note: ${note.content.slice(0, 120)}`],
      priority: urgent ? "HIGH" : "LOW",
      priorityReason: "该动作来自 Recruiter 手工备注，需要人工决定是否执行。",
      quickStartHref: "/feishu",
      reason: "Recruiter Notes 中记录了可能需要后续动作的事项。",
      recommendedNextAction: "查看备注上下文，手动决定是否转为具体招聘动作。",
      sourceKey: `note:${note.id}`,
      sourceType: "RECRUITER_NOTE",
      status: "TODO",
      title: note.category
        ? `${note.category}：${note.content.slice(0, 60)}`
        : `Reminder：${note.content.slice(0, 60)}`
    };
  });
}

function createScheduleActionCards(scheduleItems: RecruiterWorkspaceScheduleRecord[]): NextBestActionCard[] {
  return scheduleItems
    .filter((item) => !item.completed)
    .map((item) => ({
      category: mapScheduleTypeToCategory(item.itemType),
      confidence: "MEDIUM",
      evidence: [`Schedule item: ${item.title}`, item.startTime ? `Start time: ${item.startTime}` : "No start time"],
      priority: item.startTime ? "MEDIUM" : "LOW",
      priorityReason: "该动作来自 Recruiter 手动日程，未完成前应保留提醒。",
      quickStartHref: "/feishu",
      reason: "今日工作台中存在未完成日程项。",
      recommendedNextAction: "检查该日程项，并手动完成或调整。",
      relatedCandidate: item.relatedName ?? undefined,
      sourceKey: `schedule:${item.id}`,
      sourceType: "RECRUITER_NOTE",
      status: "TODO",
      title: `处理日程：${item.title}`
    }));
}

function mapScheduleTypeToCategory(itemType: string): NextBestActionCard["category"] {
  if (itemType === "PHONE_SCREEN") {
    return "PHONE_SCREEN";
  }

  if (itemType === "INTERVIEW") {
    return "INTERVIEW_PREPARATION";
  }

  if (itemType === "LEADER_MEETING") {
    return "LEADER_CONFIRMATION";
  }

  return "RECRUITER_REMINDER";
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

function readStringArrayFromJson(value: unknown, field: string): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }

  const candidate = value as Record<string, unknown>;
  const fieldValue = candidate[field];

  if (!Array.isArray(fieldValue)) {
    return [];
  }

  return fieldValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function hasJsonContent(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return JSON.stringify(value).replace(/[{}\[\]",:\s]/g, "").length > 0;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function hashText(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
}
