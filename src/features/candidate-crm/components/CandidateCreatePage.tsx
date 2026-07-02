"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { CandidateForm } from "@/features/candidate-crm/components/CandidateForm";
import type { ApiResponse } from "@/types/api";
import type { CandidateCreateInput, CandidateDto } from "@/types/candidate";

export function CandidateCreatePage(): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(input: CandidateCreateInput): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/candidates", {
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const json = (await response.json()) as ApiResponse<CandidateDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "创建候选人失败。");
      }

      window.alert("候选人已创建。");
      router.push(`/feishu/candidates/${json.data.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建候选人失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Candidate CRM</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">新建候选人</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          手动创建候选人资料。不会自动调用 AI、不会自动创建 Pipeline，也不会自动关联简历。
        </p>
      </header>

      <Link href="/feishu/candidates" className="inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm">
        返回候选人列表
      </Link>

      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <CandidateForm disabled={isSaving} submitLabel="创建候选人" onSubmit={handleCreate} />
      </section>
    </div>
  );
}
