import { prisma } from "@/lib/prisma";
import type {
  UploadedSpreadsheet,
  UploadedSpreadsheetRepositoryCreateInput
} from "@/types/spreadsheet";

export const spreadsheetRepository = {
  async create(data: UploadedSpreadsheetRepositoryCreateInput): Promise<UploadedSpreadsheet> {
    return prisma.uploadedSpreadsheet.create({
      data
    });
  },

  async findById(id: string): Promise<UploadedSpreadsheet | null> {
    return prisma.uploadedSpreadsheet.findUnique({
      where: {
        id
      }
    });
  }
};

