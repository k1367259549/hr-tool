import Link from "next/link";

type NavigationItem = {
  label: string;
  href: string;
  marker: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "仪表盘",
    href: "/dashboard",
    marker: "D"
  },
  {
    label: "每日记录",
    href: "/log",
    marker: "L"
  },
  {
    label: "表格分析",
    href: "/upload",
    marker: "U"
  },
  {
    label: "AI 复盘",
    href: "/review",
    marker: "R"
  },
  {
    label: "明日计划",
    href: "/planner",
    marker: "P"
  },
  {
    label: "知识库",
    href: "/knowledge",
    marker: "K"
  },
  {
    label: "全局搜索",
    href: "/search",
    marker: "F"
  },
  {
    label: "设置",
    href: "/settings",
    marker: "S"
  },
  {
    label: "飞书 V2",
    href: "/feishu",
    marker: "V2"
  }
];

export function Sidebar(): JSX.Element {
  return (
    <aside className="flex w-full min-w-0 shrink-0 flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-slate-200 px-5 py-4 md:py-5">
        <Link href="/" className="block">
          <span className="text-base font-semibold text-slate-950">HR Daily AI</span>
          <span className="mt-1 block text-xs text-slate-500">招聘工作台</span>
        </Link>
      </div>
      <nav
        className="flex min-w-0 max-w-full gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-x-visible md:py-4"
        aria-label="主导航"
      >
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              {item.marker}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
