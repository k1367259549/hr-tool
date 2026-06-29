import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  actions,
  children
}: SectionCardProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      {title || description || actions ? (
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold text-slate-950">{title}</h2> : null}
            {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
