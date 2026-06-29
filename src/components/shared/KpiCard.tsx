type KpiCardTone = "neutral" | "success" | "warning" | "danger";

type KpiCardProps = {
  title: string;
  value: string;
  description?: string;
  footer?: string;
  tone?: KpiCardTone;
};

const toneClasses: Record<KpiCardTone, string> = {
  neutral: "border-slate-200 bg-white",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-rose-200 bg-rose-50"
};

export function KpiCard({
  title,
  value,
  description,
  footer,
  tone = "neutral"
}: KpiCardProps): JSX.Element {
  return (
    <section className={`rounded-md border p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {footer ? (
        <p className="mt-4 border-t border-slate-200 pt-3 text-xs font-medium text-slate-500">
          {footer}
        </p>
      ) : null}
    </section>
  );
}
