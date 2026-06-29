import { z } from "zod";
import type { PlannerAiOutput } from "@/types/planner";

const planPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const planScheduleItemSchema = z
  .object({
    time: z.enum(["morning", "afternoon", "evening"]),
    content: z.string().min(1),
    priority: planPrioritySchema
  })
  .strict();

export const plannerAiOutputSchema = z
  .object({
    date: z.string().min(1),
    schedule: z.array(planScheduleItemSchema).min(1),
    priorityTasks: z.array(z.string().min(1)).min(1),
    goals: z.array(z.string().min(1)).min(1),
    risks: z.array(z.string().min(1)),
    expectedOutcomes: z.array(z.string().min(1)).min(1),
    priority: planPrioritySchema
  })
  .strict();

export class PlannerSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerSchemaValidationError";
  }
}

export function validatePlannerAiOutput(output: unknown): PlannerAiOutput {
  const result = plannerAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new PlannerSchemaValidationError("AI planner output does not match schema.");
  }

  return result.data;
}
