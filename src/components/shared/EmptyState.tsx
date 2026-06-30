import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title = "暂无数据",
  description = "当前还没有可展示的内容。",
  action,
  className = ""
}: EmptyStateProps): JSX.Element {
  return (
    <section
      className={`flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center ${className}`}
    >
      <div className="max-w-lg space-y-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </section>
  );
}
