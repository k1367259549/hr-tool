import Link from "next/link";
import type { RecruiterWorkspaceWorkflowStatus } from "@/types/recruiterWorkspace";

type WorkflowNavigationLink = {
  label: string;
  href: string;
  description?: string;
};

type WorkflowNavigationCardProps = {
  currentWorkflow: string;
  currentStatus: RecruiterWorkspaceWorkflowStatus;
  previousWorkflow?: WorkflowNavigationLink;
  recommendedNextAction: WorkflowNavigationLink;
  backToWorkspaceHref?: string;
};

const statusLabels: Record<RecruiterWorkspaceWorkflowStatus, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  NEEDS_REVIEW: "Needs Review",
  NOT_STARTED: "Not Started"
};

export function WorkflowNavigationCard({
  backToWorkspaceHref = "/feishu",
  currentStatus,
  currentWorkflow,
  previousWorkflow,
  recommendedNextAction
}: WorkflowNavigationCardProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Current Workflow
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">{currentWorkflow}</h2>
          <span className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {statusLabels[currentStatus]}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
          <WorkflowLink
            title="Previous Workflow"
            link={previousWorkflow}
            fallback="从 Workspace 开始"
          />
          <WorkflowLink title="Recommended Next Action" link={recommendedNextAction} primary />
          <WorkflowLink
            title="Back To Workspace"
            link={{
              description: "返回 AI Recruiter 工作台查看今日进度。",
              href: backToWorkspaceHref,
              label: "AI Recruiter Workspace"
            }}
          />
        </div>
      </div>
    </section>
  );
}

function WorkflowLink({
  fallback,
  link,
  primary = false,
  title
}: {
  title: string;
  link?: WorkflowNavigationLink;
  fallback?: string;
  primary?: boolean;
}): JSX.Element {
  if (!link) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-3">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{fallback ?? "暂无前置 Workflow"}</p>
      </div>
    );
  }

  return (
    <Link
      href={link.href}
      className={
        primary
          ? "rounded-md border border-slate-950 bg-slate-950 p-3 text-white hover:bg-slate-800"
          : "rounded-md border border-slate-200 p-3 hover:bg-slate-50"
      }
    >
      <p className={primary ? "text-xs font-medium text-slate-200" : "text-xs font-medium text-slate-500"}>
        {title}
      </p>
      <p className={primary ? "mt-1 text-sm font-semibold text-white" : "mt-1 text-sm font-semibold text-slate-950"}>
        {link.label}
      </p>
      {link.description ? (
        <p className={primary ? "mt-1 text-xs leading-5 text-slate-200" : "mt-1 text-xs leading-5 text-slate-500"}>
          {link.description}
        </p>
      ) : null}
    </Link>
  );
}
