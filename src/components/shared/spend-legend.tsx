export function SpendLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-slate-500">
      <span className="text-slate-400 font-medium">Spend vs Sales:</span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-sm bg-green-400" />
        &le;15%
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />
        15–25%
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
        &gt;25%
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300" />
        No data
      </span>
    </div>
  );
}
