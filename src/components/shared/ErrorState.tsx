import type { ReactNode } from "react";

type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  action
}: ErrorStateProps): JSX.Element {
  return (
    <section className="rounded-md border border-rose-200 bg-rose-50 p-4" role="alert">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-rose-950">{title}</h2>
        <p className="text-sm leading-6 text-rose-700">{message}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
