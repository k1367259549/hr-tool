import Link from "next/link";

type NavigationItem = {
  label: string;
  href: string;
  marker: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    marker: "D"
  },
  {
    label: "Daily Log",
    href: "/log",
    marker: "L"
  },
  {
    label: "AI Review",
    href: "/review",
    marker: "R"
  },
  {
    label: "Tomorrow Planner",
    href: "/planner",
    marker: "P"
  },
  {
    label: "Knowledge Base",
    href: "/knowledge",
    marker: "K"
  },
  {
    label: "Search",
    href: "/search",
    marker: "F"
  },
  {
    label: "Settings",
    href: "/settings",
    marker: "S"
  }
];

export function Sidebar(): JSX.Element {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-slate-200 px-5 py-4 md:py-5">
        <Link href="/" className="block">
          <span className="text-base font-semibold text-slate-950">HR Daily AI</span>
          <span className="mt-1 block text-xs text-slate-500">Recruiting OS</span>
        </Link>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-x-visible md:py-4"
        aria-label="Primary navigation"
      >
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
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
