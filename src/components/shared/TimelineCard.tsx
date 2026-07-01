import Link from "next/link";

export type TimelineCardItem = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  time?: string;
  status?: string;
  href?: string;
};

type TimelineCardProps = {
  items: TimelineCardItem[];
  emptyText?: string;
};

export function TimelineCard({
  emptyText = "暂无活动。",
  items
}: TimelineCardProps): JSX.Element {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border border-slate-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
            {item.badge ? (
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {item.badge}
              </span>
            ) : null}
          </div>
          {item.time || item.status ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {item.time ? <span>{item.time}</span> : null}
              {item.status ? <span>{item.status}</span> : null}
            </div>
          ) : null}
          {item.href ? (
            <Link href={item.href} className="mt-3 inline-flex text-sm font-medium text-slate-950 underline">
              打开
            </Link>
          ) : null}
        </li>
      ))}
      {items.length === 0 ? <li className="text-sm text-slate-500">{emptyText}</li> : null}
    </ol>
  );
}
