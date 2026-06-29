import { logRepository } from "@/repositories/log.repository";
import type {
  RecruitLog,
  RecruitLogCreateInput,
  RecruitLogDateInput,
  RecruitLogQueryOptions,
  RecruitLogUpdateInput
} from "@/types/log";
import {
  normalizeRecruitLogCreateInput,
  normalizeRecruitLogQueryOptions,
  normalizeRecruitLogUpdateInput,
  parseLogDate
} from "@/utils/logValidation";

export const logService = {
  async createLog(input: RecruitLogCreateInput): Promise<RecruitLog> {
    const data = normalizeRecruitLogCreateInput(input);
    return logRepository.create(data);
  },

  async getLogs(options: RecruitLogQueryOptions = {}): Promise<RecruitLog[]> {
    const repositoryOptions = normalizeRecruitLogQueryOptions(options);
    return logRepository.findMany(repositoryOptions);
  },

  async getLogById(id: string): Promise<RecruitLog | null> {
    return logRepository.findById(id);
  },

  async getLogByDate(dateInput: RecruitLogDateInput): Promise<RecruitLog | null> {
    const date = parseLogDate(dateInput);
    return logRepository.findByDate(date);
  },

  async updateLog(id: string, input: RecruitLogUpdateInput): Promise<RecruitLog> {
    const data = normalizeRecruitLogUpdateInput(input);
    return logRepository.update(id, data);
  },

  async deleteLog(id: string): Promise<RecruitLog> {
    return logRepository.delete(id);
  }
};
