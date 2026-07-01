"use client";

import { FormField } from "@/components/shared/FormField";
import type { JobUnderstandingFormValues } from "@/types/jobProfile";

type JobUnderstandingFormProps = {
  values: JobUnderstandingFormValues;
  isGenerating: boolean;
  onChange: (field: keyof JobUnderstandingFormValues, value: string) => void;
  onGenerate: () => Promise<void>;
};

export function JobUnderstandingForm({
  values,
  isGenerating,
  onChange,
  onGenerate
}: JobUnderstandingFormProps): JSX.Element {
  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <FormField id="job-title" label="岗位名称" required>
        <input
          id="job-title"
          type="text"
          value={values.jobTitle}
          onChange={(event) => onChange("jobTitle", event.target.value)}
          placeholder="例如：高级招聘专员 / 前端工程师 / 产品经理"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <FormField id="job-jd" label="JD" required>
        <textarea
          id="job-jd"
          value={values.jd}
          onChange={(event) => onChange("jd", event.target.value)}
          rows={10}
          placeholder="粘贴岗位 JD，包括职责、要求、工作地点、团队信息等。"
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField id="leader-requirements" label="Leader 要求">
          <textarea
            id="leader-requirements"
            value={values.leaderRequirements}
            onChange={(event) => onChange("leaderRequirements", event.target.value)}
            rows={5}
            placeholder="补充直属 leader 或业务方口头要求。"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <FormField id="team-background" label="团队背景">
          <textarea
            id="team-background"
            value={values.teamBackground}
            onChange={(event) => onChange("teamBackground", event.target.value)}
            rows={5}
            placeholder="团队阶段、业务方向、协作方式、当前缺口。"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField id="hiring-goal" label="招聘目标">
          <textarea
            id="hiring-goal"
            value={values.hiringGoal}
            onChange={(event) => onChange("hiringGoal", event.target.value)}
            rows={4}
            placeholder="例如：两周内完成首轮面试，优先补充某方向经验。"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <FormField id="job-notes" label="备注">
          <textarea
            id="job-notes"
            value={values.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={4}
            placeholder="记录你对岗位的疑问、约束或已知背景。"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={isGenerating}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "正在生成..." : "生成岗位理解"}
        </button>
      </div>
    </form>
  );
}
