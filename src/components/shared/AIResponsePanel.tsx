import type { ReactNode } from "react";

type AIResponsePanelProps = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

export function AIResponsePanel({
  children,
  description,
  error,
  isLoading = false,
  onRetry,
  title
}: AIResponsePanelProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {isLoading ? (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            AI 生成中
          </span>
        ) : null}
      </div>
      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 p-4">
          <p className="text-sm leading-6 text-rose-700">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              重试
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
