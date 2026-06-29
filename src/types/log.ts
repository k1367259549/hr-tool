export type RecruitLogDateInput = Date | string;

export type RecruitLog = {
  id: string;
  date: Date;
  position: string | null;
  resumeCount: number;
  screenCount: number;
  phoneCount: number;
  interviewCount: number;
  offerCount: number;
  entryCount: number;
  source: string | null;
  channel: string | null;
  roleType: string | null;
  priority: string | null;
  summary: string | null;
  problems: string | null;
  reflection: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruitLogDto = Omit<RecruitLog, "date" | "createdAt" | "updatedAt"> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type RecruitLogCountField =
  | "resumeCount"
  | "screenCount"
  | "phoneCount"
  | "interviewCount"
  | "offerCount"
  | "entryCount";

export type RecruitLogTextField = "position" | "summary" | "problems" | "reflection";

export type RecruitLogMetadataField = "source" | "channel" | "roleType" | "priority";

export type RecruitLogCreateInput = Partial<
  Record<RecruitLogCountField, number> &
    Record<RecruitLogTextField | RecruitLogMetadataField, string | null>
> & {
  date: RecruitLogDateInput;
};

export type RecruitLogUpdateInput = Partial<
  Record<RecruitLogCountField, number> &
    Record<RecruitLogTextField | RecruitLogMetadataField, string | null> & {
      date: RecruitLogDateInput;
    }
>;

export type RecruitLogRepositoryCreateInput = Omit<RecruitLogCreateInput, "date"> & {
  date: Date;
};

export type RecruitLogRepositoryUpdateInput = Omit<RecruitLogUpdateInput, "date"> & {
  date?: Date;
};

export type RecruitLogQueryOptions = {
  date?: RecruitLogDateInput;
  limit?: number;
};

export type RecruitLogRepositoryQueryOptions = {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
};

export type RecruitLogFormValues = Record<RecruitLogCountField, number> &
  Record<RecruitLogTextField, string> & {
    date: string;
  };
