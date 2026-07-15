import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type {
  CreateResumeEvaluationRunInput,
  ResumeEvaluationRunSafeRecord
} from "@/types/resumeEvaluationRun";

const runSafeSelect = {
  completedAt: true,
  createdAt: true,
  errorCode: true,
  errorMessage: true,
  evaluationId: true,
  id: true,
  modelName: true,
  modelProvider: true,
  parsedOutputJson: true,
  parsedSnapshotId: true,
  promptVersion: true,
  rating: true,
  resumeRevisionId: true,
  runType: true,
  score: true,
  status: true,
  summary: true
} satisfies Prisma.ResumeEvaluationRunSelect;

const runSelectionSelect = {
  evaluationId: true,
  id: true,
  jobProfileId: true,
  jobProfileVersion: true,
  resumeId: true,
  status: true,
  templateVersionId: true
} satisfies Prisma.ResumeEvaluationRunSelect;

export type ResumeEvaluationRunSelectionRecord =
  Prisma.ResumeEvaluationRunGetPayload<{
    select: typeof runSelectionSelect;
  }>;

type ResumeEvaluationRunCompleteInput = {
  completedAt: Date;
  evidenceJson?: Prisma.InputJsonValue | null;
  interviewQuestionsJson?: Prisma.InputJsonValue | null;
  latencyMs?: number | null;
  modelName?: string | null;
  modelProvider?: string | null;
  parsedOutputJson?: Prisma.InputJsonValue | null;
  phoneScreenQuestionsJson?: Prisma.InputJsonValue | null;
  promptVersion?: string | null;
  rating?: string | null;
  riskFlagsJson?: Prisma.InputJsonValue | null;
  score?: number | null;
  strengthsJson?: Prisma.InputJsonValue | null;
  summary?: string | null;
  weaknessesJson?: Prisma.InputJsonValue | null;
};

type ResumeEvaluationRunFailInput = {
  completedAt: Date;
  errorCode: string | null;
  errorMessage: string;
  latencyMs?: number | null;
  modelName?: string | null;
  modelProvider?: string | null;
  promptVersion?: string | null;
};

export const resumeEvaluationRunRepository = {
  async createRun(
    input: CreateResumeEvaluationRunInput,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord> {
    return client.resumeEvaluationRun.create({
      data: {
        completedAt: input.completedAt ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        evaluationId: input.evaluationId,
        evidenceJson: toNullableJson(input.evidenceJson),
        inputHash: input.inputHash ?? null,
        interviewQuestionsJson: toNullableJson(input.interviewQuestionsJson),
        jobProfileId: input.jobProfileId,
        jobProfileVersion: input.jobProfileVersion,
        latencyMs: input.latencyMs ?? null,
        modelName: input.modelName ?? null,
        modelProvider: input.modelProvider ?? null,
        outputHash: input.outputHash ?? null,
        parsedOutputJson: toNullableJson(input.parsedOutputJson),
        parsedSnapshotId: input.parsedSnapshotId,
        phoneScreenQuestionsJson: toNullableJson(input.phoneScreenQuestionsJson),
        promptVersion: input.promptVersion ?? null,
        rating: input.rating ?? null,
        rawOutputJson: Prisma.DbNull,
        resumeId: input.resumeId,
        resumeRevisionId: input.resumeRevisionId,
        riskFlagsJson: toNullableJson(input.riskFlagsJson),
        runType: input.runType,
        score: input.score ?? null,
        status: input.status,
        strengthsJson: toNullableJson(input.strengthsJson),
        summary: input.summary ?? null,
        templateVersionId: input.templateVersionId,
        weaknessesJson: toNullableJson(input.weaknessesJson)
      },
      select: runSafeSelect
    });
  },

  async findRunById(
    id: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord | null> {
    return client.resumeEvaluationRun.findUnique({
      select: runSafeSelect,
      where: { id }
    });
  },

  async findRunForSelection(
    runId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSelectionRecord | null> {
    return client.resumeEvaluationRun.findUnique({
      select: runSelectionSelect,
      where: { id: runId }
    });
  },

  async completeRun(
    runId: string,
    input: ResumeEvaluationRunCompleteInput,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord> {
    return client.resumeEvaluationRun.update({
      data: {
        completedAt: input.completedAt,
        errorCode: null,
        errorMessage: null,
        evidenceJson: toNullableJson(input.evidenceJson),
        interviewQuestionsJson: toNullableJson(input.interviewQuestionsJson),
        latencyMs: input.latencyMs ?? null,
        modelName: input.modelName ?? null,
        modelProvider: input.modelProvider ?? null,
        parsedOutputJson: toNullableJson(input.parsedOutputJson),
        phoneScreenQuestionsJson: toNullableJson(input.phoneScreenQuestionsJson),
        promptVersion: input.promptVersion ?? null,
        rating: input.rating ?? null,
        riskFlagsJson: toNullableJson(input.riskFlagsJson),
        score: input.score ?? null,
        status: "SUCCEEDED",
        strengthsJson: toNullableJson(input.strengthsJson),
        summary: input.summary ?? null,
        weaknessesJson: toNullableJson(input.weaknessesJson)
      },
      select: runSafeSelect,
      where: { id: runId }
    });
  },

  async failRun(
    runId: string,
    input: ResumeEvaluationRunFailInput,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord> {
    return client.resumeEvaluationRun.update({
      data: {
        completedAt: input.completedAt,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        latencyMs: input.latencyMs ?? null,
        modelName: input.modelName ?? null,
        modelProvider: input.modelProvider ?? null,
        parsedOutputJson: Prisma.DbNull,
        promptVersion: input.promptVersion ?? null,
        status: "FAILED"
      },
      select: runSafeSelect,
      where: { id: runId }
    });
  },

  async listRunsByEvaluationId(
    evaluationId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord[]> {
    return client.resumeEvaluationRun.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: runSafeSelect,
      where: { evaluationId }
    });
  },

  async findLatestSuccessfulRun(
    evaluationId: string,
    client: CandidateDbClient = prisma
  ): Promise<ResumeEvaluationRunSafeRecord | null> {
    return client.resumeEvaluationRun.findFirst({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: runSafeSelect,
      where: {
        evaluationId,
        status: "SUCCEEDED"
      }
    });
  }
};

function toNullableJson(
  value: Prisma.InputJsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value ?? Prisma.DbNull;
}
