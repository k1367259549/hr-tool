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
      {errorMessage ? <ErrorState title="无法保存知识" message={errorMessage} /> : null}

      <FormField id="knowledge-title" label="标题" required>
        <input
          id="knowledge-title"
          type="text"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="面试跟进模板"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="knowledge-type" label="类型" required>
          <select
            id="knowledge-type"
            value={values.type}
            onChange={(event) => onChange("type", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {getKnowledgeTypeLabel(type)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="knowledge-source" label="来源" required>
          <select
            id="knowledge-source"
            value={values.source}
            onChange={(event) => onChange("source", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="USER">用户</option>
            <option value="AI">AI</option>
          </select>
        </FormField>
      </div>

      <FormField
        id="knowledge-tags"
        label="标签"
        description="使用英文逗号分隔多个标签。"
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

      <FormField id="knowledge-content" label="内容" required>
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
          取消
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onSave()}
          disabled={isSaving}
        >
          {isSaving ? "正在保存..." : mode === "edit" ? "保存修改" : "创建条目"}
        </button>
      </div>
    </form>
  );
}

function getKnowledgeTypeLabel(type: KnowledgeType): string {
  const labels: Record<KnowledgeType, string> = {
    EXPERIENCE: "经验",
    NOTE: "笔记",
    POSITION: "岗位",
    TEMPLATE: "模板"
  };

  return labels[type];
}
