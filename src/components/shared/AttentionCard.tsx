type AttentionCardProps = {
  title: string;
  items: string[];
  tone?: "warning" | "neutral";
};

const toneClasses: Record<NonNullable<AttentionCardProps["tone"]>, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800"
};

export function AttentionCard({ items, title, tone = "warning" }: AttentionCardProps): JSX.Element {
  return (
    <section className={`rounded-md border p-3 ${toneClasses[tone]}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="text-sm leading-6">
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm">暂无需要注意的事项。</li>
        )}
      </ul>
    </section>
  );
}
