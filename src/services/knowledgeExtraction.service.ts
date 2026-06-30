import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateKnowledgeAiOutput } from "@/ai/schemas/knowledge.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { knowledgeRepository } from "@/repositories/knowledge.repository";
import { reviewRepository } from "@/repositories/review.repository";
import { logService } from "@/services/log.service";
import type { JsonObject, JsonValue } from "@/types/ai";
import type {
  Knowledge,
  KnowledgeAiItem,
  KnowledgeAiOutput,
  KnowledgeExtractInput,
  KnowledgeRepositoryCreateInput
} from "@/types/knowledge";
import type { RecruitLog } from "@/types/log";
import type { DailyReview } from "@/types/review";
import { parseLogDate } from "@/utils/logValidation";

const knowledgePromptFile = "knowledge.md";

export type KnowledgeExtractionServiceErrorCode =
  | "LOG_NOT_FOUND"
  | "AI_ERROR"
  | "VALIDATION_ERROR";

export class KnowledgeExtractionServiceError extends Error {
  readonly code: KnowledgeExtractionServiceErrorCode;

  constructor(code: KnowledgeExtractionServiceErrorCode, message: string) {
    super(message);
    this.name = "KnowledgeExtractionServiceError";
    this.code = code;
  }
}

export const knowledgeExtractionService = {
  async extractKnowledge(input: KnowledgeExtractInput): Promise<Knowledge[]> {
    const date = parseKnowledgeDate(input.date);
    const log = await logService.getLogByDate(date);

    if (!log) {
      throw new KnowledgeExtractionServiceError("LOG_NOT_FOUND", "Log not found.");
    }

    const review = await reviewRepository.findByLogId(log.id);
    const promptInput = createKnowledgePromptInput(log, review);
    const rawOutput = await generateKnowledgeOutput(promptInput);
    const knowledgeOutput = parseAndValidateKnowledgeOutput(rawOutput);

    return saveKnowledgeItems(rawOutput, knowledgeOutput, review);
  }
};

async function generateKnowledgeOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "knowledge_extraction",
      promptFile: knowledgePromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch {
    throw new KnowledgeExtractionServiceError(
      "AI_ERROR",
      "AI knowledge extraction failed."
    );
  }
}

function parseAndValidateKnowledgeOutput(rawOutput: string): KnowledgeAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateKnowledgeAiOutput(parsedJson);
  } catch {
    throw new KnowledgeExtractionServiceError(
      "AI_ERROR",
      "AI knowledge output is invalid."
    );
  }
}

function parseKnowledgeDate(value: KnowledgeExtractInput["date"]): Date {
  try {
    return parseLogDate(value);
  } catch {
    throw new KnowledgeExtractionServiceError(
      "VALIDATION_ERROR",
      "Date must be a valid date."
    );
  }
}

function createKnowledgePromptInput(log: RecruitLog, review: DailyReview | null): JsonObject {
  return {
    sourceLog: {
      id: log.id,
      date: log.date.toISOString(),
      position: log.position,
      source: log.source,
      channel: log.channel,
      roleType: log.roleType,
      priority: log.priority,
      resumeCount: log.resumeCount,
      screenCount: log.screenCount,
      phoneCount: log.phoneCount,
      interviewCount: log.interviewCount,
      offerCount: log.offerCount,
      entryCount: log.entryCount,
      summary: log.summary,
      problems: log.problems,
      reflection: log.reflection
    },
    sourceReview:
      review === null
        ? null
        : {
            id: review.id,
            summary: review.summary,
            strengths: normalizeJsonValue(review.strengths),
            weaknesses: normalizeJsonValue(review.weaknesses),
            suggestions: normalizeJsonValue(review.suggestions),
            score: review.score
          }
  };
}

async function saveKnowledgeItems(
  rawOutput: string,
  knowledgeOutput: KnowledgeAiOutput,
  review: DailyReview | null
): Promise<Knowledge[]> {
  const savedEntries: Knowledge[] = [];
  const seenTitles = new Set<string>();

  for (const item of knowledgeOutput.items) {
    if (seenTitles.has(item.title)) {
      continue;
    }

    seenTitles.add(item.title);

    const existingEntry = await knowledgeRepository.findByTitle(item.title);

    if (existingEntry) {
      continue;
    }

    savedEntries.push(
      await knowledgeRepository.create(
        createRepositoryInput(item, rawOutput, knowledgeOutput, review)
      )
    );
  }

  return savedEntries;
}

function createRepositoryInput(
  item: KnowledgeAiItem,
  rawOutput: string,
  knowledgeOutput: KnowledgeAiOutput,
  review: DailyReview | null
): KnowledgeRepositoryCreateInput {
  return {
    title: item.title,
    content: item.content,
    type: item.type,
    source: "AI",
    tags: item.tags,
    sourceReviewId: review?.id,
    rawOutput,
    parsedOutput: knowledgeOutput
  };
}

function normalizeJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}
