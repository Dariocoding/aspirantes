export default function CensoLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="border-b border-slate-200/90 px-4 py-3">
        <div className="h-3 w-56 rounded bg-slate-200" />
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="size-4 rounded bg-slate-200" />
          <div className="h-3 flex-1 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>
      ))}
      <div className="h-16 bg-slate-50" />
    </div>
  );
}
