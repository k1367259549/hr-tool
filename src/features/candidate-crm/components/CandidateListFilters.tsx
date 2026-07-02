import type { CandidateStatus } from "@/types/candidate";

export type CandidateListFilterState = {
  search: string;
  status: "" | CandidateStatus;
  sourceChannel: string;
  owner: string;
};

type CandidateListFiltersProps = {
  filters: CandidateListFilterState;
  onChange: (filters: CandidateListFilterState) => void;
};

export function CandidateListFilters({
  filters,
  onChange
}: CandidateListFiltersProps): JSX.Element {
  return (
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-4">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">搜索</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="姓名、公司、电话、邮箱"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">状态</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as CandidateListFilterState["status"] })
          }
        >
          <option value="">默认：不含已归档</option>
          <option value="ACTIVE">活跃</option>
          <option value="TALENT_POOL">人才池</option>
          <option value="ARCHIVED">已归档</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">来源</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Boss、内推、飞书群"
          value={filters.sourceChannel}
          onChange={(event) => onChange({ ...filters, sourceChannel: event.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Owner</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="负责人"
          value={filters.owner}
          onChange={(event) => onChange({ ...filters, owner: event.target.value })}
        />
      </label>
    </section>
  );
}
