"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  criterionImportanceLabels,
  formatDateTime,
  templateStatusLabels,
  versionStatusLabels
} from "@/features/evaluation-template/evaluationTemplateLabels";
import { useEvaluationTemplateDetail } from "@/features/evaluation-template/hooks/useEvaluationTemplateDetail";
import type {
  ApiResponse
} from "@/types/api";
import type {
  EvaluationCriterion,
  EvaluationCriterionImportance,
  EvaluationTemplateVersionSummaryDto,
  JobProfileEvaluationAssignmentResultDto
} from "@/types/evaluationTemplate";
import type { JobProfileDto } from "@/types/jobProfile";

const emptyCriterion = (): EvaluationCriterion => ({
  description: "",
  importance: "REQUIRED",
  key: "",
  label: ""
});

export function EvaluationTemplateDetailPage({ templateId }: { templateId: string }): JSX.Element {
  const {
    archiveTemplate,
    createNextDraft,
    error,
    isLoading,
    isSaving,
    publishVersion,
    restoreTemplate,
    template,
    updateDraft,
    updateTemplate
  } = useEvaluationTemplateDetail(templateId);
  const [metadata, setMetadata] = useState({
    description: "",
    name: ""
  });
  const draftVersion = useMemo(
    () => template?.versions.find((version) => version.status === "DRAFT") ?? null,
    [template]
  );

  useEffect(() => {
    if (!template) {
      return;
    }

    setMetadata({
      description: template.description ?? "",
      name: template.name
    });
  }, [template]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Evaluation Templates</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">评价标准详情</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            评价标准与 Job Profile 分离维护。分配标准不会自动评估已有简历，也不会改变招聘流程阶段。
          </p>
        </div>
        <Link
          href="/feishu/evaluation-templates"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          返回评价标准
        </Link>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载评价标准" description="读取模板、版本历史和岗位分配状态。" />
      ) : template ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <MetaItem label="状态" value={templateStatusLabels[template.status]} />
            <MetaItem label="最新版本号" value={`V${template.latestVersionNumber}`} />
            <MetaItem label="关联岗位" value={`${template.activeAssignmentCount} 个`} />
            <MetaItem label="更新时间" value={formatDateTime(template.updatedAt)} />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">模板元数据</h2>
                <p className="mt-1 text-sm text-slate-500">模板身份长期保留，标准内容存放在 Version 中。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                    disabled={isSaving}
                    onClick={() => void archiveTemplate()}
                  >
                    归档
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                    disabled={isSaving}
                    onClick={() => void restoreTemplate()}
                  >
                    恢复
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-medium text-slate-700">
                名称
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={metadata.name}
                  onChange={(event) =>
                    setMetadata((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                说明
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={metadata.description}
                  onChange={(event) =>
                    setMetadata((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isSaving}
              onClick={() => void updateTemplate(metadata)}
            >
              保存元数据
            </button>
          </section>

          <DraftEditor
            disabled={template.status === "ARCHIVED" || isSaving}
            draftVersion={draftVersion}
            onCreateNextDraft={() => void createNextDraft()}
            onPublish={(versionId) => void publishVersion(versionId)}
            onSave={(versionId, input) => void updateDraft(versionId, input)}
            templateStatus={template.status}
          />

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">版本历史</h2>
            <div className="mt-4 space-y-3">
              {template.versions.map((version) => (
                <VersionHistoryItem key={version.id} version={version} />
              ))}
            </div>
          </section>

          <AssignmentPanel publishedVersions={template.versions.filter((version) => version.status === "PUBLISHED")} />
        </>
      ) : null}
    </div>
  );
}

function DraftEditor({
  disabled,
  draftVersion,
  onCreateNextDraft,
  onPublish,
  onSave,
  templateStatus
}: {
  disabled: boolean;
  draftVersion: EvaluationTemplateVersionSummaryDto | null;
  onCreateNextDraft: () => void;
  onPublish: (versionId: string) => void;
  onSave: (
    versionId: string,
    input: {
      criteria: EvaluationCriterion[];
      instructions: string | null;
      changeNote: string | null;
      createdBy: string | null;
    }
  ) => void;
  templateStatus: string;
}): JSX.Element {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [instructions, setInstructions] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  useEffect(() => {
    if (!draftVersion) {
      setCriteria([]);
      setInstructions("");
      setChangeNote("");
      setCreatedBy("");
      return;
    }

    setCriteria(draftVersion.criteria);
    setInstructions(draftVersion.instructions ?? "");
    setChangeNote(draftVersion.changeNote ?? "");
    setCreatedBy(draftVersion.createdBy ?? "");
  }, [draftVersion]);

  if (!draftVersion) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Draft 编辑区</h2>
            <p className="mt-1 text-sm text-slate-500">当前没有 Draft。创建下一 Draft 会复制最新 Published 内容。</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={templateStatus === "ARCHIVED"}
            onClick={onCreateNextDraft}
          >
            创建下一 Draft
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Draft 编辑区 V{draftVersion.versionNumber}</h2>
          <p className="mt-1 text-sm text-slate-500">
            REQUIRED 只表示招聘关注程度，不代表自动淘汰、扣分或通过阈值。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            disabled={disabled}
            onClick={() => {
              if (window.confirm("发布后的版本不可修改，后续调整需要创建新版本。")) {
                onPublish(draftVersion.id);
              }
            }}
          >
            发布版本
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="text-sm font-medium text-slate-700">
          Recruiter 使用说明
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
            disabled={disabled}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            变更说明
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={disabled}
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            创建人
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={disabled}
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {criteria.map((criterion, index) => (
          <CriterionEditor
            key={`${criterion.key}-${index}`}
            criterion={criterion}
            disabled={disabled}
            index={index}
            onChange={(nextCriterion) =>
              setCriteria((current) =>
                current.map((item, itemIndex) => (itemIndex === index ? nextCriterion : item))
              )
            }
            onMoveDown={() =>
              setCriteria((current) => moveCriterion(current, index, Math.min(current.length - 1, index + 1)))
            }
            onMoveUp={() =>
              setCriteria((current) => moveCriterion(current, index, Math.max(0, index - 1)))
            }
            onRemove={() =>
              setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))
            }
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          disabled={disabled}
          onClick={() => setCriteria((current) => [...current, emptyCriterion()])}
        >
          添加 criterion
        </button>
        <button
          type="button"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={disabled}
          onClick={() =>
            onSave(draftVersion.id, {
              changeNote,
              createdBy,
              criteria,
              instructions
            })
          }
        >
          保存 Draft
        </button>
      </div>
    </section>
  );
}

function CriterionEditor({
  criterion,
  disabled,
  index,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove
}: {
  criterion: EvaluationCriterion;
  disabled: boolean;
  index: number;
  onChange: (criterion: EvaluationCriterion) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">Criterion {index + 1}</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs" disabled={disabled} onClick={onMoveUp}>
            上移
          </button>
          <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs" disabled={disabled} onClick={onMoveDown}>
            下移
          </button>
          <button type="button" className="rounded-md border border-slate-300 px-2 py-1 text-xs" disabled={disabled} onClick={onRemove}>
            删除
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled}
          placeholder="key，例如 backend-api-design"
          value={criterion.key}
          onChange={(event) => onChange({ ...criterion, key: event.target.value })}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled}
          placeholder="label"
          value={criterion.label}
          onChange={(event) => onChange({ ...criterion, label: event.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled}
          value={criterion.importance}
          onChange={(event) =>
            onChange({
              ...criterion,
              importance: event.target.value as EvaluationCriterionImportance
            })
          }
        >
          <option value="REQUIRED">{criterionImportanceLabels.REQUIRED}</option>
          <option value="PREFERRED">{criterionImportanceLabels.PREFERRED}</option>
          <option value="CONTEXTUAL">{criterionImportanceLabels.CONTEXTUAL}</option>
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled}
          placeholder="evidence guidance"
          value={criterion.evidenceGuidance ?? ""}
          onChange={(event) =>
            onChange({
              ...criterion,
              evidenceGuidance: event.target.value
            })
          }
        />
        <textarea
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          disabled={disabled}
          placeholder="description"
          value={criterion.description}
          onChange={(event) => onChange({ ...criterion, description: event.target.value })}
        />
      </div>
    </div>
  );
}

function VersionHistoryItem({ version }: { version: EvaluationTemplateVersionSummaryDto }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">Version {version.versionNumber}</p>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
          {versionStatusLabels[version.status]}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-4">
        <MetaLine label="Criteria" value={`${version.criteria.length} 个`} />
        <MetaLine label="发布于" value={formatDateTime(version.publishedAt)} />
        <MetaLine label="创建人" value={version.createdBy ?? "未填写"} />
        <MetaLine label="更新时间" value={formatDateTime(version.updatedAt)} />
      </div>
      {version.changeNote ? <p className="mt-3 text-sm text-slate-600">{version.changeNote}</p> : null}
    </div>
  );
}

function AssignmentPanel({
  publishedVersions
}: {
  publishedVersions: EvaluationTemplateVersionSummaryDto[];
}): JSX.Element {
  const [jobProfiles, setJobProfiles] = useState<JobProfileDto[]>([]);
  const [selectedJobProfileId, setSelectedJobProfileId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [assignment, setAssignment] = useState<JobProfileEvaluationAssignmentResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadJobProfiles(): Promise<void> {
      try {
        const response = await fetch("/api/job-profiles");
        const json = (await response.json()) as ApiResponse<JobProfileDto[]>;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "岗位画像加载失败。");
        }

        setJobProfiles(json.data);
        setSelectedJobProfileId((current) => current || json.data[0]?.id || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "岗位画像加载失败。");
      }
    }

    void loadJobProfiles();
  }, []);

  useEffect(() => {
    setSelectedVersionId((current) => current || publishedVersions[0]?.id || "");
  }, [publishedVersions]);

  useEffect(() => {
    if (!selectedJobProfileId) {
      setAssignment(null);
      return;
    }

    void loadAssignment(selectedJobProfileId);
  }, [selectedJobProfileId]);

  async function loadAssignment(jobProfileId: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/job-profiles/${jobProfileId}/evaluation-template-assignment`);
      const json = (await response.json()) as ApiResponse<JobProfileEvaluationAssignmentResultDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "岗位分配加载失败。");
      }

      setAssignment(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "岗位分配加载失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function assignVersion(): Promise<void> {
    if (!selectedJobProfileId || !selectedVersionId) {
      setError("请选择已确认岗位画像和已发布版本。");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/job-profiles/${selectedJobProfileId}/evaluation-template-assignment`,
        {
          body: JSON.stringify({
            assignedBy,
            templateVersionId: selectedVersionId
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PUT"
        }
      );
      const json = (await response.json()) as ApiResponse<JobProfileEvaluationAssignmentResultDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "分配评价标准失败。");
      }

      setAssignment(json.data);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "分配评价标准失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function unassignVersion(): Promise<void> {
    if (!selectedJobProfileId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/job-profiles/${selectedJobProfileId}/evaluation-template-assignment`,
        {
          method: "DELETE"
        }
      );
      const json = (await response.json()) as ApiResponse<JobProfileEvaluationAssignmentResultDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "取消分配失败。");
      }

      setAssignment(json.data);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "取消分配失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">Job Profile Assignment</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        分配标准不会自动评估已有简历，也不会改变招聘流程阶段。只能分配给已人工确认的 Job Profile。
      </p>
      {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={selectedJobProfileId}
          onChange={(event) => setSelectedJobProfileId(event.target.value)}
        >
          <option value="">选择已确认岗位画像</option>
          {jobProfiles.map((jobProfile) => (
            <option key={jobProfile.id} value={jobProfile.id}>
              {jobProfile.jobTitle}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={selectedVersionId}
          onChange={(event) => setSelectedVersionId(event.target.value)}
        >
          <option value="">选择 Published Version</option>
          {publishedVersions.map((version) => (
            <option key={version.id} value={version.id}>
              Version {version.versionNumber}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="assignedBy"
          value={assignedBy}
          onChange={(event) => setAssignedBy(event.target.value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isLoading || !selectedJobProfileId || !selectedVersionId}
          onClick={() => void assignVersion()}
        >
          分配标准
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
          disabled={isLoading || !selectedJobProfileId}
          onClick={() => void unassignVersion()}
        >
          取消当前分配
        </button>
      </div>
      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">当前分配</p>
        <p className="mt-2 text-sm text-slate-600">
          {assignment?.activeAssignment
            ? `${assignment.activeAssignment.template.name} / Version ${assignment.activeAssignment.templateVersion.versionNumber}`
            : "当前岗位没有活跃评价标准分配。"}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-semibold text-slate-950">分配历史</p>
        {assignment && assignment.history.length > 0 ? (
          assignment.history.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
              {item.template.name} / Version {item.templateVersion.versionNumber} ·{" "}
              {formatDateTime(item.assignedAt)} · {item.endedAt ? `已结束 ${formatDateTime(item.endedAt)}` : "Active"}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">暂无历史分配。</p>
        )}
      </div>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <p>
      <span className="font-medium text-slate-500">{label}: </span>
      <span className="break-all text-slate-700">{value}</span>
    </p>
  );
}

function moveCriterion(
  criteria: EvaluationCriterion[],
  fromIndex: number,
  toIndex: number
): EvaluationCriterion[] {
  if (fromIndex === toIndex) {
    return criteria;
  }

  const nextCriteria = [...criteria];
  const [item] = nextCriteria.splice(fromIndex, 1);

  if (!item) {
    return criteria;
  }

  nextCriteria.splice(toIndex, 0, item);
  return nextCriteria;
}
