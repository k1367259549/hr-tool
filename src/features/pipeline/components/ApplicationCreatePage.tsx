"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import type { ApiResponse } from "@/types/api";
import type { CandidateListResultDto } from "@/types/candidate";
import type {
  ApplicationCreateInput,
  CandidateApplicationDetailDto
} from "@/types/candidateApplication";
import type { JobProfileDto } from "@/types/jobProfile";

export function ApplicationCreatePage(): JSX.Element {
  const [candidates, setCandidates] = useState<CandidateListResultDto["candidates"]>([]);
  const [jobProfiles, setJobProfiles] = useState<JobProfileDto[]>([]);
  const [form, setForm] = useState<ApplicationCreateInput>({
    candidateId: "",
    jobProfileId: "",
    notes: "",
    owner: "",
    sourceChannel: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(null);

  useEffect(() => {
    const initialCandidateId = new URLSearchParams(window.location.search).get("candidateId");

    if (initialCandidateId) {
      setForm((current) => ({
        ...current,
        candidateId: initialCandidateId
      }));
    }

    async function loadOptions(): Promise<void> {
      setError(null);

      try {
        const [candidateResponse, jobProfileResponse] = await Promise.all([
          fetch("/api/candidates?status=ACTIVE&pageSize=100"),
          fetch("/api/job-profiles")
        ]);
        const candidateJson = (await candidateResponse.json()) as ApiResponse<CandidateListResultDto>;
        const jobProfileJson = (await jobProfileResponse.json()) as ApiResponse<JobProfileDto[]>;

        if (!candidateJson.success || !candidateJson.data) {
          throw new Error(candidateJson.error?.message ?? "候选人列表加载失败。");
        }

        if (!jobProfileJson.success || !jobProfileJson.data) {
          throw new Error(jobProfileJson.error?.message ?? "岗位画像加载失败。");
        }

        setCandidates(candidateJson.data.candidates);
        setJobProfiles(jobProfileJson.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "新建招聘流程选项加载失败。");
      }
    }

    void loadOptions();
  }, []);

  async function submitApplication(): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/applications", {
        body: JSON.stringify(form),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const json = (await response.json()) as ApiResponse<CandidateApplicationDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "招聘流程创建失败。");
      }

      setCreatedApplicationId(json.data.id);
      window.alert("招聘流程已创建。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "招聘流程创建失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Candidate Application</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">新建招聘流程</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          手动把候选人与已确认岗位画像连接为一个 Candidate Application。不会自动关联简历或移动阶段。
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {createdApplicationId ? (
        <Link
          href={`/feishu/pipeline/${createdApplicationId}`}
          className="inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          查看已创建流程
        </Link>
      ) : null}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Candidate
            <select
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.candidateId}
              onChange={(event) => setForm((current) => ({ ...current, candidateId: event.target.value }))}
            >
              <option value="">选择非归档候选人</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Reviewed Job Profile
            <select
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.jobProfileId}
              onChange={(event) => setForm((current) => ({ ...current, jobProfileId: event.target.value }))}
            >
              <option value="">选择已确认岗位画像</option>
              {jobProfiles.map((jobProfile) => (
                <option key={jobProfile.id} value={jobProfile.id}>
                  {jobProfile.jobTitle}
                </option>
              ))}
            </select>
          </label>
          <InputField
            label="Owner"
            value={form.owner ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, owner: value }))}
          />
          <InputField
            label="Source"
            value={form.sourceChannel ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, sourceChannel: value }))}
          />
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Notes
            <textarea
              className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.notes ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void submitApplication()}
          >
            创建招聘流程
          </button>
          <Link href="/feishu/pipeline" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            返回 Pipeline
          </Link>
        </div>
      </section>
    </div>
  );
}

function InputField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}): JSX.Element {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
