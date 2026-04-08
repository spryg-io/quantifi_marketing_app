"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { OverrideMap } from "@/lib/types";

interface OverrideContextValue {
  overrides: OverrideMap;
  setOverride: (cellKey: string, value: number) => void;
  clearOverride: (cellKey: string) => void;
}

const OverrideContext = createContext<OverrideContextValue | null>(null);

const EMPTY_OVERRIDES: OverrideMap = {};
const noop = () => {};
const defaultValue: OverrideContextValue = { overrides: EMPTY_OVERRIDES, setOverride: noop, clearOverride: noop };

export function useOverrides(): OverrideContextValue {
  const ctx = useContext(OverrideContext);
  return ctx ?? defaultValue;
}

interface OverrideProviderProps {
  page: string;
  contextDate: string;
  children: React.ReactNode;
}

export function OverrideProvider({ page, contextDate, children }: OverrideProviderProps) {
  const [overrides, setOverrides] = useState<OverrideMap>({});

  useEffect(() => {
    if (!page || !contextDate) return;
    fetch(`/api/overrides?page=${page}&context_date=${contextDate}`)
      .then((r) => r.json())
      .then((data) => setOverrides(data.overrides || {}))
      .catch(() => {});
  }, [page, contextDate]);

  const setOverride = useCallback(
    (cellKey: string, value: number) => {
      setOverrides((prev) => ({ ...prev, [cellKey]: value }));
      fetch("/api/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, context_date: contextDate, cell_key: cellKey, value }),
      }).catch(() => {});
    },
    [page, contextDate]
  );

  const clearOverride = useCallback(
    (cellKey: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
      fetch("/api/overrides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, context_date: contextDate, cell_key: cellKey }),
      }).catch(() => {});
    },
    [page, contextDate]
  );

  return (
    <OverrideContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </OverrideContext.Provider>
  );
}
