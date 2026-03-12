"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const COLORS = [
  { name: "Red", hex: "#f4cccc" },
  { name: "Orange", hex: "#fce5cd" },
  { name: "Yellow", hex: "#fff2cc" },
  { name: "Green", hex: "#d9ead3" },
  { name: "Cyan", hex: "#d0e0e3" },
  { name: "Blue", hex: "#c9daf8" },
  { name: "Purple", hex: "#d9d2e9" },
  { name: "Pink", hex: "#ead1dc" },
];

interface ColorPickerPopoverProps {
  x: number;
  y: number;
  onSelect: (color: string) => void;
  onClear: () => void;
  onClose: () => void;
  currentColor?: string;
}

export function ColorPickerPopover({
  x,
  y,
  onSelect,
  onClear,
  onClose,
  currentColor,
}: ColorPickerPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 9999,
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 w-[180px]"
    >
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider px-1 mb-1.5">
        Highlight
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c.hex}
            title={c.name}
            onClick={() => onSelect(c.hex)}
            className="w-8 h-8 rounded border border-slate-200 hover:scale-110 transition-transform"
            style={{
              backgroundColor: c.hex,
              outline: currentColor === c.hex ? "2px solid #334155" : "none",
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
      {currentColor && (
        <button
          onClick={onClear}
          className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
        >
          Clear highlight
        </button>
      )}
    </div>,
    document.body
  );
}
