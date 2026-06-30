import { prisma } from "@/lib/prisma";
import type {
  SpreadsheetAnalysis,
  SpreadsheetAnalysisRepositoryCreateInput
} from "@/types/spreadsheet";

export const spreadsheetAnalysisRepository = {
  async create(data: SpreadsheetAnalysisRepositoryCreateInput): Promise<SpreadsheetAnalysis> {
    return prisma.spreadsheetAnalysis.create({
      data
    });
  },

  async findByUploadId(uploadId: string): Promise<SpreadsheetAnalysis | null> {
    return prisma.spreadsheetAnalysis.findUnique({
      where: {
        uploadId
      }
    });
  }
};

