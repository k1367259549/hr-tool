"use client";

import { FormField } from "@/components/shared/FormField";
import type { CandidateUnderstandingFormValues } from "@/types/candidateUnderstanding";
import type { JobProfileDto } from "@/types/jobProfile";

type CandidateUnderstandingFormProps = {
  values: CandidateUnderstandingFormValues;
  jobProfiles: JobProfileDto[];
  isLoadingProfiles: boolean;
  isGenerating: boolean;
  onChange: (field: keyof Omit<CandidateUnderstandingFormValues, "file">, value: string) => void;
  onSelectFile: (file: File | null) => void;
  onGenerate: () => Promise<void>;
};

export function CandidateUnderstandingForm({
  values,
  jobProfiles,
  isLoadingProfiles,
  isGenerating,
  onChange,
  onSelectFile,
  onGenerate
}: CandidateUnderstandingFormProps): JSX.Element {
  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <FormField id="job-profile-id" label="已确认岗位画像" required>
        <select
          id="job-profile-id"
          value={values.jobProfileId}
          onChange={(event) => onChange("jobProfileId", event.target.value)}
          disabled={isLoadingProfiles || isGenerating}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {jobProfiles.length === 0 ? (
            <option value="">暂无岗位画像</option>
          ) : (
            jobProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.jobTitle}
              </option>
            ))
          )}
        </select>
      </FormField>

      <FormField id="resume-file" label="候选人简历" required description="支持 PDF、DOCX、TXT，文件最大 10MB。">
        <input
          id="resume-file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
          disabled={isGenerating}
          className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </FormField>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField id="candidate-source" label="候选人来源">
          <input
            id="candidate-source"
            type="text"
            value={values.candidateSource}
            onChange={(event) => onChange("candidateSource", event.target.value)}
            placeholder="例如：Boss / 猎头 / 内推 / 飞书群"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <FormField id="candidate-notes" label="备注">
          <textarea
            id="candidate-notes"
            value={values.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            placeholder="记录初步背景、沟通上下文或需要特别核实的信息。"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={isGenerating || isLoadingProfiles || jobProfiles.length === 0}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "正在生成..." : "生成候选人理解"}
        </button>
      </div>
    </form>
  );
}
