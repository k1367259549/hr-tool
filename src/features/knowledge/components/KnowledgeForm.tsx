"use client";

import { ErrorState } from "@/components/shared/ErrorState";
import { FormField } from "@/components/shared/FormField";
import type { KnowledgeFormMode, KnowledgeFormValues } from "@/types/knowledge";
import type { KnowledgeType } from "@prisma/client";

type KnowledgeFormProps = {
  values: KnowledgeFormValues;
  mode: KnowledgeFormMode;
  typeOptions: KnowledgeType[];
  isSaving: boolean;
  errorMessage: string | null;
  onChange: (field: keyof KnowledgeFormValues, value: string) => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

export function KnowledgeForm({
  values,
  mode,
  typeOptions,
  isSaving,
  errorMessage,
  onChange,
  onCancel,
  onSave
}: KnowledgeFormProps): JSX.Element {
  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      {errorMessage ? <ErrorState title="Unable to save knowledge" message={errorMessage} /> : null}

      <FormField id="knowledge-title" label="Title" required>
        <input
          id="knowledge-title"
          type="text"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Interview follow-up template"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="knowledge-type" label="Type" required>
          <select
            id="knowledge-type"
            value={values.type}
            onChange={(event) => onChange("type", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="knowledge-source" label="Source" required>
          <select
            id="knowledge-source"
            value={values.source}
            onChange={(event) => onChange("source", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="USER">USER</option>
            <option value="AI">AI</option>
          </select>
        </FormField>
      </div>

      <FormField
        id="knowledge-tags"
        label="Tags"
        description="Use commas to separate tags."
      >
        <input
          id="knowledge-tags"
          type="text"
          value={values.tagsText}
          onChange={(event) => onChange("tagsText", event.target.value)}
          placeholder="interview, follow-up"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <FormField id="knowledge-content" label="Content" required>
        <textarea
          id="knowledge-content"
          value={values.content}
          onChange={(event) => onChange("content", event.target.value)}
          rows={8}
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onSave()}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Entry"}
        </button>
      </div>
    </form>
  );
}
