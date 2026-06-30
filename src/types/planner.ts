import type { PlanPriority, Prisma } from "@prisma/client";
import type { RecruitLogDateInput } from "@/types/log";

export type PlanScheduleTime = "morning" | "afternoon" | "evening";
export type PlanPriorityValue = "LOW" | "MEDIUM" | "HIGH";

export type PlanScheduleItem = {
  time: PlanScheduleTime;
  content: string;
  priority: PlanPriorityValue;
};

export type DailyPlan = {
  id: string;
  date: Date;
  logId: string | null;
  reviewId: string | null;
  schedule: Prisma.JsonValue;
  priorityTasks: Prisma.JsonValue;
  goals: Prisma.JsonValue;
  risks: Prisma.JsonValue;
  expectedOutcomes: Prisma.JsonValue;
  priority: PlanPriority;
  provider: string;
  model: string;
  promptFile: string;
  promptVersion: string;
  inputHash: string;
  rawOutput: Prisma.JsonValue;
  parsedOutput: Prisma.JsonValue;
  createdAt: Date;
};

export type DailyPlanDto = Omit<DailyPlan, "date" | "createdAt"> & {
  date: string;
  createdAt: string;
};

export type PlannerAiOutput = {
  date: string;
  schedule: PlanScheduleItem[];
  priorityTasks: string[];
  goals: string[];
  risks: string[];
  expectedOutcomes: string[];
  priority: PlanPriorityValue;
};

export type PlannerGenerateInput = {
  date: RecruitLogDateInput;
};

export type PlannerGeneratePayload = {
  date: string;
};

export type DailyPlanRepositoryCreateInput = {
  date: Date;
  logId?: string;
  reviewId?: string;
  schedule: Prisma.InputJsonValue;
  priorityTasks: Prisma.InputJsonValue;
  goals: Prisma.InputJsonValue;
  risks: Prisma.InputJsonValue;
  expectedOutcomes: Prisma.InputJsonValue;
  priority: PlanPriority;
  provider: string;
  model: string;
  promptFile: string;
  promptVersion: string;
  inputHash: string;
  rawOutput: Prisma.InputJsonValue;
  parsedOutput: Prisma.InputJsonValue;
};

export type PlannerPlanView = {
  id: string;
  dateLabel: string;
  generatedAtLabel: string;
  priority: PlanPriorityValue;
  priorityTone: "neutral" | "success" | "warning" | "danger";
  modelLabel: string;
  schedule: PlanScheduleItem[];
  priorityTasks: string[];
  goals: string[];
  risks: string[];
  expectedOutcomes: string[];
};
