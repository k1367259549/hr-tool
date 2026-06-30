import { z } from "zod";
import type { KnowledgeAiOutput } from "@/types/knowledge";

const knowledgeTypeSchema = z.enum(["EXPERIENCE", "TEMPLATE", "POSITION", "NOTE"]);

const knowledgeAiItemSchema = z
  .object({
    title: z.string().trim().min(1),
    content: z.string().trim().min(1),
    type: knowledgeTypeSchema,
    tags: z.array(z.string().trim().min(1))
  })
  .strict();

export const knowledgeAiOutputSchema = z
  .object({
    items: z.array(knowledgeAiItemSchema)
  })
  .strict();

export class KnowledgeSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeSchemaValidationError";
  }
}

export function validateKnowledgeAiOutput(output: unknown): KnowledgeAiOutput {
  const result = knowledgeAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new KnowledgeSchemaValidationError("AI knowledge output does not match schema.");
  }

  return result.data;
}
