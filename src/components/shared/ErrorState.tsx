import type { ReactNode } from "react";

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  action?: ReactNode;
  className?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "出错了",
  message = "请稍后重试。",
  actionLabel,
  action,
  className = "",
  onAction
}: ErrorStateProps): JSX.Element {
  const resolvedAction =
    action ??
    (actionLabel && onAction ? (
      <button
        type="button"
        className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    ) : null);

  return (
    <section
      className={`rounded-md border border-rose-200 bg-rose-50 p-4 ${className}`}
      role="alert"
    >
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-rose-950">{title}</h2>
        <p className="text-sm leading-6 text-rose-700">{message}</p>
      </div>
      {resolvedAction ? <div className="mt-4">{resolvedAction}</div> : null}
    </section>
  );
}
