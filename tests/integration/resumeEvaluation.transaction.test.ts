import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type ResumeEvaluationService =
  (typeof import("@/services/resumeEvaluationResult.service"))["resumeEvaluationResultService"];

const runIntegration =
  process.env.RUN_PRISMA_INTEGRATION_TESTS === "true" &&
  isAllowedLocalDatabaseUrl(process.env.DATABASE_URL);

if (runIntegration) {
  describe("ResumeEvaluationResult transaction integration", () => {
    let prisma: PrismaClient;
    let service: ResumeEvaluationService;
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const jobProfileId = `it-eval-res-job-${suffix}`;
    const templateId = `it-eval-res-tmpl-${suffix}`;
    const evaluationIds: string[] = [];
    let templateVersionId: string;
    let resumeId: string;
    let duplicateResumeId: string;
    let staleResumeId: string;

    beforeAll(async () => {
      const prismaModule = await import("@prisma/client");
      const serviceModule = await import("@/services/resumeEvaluationResult.service");

      prisma = new prismaModule.PrismaClient();
      service = serviceModule.resumeEvaluationResultService;

      await prisma.$connect();

      const jobProfile = await prisma.jobProfile.create({
        data: {
          aiModel: "test-model",
          aiProvider: "test",
          coreResponsibilities: [],
          hiringFocus: [],
          id: jobProfileId,
          interviewFocus: [],
          jd: "Test JD",
          jobSummary: "Test summary",
          jobTitle: `Integration Test Job ${suffix}`,
          missingInformation: [],
          potentialRisks: [],
          preferredCompetencies: [],
          promptFile: "test.md",
          promptVersion: "1",
          requiredCompetencies: [],
          reviewedAt: new Date(),
          suggestedFollowUpQuestions: [],
          workflowId: `wf-${suffix}`
        }
      });

      const template = await prisma.evaluationTemplate.create({
        data: {
          id: templateId,
          name: `Integration Eval Template ${suffix}`
        }
      });

      const version = await prisma.evaluationTemplateVersion.create({
        data: {
          criteria: [
            {
              description: "Backend API evidence",
              importance: "REQUIRED",
              key: "backend-api",
              label: "Backend API"
            }
          ],
          publishedAt: new Date(),
          status: "PUBLISHED",
          templateId: template.id,
          versionNumber: 1
        }
      });

      templateVersionId = version.id;

      await prisma.jobProfileEvaluationAssignment.create({
        data: {
          jobProfileId: jobProfile.id,
          templateVersionId: version.id
        }
      });

      const resume = await prisma.candidateResume.create({
        data: {
          fileSize: 1024,
          fileType: "pdf",
          fileName: `integration-test-${suffix}.pdf`,
          intakeSource: "RESUME_LIBRARY",
          originalFile: Buffer.from("test"),
          parsingStatus: "PARSED",
          resumeVersion: "1",
          semanticChunks: [],
          structureChunks: [],
          workflowId: `wf-resume-${suffix}`
        }
      });

      resumeId = resume.id;

      const duplicateResume = await prisma.candidateResume.create({
        data: {
          fileSize: 1024,
          fileType: "pdf",
          fileName: `integration-duplicate-${suffix}.pdf`,
          intakeSource: "RESUME_LIBRARY",
          originalFile: Buffer.from("duplicate"),
          parsingStatus: "PARSED",
          resumeVersion: "1",
          semanticChunks: [],
          structureChunks: [],
          workflowId: `wf-duplicate-resume-${suffix}`
        }
      });

      duplicateResumeId = duplicateResume.id;

      const staleResume = await prisma.candidateResume.create({
        data: {
          fileSize: 1024,
          fileType: "pdf",
          fileName: `integration-stale-${suffix}.pdf`,
          intakeSource: "RESUME_LIBRARY",
          originalFile: Buffer.from("stale"),
          parsingStatus: "PARSED",
          resumeVersion: "1",
          semanticChunks: [],
          structureChunks: [],
          workflowId: `wf-stale-resume-${suffix}`
        }
      });

      staleResumeId = staleResume.id;
    });

    afterAll(async () => {
      await prisma.resumeEvaluationEvent.deleteMany({
        where: { evaluation: { id: { in: evaluationIds } } }
      });
      await prisma.resumeEvaluationResult.deleteMany({
        where: { id: { in: evaluationIds } }
      });
      await prisma.jobProfileEvaluationAssignment.deleteMany({
        where: { jobProfileId }
      });
      await prisma.evaluationTemplateVersion.deleteMany({
        where: { templateId }
      });
      await prisma.evaluationTemplate.deleteMany({
        where: { id: templateId }
      });
      const resumeIds = [resumeId, duplicateResumeId, staleResumeId].filter((id): id is string =>
        Boolean(id)
      );

      await prisma.candidateResume.deleteMany({
        where: { id: { in: resumeIds } }
      });
      await prisma.jobProfile.deleteMany({
        where: { id: jobProfileId }
      });
      await prisma.$disconnect();
    });

    it("creates evaluation atomically with CREATED event", async () => {
      const evaluation = await service.createEvaluation({
        evaluatedBy: "招聘官 A",
        jobProfileId,
        resumeId,
        templateVersionId
      });

      evaluationIds.push(evaluation.id);

      const stored = await prisma.resumeEvaluationResult.findUniqueOrThrow({
        where: { id: evaluation.id }
      });

      expect(stored.status).toBe("DRAFT");
      expect(stored.revision).toBe(0);
      expect(stored.criterionResults).toEqual([
        {
          assessment: "NOT_ASSESSED",
          criterionKey: "backend-api",
          evidenceNotes: []
        }
      ]);

      const events = await prisma.resumeEvaluationEvent.findMany({
        where: { evaluationId: evaluation.id }
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.eventType).toBe("CREATED");
    });

    it("rejects concurrent duplicate context key with one 409 and one stored event", async () => {
      const results = await Promise.allSettled([
        service.createEvaluation({
          jobProfileId,
          resumeId: duplicateResumeId,
          templateVersionId
        }),
        service.createEvaluation({
          jobProfileId,
          resumeId: duplicateResumeId,
          templateVersionId
        })
      ]);

      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
        code: "CONFLICT"
      });

      const createdEvaluation = (fulfilled[0] as PromiseFulfilledResult<{ id: string }>).value;
      evaluationIds.push(createdEvaluation.id);

      const stored = await prisma.resumeEvaluationResult.findMany({
        where: {
          jobProfileId,
          resumeId: duplicateResumeId,
          templateVersionId
        }
      });

      expect(stored).toHaveLength(1);

      const events = await prisma.resumeEvaluationEvent.findMany({
        where: {
          evaluationId: stored[0]!.id,
          eventType: "CREATED"
        }
      });

      expect(events).toHaveLength(1);
    });

    it("updates draft and increments revision", async () => {
      const id = evaluationIds[0]!;

      const updated = await service.updateDraftEvaluation(id, {
        criterionResults: [
          {
            assessment: "SUPPORTED",
            criterionKey: "backend-api",
            evidenceNotes: ["有后端经验"]
          }
        ],
        expectedRevision: 0,
        overallNote: "整体评估摘要"
      });

      expect(updated.revision).toBe(1);
      expect(updated.criterionResults).toHaveLength(1);
    });

    it("rejects update with stale revision", async () => {
      const id = evaluationIds[0]!;

      await expect(
        service.updateDraftEvaluation(id, {
          expectedRevision: 0,
          overallNote: "stale update"
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("marks evaluation as REVIEWED", async () => {
      const id = evaluationIds[0]!;

      const reviewed = await service.reviewEvaluation(id, {
        actor: "招聘官 A",
        expectedRevision: 1
      });

      expect(reviewed.status).toBe("REVIEWED");
      expect(reviewed.reviewedAt).not.toBeNull();
    });

    it("reopens REVIEWED evaluation to DRAFT", async () => {
      const id = evaluationIds[0]!;
      const current = await prisma.resumeEvaluationResult.findUniqueOrThrow({
        select: {
          revision: true
        },
        where: {
          id
        }
      });

      const reopened = await service.reopenEvaluation(id, {
        actor: "招聘官 A",
        expectedRevision: current.revision,
        note: "重新开放"
      });

      expect(reopened.status).toBe("DRAFT");
      expect(reopened.reviewedAt).toBeNull();
    });

    it("rejects stale reopen after a complete reopen-edit-review cycle", async () => {
      const evaluation = await service.createEvaluation({
        jobProfileId,
        resumeId: staleResumeId,
        templateVersionId
      });

      evaluationIds.push(evaluation.id);

      const updated = await service.updateDraftEvaluation(evaluation.id, {
        criterionResults: [
          {
            assessment: "SUPPORTED",
            criterionKey: "backend-api",
            evidenceNotes: ["第一次评估证据"]
          }
        ],
        expectedRevision: evaluation.revision,
        overallNote: "第一次整体评估摘要"
      });

      const firstReviewed = await service.reviewEvaluation(evaluation.id, {
        actor: "招聘官 A",
        expectedRevision: updated.revision
      });
      const staleExpectedRevision = firstReviewed.revision;

      const reopened = await service.reopenEvaluation(evaluation.id, {
        actor: "招聘官 A",
        expectedRevision: staleExpectedRevision,
        note: "补充评估证据"
      });

      const edited = await service.updateDraftEvaluation(evaluation.id, {
        criterionResults: [
          {
            assessment: "PARTIALLY_SUPPORTED",
            criterionKey: "backend-api",
            evidenceNotes: ["第二次评估证据"]
          }
        ],
        expectedRevision: reopened.revision,
        overallNote: "第二次整体评估摘要"
      });

      const secondReviewed = await service.reviewEvaluation(evaluation.id, {
        actor: "招聘官 A",
        expectedRevision: edited.revision
      });

      await expect(
        service.reopenEvaluation(evaluation.id, {
          actor: "旧客户端",
          expectedRevision: staleExpectedRevision,
          note: "旧客户端重复重新开放"
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });

      const stored = await prisma.resumeEvaluationResult.findUniqueOrThrow({
        where: { id: evaluation.id }
      });

      expect(stored.status).toBe("REVIEWED");
      expect(stored.revision).toBe(secondReviewed.revision);
    });

    it("verifies partial unique index prevents duplicate context key at DB level", async () => {
      const currentEval = await prisma.resumeEvaluationResult.findFirst({
        where: { id: evaluationIds[0] }
      });

      expect(currentEval).not.toBeNull();

      await expect(
        prisma.resumeEvaluationResult.create({
          data: {
            criterionResults: [],
            jobProfileId,
            jobProfileVersion: currentEval!.jobProfileVersion,
            resumeId,
            revision: 0,
            status: "DRAFT",
            templateVersionId
          }
        })
      ).rejects.toThrow();
    });
  });
} else {
  describe.skip("ResumeEvaluationResult transaction integration", () => {
    it("requires RUN_PRISMA_INTEGRATION_TESTS=true and a local DATABASE_URL", () => {
      expect(runIntegration).toBe(false);
    });
  });
}

function isAllowedLocalDatabaseUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes("localhost") || url.includes("127.0.0.1") || url.includes("host.docker.internal")
  );
}
