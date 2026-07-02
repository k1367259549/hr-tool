"use client";

import { FormField } from "@/components/shared/FormField";
import type { JobUnderstandingOutput, JobUnderstandingResult } from "@/types/jobProfile";
import { parseMultilineList } from "@/utils/textList";

type JobUnderstandingReviewPanelProps = {
  result: JobUnderstandingResult;
  reviewedOutput: JobUnderstandingOutput;
  isGenerating: boolean;
  isSaving: boolean;
  onChange: (field: keyof JobUnderstandingOutput, value: string | string[]) => void;
  onRegenerate: () => Promise<void>;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

const listFields: Array<{
  field: Exclude<keyof JobUnderstandingOutput, "jobSummary">;
  label: string;
}> = [
  { field: "coreResponsibilities", label: "核心职责" },
  { field: "requiredCompetencies", label: "必备能力" },
  { field: "preferredCompetencies", label: "加分能力" },
  { field: "potentialRisks", label: "潜在风险" },
  { field: "hiringFocus", label: "招聘关注点" },
  { field: "interviewFocus", label: "面试关注点" },
  { field: "missingInformation", label: "缺失信息" },
  { field: "suggestedFollowUpQuestions", label: "建议追问问题" }
];

export function JobUnderstandingReviewPanel({
  result,
  reviewedOutput,
  isGenerating,
  isSaving,
  onChange,
  onRegenerate,
  onCancel,
  onSave
}: JobUnderstandingReviewPanelProps): JSX.Element {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        AI 结果只是岗位理解草稿。保存前请人工确认或编辑；保存动作代表 Recruiter 已确认该岗位画像。
      </div>

      <div className="grid gap-3 text-xs text-slate-500 md:grid-cols-4">
        <Metadata label="Workflow ID" value={result.workflowId} />
        <Metadata label="Provider" value={result.aiProvider} />
        <Metadata label="Model" value={result.aiModel} />
        <Metadata label="Prompt" value={`${result.promptFile} / v${result.promptVersion}`} />
      </div>

      <FormField id="job-summary" label="岗位摘要" required>
        <textarea
          id="job-summary"
          value={reviewedOutput.jobSummary}
          onChange={(event) => onChange("jobSummary", event.target.value)}
          rows={5}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="grid gap-4 lg:grid-cols-2">
        {listFields.map((item) => (
          <FormField key={item.field} id={item.field} label={item.label}>
            <textarea
              id={item.field}
              value={reviewedOutput[item.field].join("\n")}
              onChange={(event) => onChange(item.field, parseMultilineList(event.target.value))}
              rows={6}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isGenerating || isSaving}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => void onRegenerate()}
          disabled={isGenerating || isSaving}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "正在重新生成..." : "重新生成"}
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={isGenerating || isSaving}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "正在保存..." : "确认并保存岗位画像"}
        </button>
      </div>
    </div>
  );
}

function Metadata({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p>{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-700">{value}</p>
    </div>
  );
}
