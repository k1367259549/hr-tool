type InsightCardProps = {
  title: string;
  items: string[];
};

export function InsightCard({ items, title }: InsightCardProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">暂无洞察。</li>
        )}
      </ul>
    </section>
  );
}
