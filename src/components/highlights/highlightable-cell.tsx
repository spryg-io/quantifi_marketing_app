"use client";

import { useState, useCallback } from "react";
import { useHighlights } from "./highlight-context";
import { ColorPickerPopover } from "./color-picker-popover";

interface HighlightableCellProps {
  cellKey: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function HighlightableCell({ cellKey, className, children, style }: HighlightableCellProps) {
  const { highlights, setHighlight, clearHighlight } = useHighlights();
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null);

  const color = highlights[cellKey];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPicker({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <td
      className={className}
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
        />
      )}
    </td>
  );
}
