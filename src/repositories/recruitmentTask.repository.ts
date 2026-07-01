import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  RecruitmentTask,
  RecruitmentTaskAudit,
  RecruitmentTaskCreateInput,
  RecruitmentTaskUpdateInput
} from "@/types/recruitmentTask";

export const recruitmentTaskRepository = {
  async createGeneratedTasksIfMissing(tasks: RecruitmentTaskCreateInput[]): Promise<RecruitmentTask[]> {
    const createdTasks: RecruitmentTask[] = [];

    for (const task of tasks) {
      const createdTask = await prisma.$transaction(async (tx) => {
        const existingTask = await tx.recruitmentTask.findUnique({
          where: {
            sourceKey: task.sourceKey
          }
        });

        if (existingTask) {
          return null;
        }

        const nextTask = await tx.recruitmentTask.create({
          data: {
            category: task.category,
            confidence: task.confidence ?? "MEDIUM",
            dueTime: task.dueTime,
            evidence: task.evidence,
            priority: task.priority,
            priorityReason: task.priorityReason,
            quickStartHref: task.quickStartHref,
            reason: task.reason,
            recommendedNextAction: task.recommendedNextAction,
            relatedCandidate: task.relatedCandidate,
            relatedJob: task.relatedJob,
            relatedWorkflow: task.relatedWorkflow,
            sourceKey: task.sourceKey,
            sourceType: task.sourceType,
            title: task.title
          }
        });

        await tx.recruitmentTaskAudit.create({
          data: {
            action: "TASK_CREATED",
            actor: "AI_RECRUITER",
            afterStatus: nextTask.status,
            afterValue: serializeTaskSnapshot(nextTask),
            taskId: nextTask.id
          }
        });

        return nextTask;
      });

      if (createdTask) {
        createdTasks.push(createdTask);
      }
    }

    return createdTasks;
  },

  async findMany(): Promise<RecruitmentTask[]> {
    return prisma.recruitmentTask.findMany({
      orderBy: [
        {
          status: "asc"
        },
        {
          dueTime: "asc"
        },
        {
          createdAt: "desc"
        }
      ]
    });
  },

  async findById(id: string): Promise<RecruitmentTask | null> {
    return prisma.recruitmentTask.findUnique({
      where: {
        id
      }
    });
  },

  async updateWithAudit({
    action,
    actor,
    id,
    note,
    patch
  }: {
    id: string;
    patch: RecruitmentTaskUpdateInput;
    action: string;
    actor: string;
    note?: string;
  }): Promise<RecruitmentTask> {
    return prisma.$transaction(async (tx) => {
      const existingTask = await tx.recruitmentTask.findUnique({
        where: {
          id
        }
      });

      if (!existingTask) {
        throw new Error("Recruitment task not found.");
      }

      const updatedTask = await tx.recruitmentTask.update({
        data: {
          dueTime: patch.dueTime,
          confidence: patch.confidence,
          evidence: patch.evidence,
          priority: patch.priority,
          priorityReason: patch.priorityReason,
          quickStartHref: patch.quickStartHref,
          reason: patch.reason,
          recommendedNextAction: patch.recommendedNextAction,
          relatedCandidate: patch.relatedCandidate,
          relatedJob: patch.relatedJob,
          reviewedByRecruiter: patch.reviewedByRecruiter,
          status: patch.status,
          title: patch.title
        },
        where: {
          id
        }
      });

      await tx.recruitmentTaskAudit.create({
        data: {
          action,
          actor,
          afterStatus: updatedTask.status,
          afterValue: serializeTaskSnapshot(updatedTask),
          beforeStatus: existingTask.status,
          beforeValue: serializeTaskSnapshot(existingTask),
          note,
          taskId: updatedTask.id
        }
      });

      return updatedTask;
    });
  },

  async findAudits(taskId: string): Promise<RecruitmentTaskAudit[]> {
    return prisma.recruitmentTaskAudit.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        taskId
      }
    });
  }
};

function serializeTaskSnapshot(task: RecruitmentTask): Prisma.InputJsonObject {
  return {
    category: task.category,
    confidence: task.confidence,
    dueTime: task.dueTime?.toISOString() ?? null,
    priority: task.priority,
    priorityReason: task.priorityReason,
    recommendedNextAction: task.recommendedNextAction,
    status: task.status,
    title: task.title
  };
}
