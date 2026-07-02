import Link from "next/link";
import type { ReactNode } from "react";

type ActionCardProps = {
  title: string;
  reason: string;
  nextAction: string;
  evidence: string[];
  badges?: string[];
  metadata?: Array<{
    label: string;
    value: string;
  }>;
  href?: string;
  actionLabel?: string;
  footer?: ReactNode;
};

export function ActionCard({
  actionLabel = "打开",
  badges = [],
  evidence,
  footer,
  href,
  metadata = [],
  nextAction,
  reason,
  title
}: ActionCardProps): JSX.Element {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{reason}</p>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 rounded-md bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {metadata.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {metadata.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 break-words text-sm leading-6 text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-md bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-950">Evidence</p>
        <ul className="mt-2 space-y-1">
          {evidence.length > 0 ? (
            evidence.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">
                {item}
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">暂无证据。</li>
          )}
        </ul>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 p-3">
        <p className="text-xs font-medium text-slate-500">Recommended Next Action</p>
        <p className="mt-1 text-sm leading-6 text-slate-800">{nextAction}</p>
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
