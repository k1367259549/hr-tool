import { recruitmentTaskRepository } from "@/repositories/recruitmentTask.repository";
import { nextBestActionService } from "@/services/nextBestAction.service";
import type { NextBestActionCard } from "@/types/nextBestAction";
import type {
  RecruitmentTask,
  RecruitmentTaskActionInput,
  RecruitmentTaskAudit,
  RecruitmentTaskAuditDto,
  RecruitmentTaskCenterData,
  RecruitmentTaskCreateInput,
  RecruitmentTaskDto,
  RecruitmentTaskPriority,
  RecruitmentTaskStatus,
  RecruitmentTaskUpdateInput
} from "@/types/recruitmentTask";

export class RecruitmentTaskServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND", message: string) {
    super(message);
    this.name = "RecruitmentTaskServiceError";
    this.code = code;
  }
}

export const recruitmentTaskService = {
  async getTaskCenter(): Promise<RecruitmentTaskCenterData> {
    await syncGeneratedTasks();
    const tasks = await recruitmentTaskRepository.findMany();
    const taskDtos = tasks.map(toTaskDto);

    return {
      counts: createCounts(taskDtos),
      generatedAt: new Date().toISOString(),
      quickStarts: [
        {
          description: "创建或更新岗位理解。",
          href: "/feishu/job-profile/new",
          title: "Job Understanding"
        },
        {
          description: "上传简历并生成候选人理解。",
          href: "/feishu/candidate-understanding/new",
          title: "Candidate Understanding"
        },
        {
          description: "准备电话初筛、面试和招聘协作总结。",
          href: "/feishu/recruit-together",
          title: "Recruit Together"
        },
        {
          description: "生成每日招聘总结与明日优先级。",
          href: "/feishu/daily-workspace",
          title: "Daily Workspace"
        }
      ],
      tasks: taskDtos
    };
  },

  async applyTaskAction(input: RecruitmentTaskActionInput): Promise<RecruitmentTaskDto> {
    const existingTask = await recruitmentTaskRepository.findById(input.taskId);

    if (!existingTask) {
      throw new RecruitmentTaskServiceError("NOT_FOUND", "任务不存在。");
    }

    const patch = createActionPatch(existingTask, input);

    try {
      const updatedTask = await recruitmentTaskRepository.updateWithAudit({
        action: input.action,
        actor: "RECRUITER",
        id: input.taskId,
        note: input.note,
        patch
      });

      return toTaskDto(updatedTask);
    } catch (error) {
      if (error instanceof RecruitmentTaskServiceError) {
        throw error;
      }

      throw new RecruitmentTaskServiceError("DATABASE_ERROR", "更新招聘任务失败。");
    }
  },

  async getTaskAudits(taskId: string): Promise<RecruitmentTaskAuditDto[]> {
    const task = await recruitmentTaskRepository.findById(taskId);

    if (!task) {
      throw new RecruitmentTaskServiceError("NOT_FOUND", "任务不存在。");
    }

    const audits = await recruitmentTaskRepository.findAudits(taskId);

    return audits.map(toAuditDto);
  }
};

async function syncGeneratedTasks(): Promise<void> {
  const result = await nextBestActionService.getActionCards();
  const tasks = result.actionCards.map(toTaskCreateInput);

  await recruitmentTaskRepository.createGeneratedTasksIfMissing(tasks);
}

function toTaskCreateInput(card: NextBestActionCard): RecruitmentTaskCreateInput {
  return {
    category: card.category,
    confidence: card.confidence,
    dueTime: card.dueTime,
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
    title: card.title
  };
}

function createActionPatch(
  task: RecruitmentTask,
  input: RecruitmentTaskActionInput
): RecruitmentTaskUpdateInput {
  const reviewedPatch: RecruitmentTaskUpdateInput = {
    reviewedByRecruiter: true
  };

  if (input.action === "ACCEPT") {
    return {
      ...reviewedPatch,
      status: "TODO"
    };
  }

  if (input.action === "START") {
    return {
      ...reviewedPatch,
      status: "IN_PROGRESS"
    };
  }

  if (input.action === "COMPLETE") {
    return {
      ...reviewedPatch,
      status: "COMPLETED"
    };
  }

  if (input.action === "DISMISS") {
    return {
      ...reviewedPatch,
      status: "CANCELLED"
    };
  }

  if (input.action === "DEFER") {
    return {
      ...reviewedPatch,
      status: "DEFERRED"
    };
  }

  if (input.action === "RESCHEDULE") {
    return {
      ...reviewedPatch,
      dueTime: input.patch?.dueTime ?? task.dueTime,
      status: "DEFERRED"
    };
  }

  return {
    ...reviewedPatch,
    ...input.patch
  };
}

function createCounts(tasks: RecruitmentTaskDto[]): RecruitmentTaskCenterData["counts"] {
  return {
    cancelled: tasks.filter((task) => task.status === "CANCELLED").length,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    deferred: tasks.filter((task) => task.status === "DEFERRED").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    todo: tasks.filter((task) => task.status === "TODO").length,
    total: tasks.length
  };
}

function toTaskDto(task: RecruitmentTask): RecruitmentTaskDto {
  return {
    ...task,
    category: task.category as RecruitmentTaskDto["category"],
    confidence: task.confidence as RecruitmentTaskDto["confidence"],
    createdAt: task.createdAt.toISOString(),
    dueTime: task.dueTime?.toISOString() ?? null,
    priority: task.priority as RecruitmentTaskPriority,
    sourceType: task.sourceType as RecruitmentTaskDto["sourceType"],
    status: task.status as RecruitmentTaskStatus,
    updatedAt: task.updatedAt.toISOString()
  };
}

function toAuditDto(audit: RecruitmentTaskAudit): RecruitmentTaskAuditDto {
  return {
    ...audit,
    afterValue: audit.afterValue,
    beforeValue: audit.beforeValue,
    createdAt: audit.createdAt.toISOString()
  };
}
