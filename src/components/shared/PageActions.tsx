import type { ReactNode } from "react";

type PageActionsAlign = "start" | "end" | "between";

type PageActionsProps = {
  children: ReactNode;
  align?: PageActionsAlign;
};

const alignClasses: Record<PageActionsAlign, string> = {
  start: "justify-start",
  end: "justify-end",
  between: "justify-between"
};

export function PageActions({ children, align = "end" }: PageActionsProps): JSX.Element {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${alignClasses[align]}`}>{children}</div>
  );
}
