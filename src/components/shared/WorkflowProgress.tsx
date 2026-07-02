import Link from "next/link";
import type {
  RecruiterWorkspaceWorkflowProgressItem,
  RecruiterWorkspaceWorkflowStatus
} from "@/types/recruiterWorkspace";

const statusLabels: Record<RecruiterWorkspaceWorkflowStatus, string> = {
  COMPLETED: "已完成",
  IN_PROGRESS: "进行中",
  NEEDS_REVIEW: "待 Review",
  NOT_STARTED: "未开始"
};

const statusMarks: Record<RecruiterWorkspaceWorkflowStatus, string> = {
  COMPLETED: "✓",
  IN_PROGRESS: "…",
  NEEDS_REVIEW: "!",
  NOT_STARTED: "○"
};

export function WorkflowProgress({
  items
}: {
  items: RecruiterWorkspaceWorkflowProgressItem[];
}): JSX.Element {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.workflow}
          href={item.href}
          className="rounded-md border border-slate-200 bg-slate-50 p-3 hover:bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{statusLabels[item.status]}</p>
            </div>
            <span className={getMarkClassName(item.status)}>{statusMarks[item.status]}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">{item.nextAction}</p>
        </Link>
      ))}
    </div>
  );
}

function getMarkClassName(status: RecruiterWorkspaceWorkflowStatus): string {
  if (status === "COMPLETED") {
    return "rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700";
  }

  if (status === "NEEDS_REVIEW") {
    return "rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700";
  }

  if (status === "IN_PROGRESS") {
    return "rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700";
  }

  return "rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500";
}
