"use client";

import { useState, useCallback } from "react";
import { useHighlights } from "./highlight-context";
import { useOverrides } from "@/components/overrides/override-context";
import { ColorPickerPopover } from "./color-picker-popover";

interface HighlightableCellProps {
  cellKey: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  editable?: boolean;
  currentValue?: number;
}

export function HighlightableCell({ cellKey, className, children, style, editable, currentValue }: HighlightableCellProps) {
  const { highlights, setHighlight, clearHighlight } = useHighlights();
  const { overrides, setOverride, clearOverride } = useOverrides();
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null);

  const color = highlights[cellKey];
  const isOverridden = cellKey in overrides;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPicker({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <td
      className={`${className || ""}${isOverridden ? " text-blue-600" : ""}`}
      style={{ ...style, backgroundColor: color || style?.backgroundColor }}
      onContextMenu={handleContextMenu}
    >
      {children}
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
          editable={editable}
          currentValue={currentValue}
          isOverridden={isOverridden}
          onEditValue={(value) => setOverride(cellKey, value)}
          onRevertValue={() => clearOverride(cellKey)}
        />
      )}
    </td>
  );
}
