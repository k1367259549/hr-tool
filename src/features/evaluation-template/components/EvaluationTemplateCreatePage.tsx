"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import type { ApiResponse } from "@/types/api";
import type { EvaluationTemplateDetailDto } from "@/types/evaluationTemplate";

export function EvaluationTemplateCreatePage(): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function createTemplate(): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluation-templates", {
        body: JSON.stringify({
          description,
          name
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const json = (await response.json()) as ApiResponse<EvaluationTemplateDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "评价标准创建失败。");
      }

      window.location.href = `/feishu/evaluation-templates/${json.data.id}`;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "评价标准创建失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Evaluation Templates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">新建评价标准</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          新建后会自动生成 Version 1 Draft。标准内容保存在版本中，发布后不可修改。
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4">
          <label className="text-sm font-medium text-slate-700">
            名称
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            说明
            <textarea
              className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void createTemplate()}
          >
            {isSaving ? "创建中..." : "创建评价标准"}
          </button>
          <Link
            href="/feishu/evaluation-templates"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            返回评价标准
          </Link>
        </div>
      </section>
    </div>
  );
}
