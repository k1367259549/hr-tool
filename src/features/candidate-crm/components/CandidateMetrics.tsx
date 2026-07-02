import type { CandidateCountsDto } from "@/types/candidate";

type CandidateMetricsProps = {
  counts: CandidateCountsDto;
};

export function CandidateMetrics({ counts }: CandidateMetricsProps): JSX.Element {
  const metrics = [
    {
      label: "Active Candidates",
      value: counts.active
    },
    {
      label: "Talent Pool",
      value: counts.talentPool
    },
    {
      label: "Archived",
      value: counts.archived
    },
    {
      label: "Total",
      value: counts.total
    }
  ];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
        </div>
      ))}
    </section>
  );
}
