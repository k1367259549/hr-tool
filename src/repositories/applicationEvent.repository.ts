import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type { ApplicationEvent, ApplicationEventCreateInput } from "@/types/candidateApplication";

export const applicationEventRepository = {
  async create(
    input: ApplicationEventCreateInput,
    client: CandidateDbClient = prisma
  ): Promise<ApplicationEvent> {
    return client.applicationEvent.create({
      data: {
        actor: input.actor,
        applicationId: input.applicationId,
        eventType: input.eventType,
        fromStage: input.fromStage,
        note: input.note,
        toStage: input.toStage
      }
    });
  },

  async listEvents(applicationId: string, client: CandidateDbClient = prisma): Promise<ApplicationEvent[]> {
    return client.applicationEvent.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        applicationId
      }
    });
  }
};
