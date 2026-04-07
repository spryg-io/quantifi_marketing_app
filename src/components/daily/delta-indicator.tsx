import { formatDeltaPercent, cn } from "@/lib/utils";

interface DeltaIndicatorProps {
  current: number;
  previous: number;
  invertColor?: boolean;
  className?: string;
}

export function DeltaIndicator({ current, previous, invertColor, className }: DeltaIndicatorProps) {
  const label = formatDeltaPercent(current, previous);
  if (label === null) return null;

  if (label === "new") {
    return <span className={cn("text-[11px] text-blue-500", className)}>new</span>;
  }

  const diff = current - previous;
  if (diff === 0) {
    return <span className={cn("text-[11px] text-slate-400", className)}>&mdash;</span>;
  }

  const isUp = diff > 0;
  const arrow = isUp ? "\u2191" : "\u2193";
  const isGood = invertColor ? !isUp : isUp;

  return (
    <span className={cn("text-[11px] font-medium", isGood ? "text-green-600" : "text-red-500", className)}>
      {arrow} {label}
    </span>
  );
}

export function InlineDelta({ current, previous, invertColor }: Omit<DeltaIndicatorProps, "className">) {
  const label = formatDeltaPercent(current, previous);
  if (label === null) return null;

  if (label === "new") {
    return <span className="text-[10px] text-blue-500 ml-1">new</span>;
  }

  const diff = current - previous;
  if (diff === 0) return null;

  const isUp = diff > 0;
  const arrow = isUp ? "\u2191" : "\u2193";
  const isGood = invertColor ? !isUp : isUp;

  return (
    <span className={cn("text-[10px] font-medium ml-1", isGood ? "text-green-600" : "text-red-500")}>
      {arrow}{label}
    </span>
  );
}
