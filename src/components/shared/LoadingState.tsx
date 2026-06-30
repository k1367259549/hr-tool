type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function LoadingState({
  title = "正在加载",
  description = "内容准备中，请稍候。",
  className = ""
}: LoadingStateProps): JSX.Element {
  return (
    <section
      className={`flex min-h-40 items-center justify-center rounded-md border border-slate-200 bg-white p-8 text-center ${className}`}
      aria-busy="true"
    >
      <div className="space-y-3">
        <div className="mx-auto size-8 rounded-full border-2 border-slate-200 border-t-slate-950 motion-safe:animate-spin" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </section>
  );
}
