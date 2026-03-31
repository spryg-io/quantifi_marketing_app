"use client";

import { useState, useCallback } from "react";
import { useHighlights } from "./highlight-context";
import { ColorPickerPopover } from "./color-picker-popover";
import { cn } from "@/lib/utils";

interface HighlightableMetricProps {
  cellKey: string;
  label: string;
  value: string;
  subtle?: boolean;
}

export function HighlightableMetric({ cellKey, label, value, subtle }: HighlightableMetricProps) {
  const { highlights, setHighlight, clearHighlight } = useHighlights();
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null);

  const color = highlights[cellKey];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPicker({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      className={cn("px-3 py-2.5", subtle && "py-2")}
      style={color ? { backgroundColor: color } : undefined}
      onContextMenu={handleContextMenu}
    >
      <p className={cn("text-sm text-slate-500", subtle && "text-xs")}>{label}</p>
      <p className={cn("font-semibold tabular-nums mt-0.5", subtle ? "text-base text-slate-600" : "text-lg")}>
        {value}
      </p>
      {picker && (
        <ColorPickerPopover
          x={picker.x}
          y={picker.y}
          currentColor={color}
          onSelect={(c) => {
            setHighlight(cellKey, c);
            setPicker(null);
          }}
          onClear={() => {
            clearHighlight(cellKey);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
