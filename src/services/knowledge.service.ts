import { knowledgeRepository } from "@/repositories/knowledge.repository";
import type {
  Knowledge,
  KnowledgeCreateInput,
  KnowledgeQueryOptions,
  KnowledgeUpdateInput
} from "@/types/knowledge";

export const knowledgeService = {
  async createKnowledge(input: KnowledgeCreateInput): Promise<Knowledge> {
    return knowledgeRepository.create(input);
  },

  async getKnowledgeList(options: KnowledgeQueryOptions = {}): Promise<Knowledge[]> {
    return knowledgeRepository.findMany(options);
  },

  async getKnowledgeById(id: string): Promise<Knowledge | null> {
    return knowledgeRepository.findById(id);
  },

  async updateKnowledge(id: string, input: KnowledgeUpdateInput): Promise<Knowledge> {
    return knowledgeRepository.update(id, input);
  },

  async deleteKnowledge(id: string): Promise<Knowledge> {
    return knowledgeRepository.delete(id);
  }
};
