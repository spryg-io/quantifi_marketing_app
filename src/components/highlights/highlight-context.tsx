"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { HighlightMap } from "@/lib/types";

interface HighlightContextValue {
  highlights: HighlightMap;
  setHighlight: (cellKey: string, color: string) => void;
  clearHighlight: (cellKey: string) => void;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function useHighlights(): HighlightContextValue {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error("useHighlights must be used within a HighlightProvider");
  return ctx;
}

interface HighlightProviderProps {
  page: string;
  contextDate: string;
  children: React.ReactNode;
}

export function HighlightProvider({ page, contextDate, children }: HighlightProviderProps) {
  const [highlights, setHighlights] = useState<HighlightMap>({});

  useEffect(() => {
    if (!page || !contextDate) return;
    fetch(`/api/highlights?page=${page}&context_date=${contextDate}`)
      .then((r) => r.json())
      .then((data) => setHighlights(data.highlights || {}))
      .catch(() => {});
  }, [page, contextDate]);

  const setHighlight = useCallback(
    (cellKey: string, color: string) => {
      setHighlights((prev) => ({ ...prev, [cellKey]: color }));
      fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, context_date: contextDate, cell_key: cellKey, color }),
      }).catch(() => {});
    },
    [page, contextDate]
  );

  const clearHighlight = useCallback(
    (cellKey: string) => {
      setHighlights((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
      fetch("/api/highlights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, context_date: contextDate, cell_key: cellKey }),
      }).catch(() => {});
    },
    [page, contextDate]
  );

  return (
    <HighlightContext.Provider value={{ highlights, setHighlight, clearHighlight }}>
      {children}
    </HighlightContext.Provider>
  );
}
