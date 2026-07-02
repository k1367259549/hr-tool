type EvidenceCardProps = {
  title: string;
  items: string[];
};

export function EvidenceCard({ items, title }: EvidenceCardProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">暂无证据。</li>
        )}
      </ul>
    </section>
  );
}
