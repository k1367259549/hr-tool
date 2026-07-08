"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import type { ApiResponse } from "@/types/api";
import type { ResumeUploadResultDto } from "@/types/resumeLibrary";

export function ResumeUploadPage(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [candidateSource, setCandidateSource] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadResume(): Promise<void> {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (file) {
        formData.set("file", file);
      }

      formData.set("candidateSource", candidateSource);
      formData.set("notes", notes);

      const response = await fetch("/api/resumes", {
        body: formData,
        method: "POST"
      });
      const json = await readResumeUploadResponse(response);

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "简历上传失败。");
      }

      window.location.href = `/feishu/resumes/${json.data.resume.id}`;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "简历上传失败。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Resume Library</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">上传独立简历</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          上传后只保存 Resume Library 记录并执行非 AI 文件解析。支持 PDF、DOCX、TXT，单文件最大 10MB。
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            简历文件
            <input
              className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            候选人来源
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              value={candidateSource}
              onChange={(event) => setCandidateSource(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            备注
            <textarea
              className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={isUploading}
            onClick={() => void uploadResume()}
          >
            {isUploading ? "上传中..." : "上传简历"}
          </button>
          <Link href="/feishu/resumes" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            返回简历库
          </Link>
        </div>
      </section>
    </div>
  );
}

async function readResumeUploadResponse(
  response: Response
): Promise<ApiResponse<ResumeUploadResultDto>> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      response.ok
        ? "简历上传接口返回了非 JSON 响应，请刷新后重试。"
        : `简历上传接口返回异常响应（HTTP ${response.status}），请稍后重试。`
    );
  }

  try {
    return JSON.parse(body) as ApiResponse<ResumeUploadResultDto>;
  } catch {
    throw new Error("简历上传接口返回的 JSON 无法解析，请稍后重试。");
  }
}
