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
    label: "Resume Count"
  },
  {
    field: "screenCount",
    label: "Screen Count"
  },
  {
    field: "phoneCount",
    label: "Phone Count"
  },
  {
    field: "interviewCount",
    label: "Interview Count"
  },
  {
    field: "offerCount",
    label: "Offer Count"
  },
  {
    field: "entryCount",
    label: "Entry Count"
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
      title="Daily Log"
      description="Create or update one structured recruiting log for a selected date."
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onReset}
            disabled={isSaving || isDeleting}
          >
            New
          </button>
          <button
            type="button"
            className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onDelete()}
            disabled={!canDelete || isSaving || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onSave()}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </PageActions>
      }
    >
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        {errorMessage ? <ErrorState title="Unable to save log" message={errorMessage} /> : null}

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <FormField id="date" label="Date" required>
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
            Load Date
          </button>
        </div>

        <FormField id="position" label="Position">
          <input
            id="position"
            type="text"
            value={values.position}
            onChange={handleTextChange("position")}
            placeholder="Frontend Engineer"
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
          <FormField id="summary" label="Summary">
            <textarea
              id="summary"
              value={values.summary}
              onChange={handleTextChange("summary")}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
          <FormField id="problems" label="Problems">
            <textarea
              id="problems"
              value={values.problems}
              onChange={handleTextChange("problems")}
              rows={5}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
          <FormField id="reflection" label="Reflection">
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
