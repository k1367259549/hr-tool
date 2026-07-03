"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  ResumeEvaluationDetailDto,
  ResumeEvaluationOptionsDto
} from "@/types/resumeEvaluationResult";

export function NewEvaluationPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillResumeId = searchParams.get("resumeId") ?? "";

  const [resumeId, setResumeId] = useState(prefillResumeId);
  const [jobProfileId, setJobProfileId] = useState("");
  const [templateVersionId, setTemplateVersionId] = useState("");
  const [evaluatedBy, setEvaluatedBy] = useState("");
  const [options, setOptions] = useState<ResumeEvaluationOptionsDto | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId.trim()) {
      setOptions(null);
      return;
    }

    let cancelled = false;
    setIsLoadingOptions(true);

    void fetch(`/api/resume-evaluation-options?resumeId=${encodeURIComponent(resumeId.trim())}`)
      .then((r) => r.json() as Promise<ApiResponse<ResumeEvaluationOptionsDto>>)
      .then((json) => {
        if (cancelled) {
          return;
        }

        if (json.success && json.data) {
          setOptions(json.data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/resume-evaluations", {
        body: JSON.stringify({
          evaluatedBy: evaluatedBy.trim() || null,
          jobProfileId: jobProfileId.trim(),
          resumeId: resumeId.trim(),
          templateVersionId: templateVersionId.trim()
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const json = (await response.json()) as ApiResponse<ResumeEvaluationDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "创建评估失败。");
      }

      router.push(`/feishu/evaluations/${json.data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建评估失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Resume Evaluations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">新建评估</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            选择已解析的简历、已确认的岗位和已发布的评价标准版本。
          </p>
        </div>
        <Link
          href="/feishu/evaluations"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          返回列表
        </Link>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-md border border-slate-200 bg-white p-5">
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          简历 ID
          <input
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="粘贴 Resume ID"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
          />
        </label>

        {isLoadingOptions ? (
          <p className="text-sm text-slate-500">正在加载岗位和模板选项…</p>
        ) : null}

        {options ? (
          <>
            <label className="block text-sm font-medium text-slate-700">
              岗位画像（已确认）
              <select
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={jobProfileId}
                onChange={(e) => setJobProfileId(e.target.value)}
              >
                <option value="">请选择岗位</option>
                {options.jobProfiles.map((jp) => (
                  <option key={jp.id} value={jp.id}>
                    {jp.jobTitle}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              评价标准版本（已发布）
              <select
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={templateVersionId}
                onChange={(e) => setTemplateVersionId(e.target.value)}
              >
                <option value="">请选择版本</option>
                {options.templateVersions.map((tv) => (
                  <option key={tv.id} value={tv.id}>
                    {tv.templateName} V{tv.versionNumber}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          评估人（可选）
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="评估人姓名"
            value={evaluatedBy}
            onChange={(e) => setEvaluatedBy(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isSaving || !resumeId.trim() || !jobProfileId || !templateVersionId}
        >
          {isSaving ? "创建中…" : "创建评估"}
        </button>
      </form>
    </div>
  );
}
