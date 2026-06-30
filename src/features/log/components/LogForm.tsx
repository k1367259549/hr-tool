"use client";

import type { ChangeEvent } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { FormField } from "@/components/shared/FormField";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageActions } from "@/components/shared/PageActions";
import { SectionCard } from "@/components/shared/SectionCard";
import type { RecruitLogCountField, RecruitLogFormValues } from "@/types/log";

type LogFormProps = {
  values: RecruitLogFormValues;
  isSaving: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  errorMessage: string | null;
  onChange: (field: keyof RecruitLogFormValues, value: string | number) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onReset: () => void;
  onLoadByDate: () => Promise<void>;
};

const kpiFields: Array<{
  field: RecruitLogCountField;
  label: string;
}> = [
  {
    field: "resumeCount",
    label: "简历数"
  },
  {
    field: "screenCount",
    label: "筛选数"
  },
  {
    field: "phoneCount",
    label: "电话沟通数"
  },
  {
    field: "interviewCount",
    label: "面试数"
  },
  {
    field: "offerCount",
    label: "Offer 数"
  },
  {
    field: "entryCount",
    label: "入职数"
  }
];

export function LogForm({
  values,
  isSaving,
  isDeleting,
  canDelete,
  errorMessage,
  onChange,
  onSave,
  onDelete,
  onReset,
  onLoadByDate
}: LogFormProps): JSX.Element {
  const handleTextChange =
    (field: keyof RecruitLogFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      onChange(field, event.target.value);
    };

  const handleNumberChange =
    (field: RecruitLogCountField) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextValue = event.target.value === "" ? 0 : Number(event.target.value);
      onChange(field, nextValue);
    };

  return (
    <SectionCard
      title="每日记录"
      description="为选中日期创建或更新一条结构化招聘记录。"
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onReset}
            disabled={isSaving || isDeleting}
          >
            新建
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onDelete()}
            disabled={!canDelete || isSaving || isDeleting}
          >
            {isDeleting ? "正在删除..." : "删除"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onSave()}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? "正在保存..." : "保存"}
          </button>
        </PageActions>
      }
    >
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        {errorMessage ? <ErrorState title="无法保存记录" message={errorMessage} /> : null}

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <FormField id="date" label="日期" required>
            <input
              id="date"
              type="date"
              value={values.date}
              onChange={handleTextChange("date")}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onLoadByDate()}
            disabled={isSaving || isDeleting}
          >
            加载日期
          </button>
        </div>

        <FormField id="position" label="职位">
          <input
            id="position"
            type="text"
            value={values.position}
            onChange={handleTextChange("position")}
            placeholder="前端工程师"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {kpiFields.map((item) => (
            <div key={item.field} className="space-y-2">
              <KpiCard title={item.label} value={String(values[item.field])} />
              <input
                aria-label={item.label}
                type="number"
                min={0}
                step={1}
                value={values[item.field]}
                onChange={handleNumberChange(item.field)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <FormField id="summary" label="总结">
            <textarea
              id="summary"
              value={values.summary}
              onChange={handleTextChange("summary")}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
          <FormField id="problems" label="问题">
            <textarea
              id="problems"
              value={values.problems}
              onChange={handleTextChange("problems")}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
          <FormField id="reflection" label="反思">
            <textarea
              id="reflection"
              value={values.reflection}
              onChange={handleTextChange("reflection")}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
        </div>
      </form>
    </SectionCard>
  );
}
