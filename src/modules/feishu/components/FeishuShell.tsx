"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { feishuModules } from "@/modules/feishu";

type FeishuShellProps = {
  children: ReactNode;
};

export function FeishuShell({ children }: FeishuShellProps): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Feishu Recruiting AI V2
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">飞书招聘工作区</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              AI Recruiter V2 工作流入口。
            </p>
          </div>
          <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible" aria-label="飞书 V2 导航">
            {feishuModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className={`flex min-w-fit items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-950 ${
                  isActiveModule(pathname, module.href)
                    ? "bg-slate-950 text-white hover:bg-slate-900 hover:text-white"
                    : "text-slate-700"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                    isActiveModule(pathname, module.href)
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {module.marker}
                </span>
                {module.title}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function isActiveModule(pathname: string, href: string): boolean {
  if (href === "/feishu") {
    return pathname === "/feishu";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
