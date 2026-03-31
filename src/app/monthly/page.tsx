"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, SquareStack, LayoutGrid, Table2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlySummaryCards } from "@/components/monthly/monthly-summary-cards";
import { MonthlyCardsGrid } from "@/components/monthly/monthly-cards-grid";
import { MonthlyBrandTable } from "@/components/monthly/monthly-brand-table";
import { MonthlyTable } from "@/components/monthly/monthly-table";
import { HighlightProvider } from "@/components/highlights/highlight-context";
import { SpendLegend } from "@/components/shared/spend-legend";
import type { MonthlyResponse } from "@/lib/types";

type ViewMode = "cards" | "summary" | "spreadsheet";

export default function MonthlyPage() {
  const [monthDate, setMonthDate] = useState<Date | null>(null);
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Initialize on client only to avoid hydration mismatch
  useEffect(() => {
    setMonthDate(new Date());
  }, []);

  const fetchData = useCallback(async (d: Date, refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const monthStr = format(d, "yyyy-MM");
      const params = new URLSearchParams({ month: monthStr });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/monthly?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (monthDate) fetchData(monthDate);
  }, [monthDate, fetchData]);

  const goToPrevMonth = () => setMonthDate((d) => d ? subMonths(d, 1) : null);
  const goToNextMonth = () => setMonthDate((d) => d ? addMonths(d, 1) : null);
  const goToThisMonth = () => setMonthDate(new Date());
  const handleRefresh = () => { if (monthDate) fetchData(monthDate, true); };

  const showLoading = !monthDate || loading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Monthly Summary</h2>
          <SpendLegend />
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md overflow-hidden mr-2">
            <ViewToggle active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={SquareStack} label="Cards" />
            <ViewToggle active={viewMode === "summary"} onClick={() => setViewMode("summary")} icon={LayoutGrid} label="Summary" border />
            <ViewToggle active={viewMode === "spreadsheet"} onClick={() => setViewMode("spreadsheet")} icon={Table2} label="Spreadsheet" border />
          </div>

          <Button variant="outline" size="icon" onClick={goToPrevMonth} disabled={!monthDate}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {monthDate ? (
            <span className="text-sm font-medium min-w-[10rem] text-center">
              {format(monthDate, "MMMM yyyy")}
            </span>
          ) : (
            <Skeleton className="h-5 w-[10rem] rounded" />
          )}
          <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={!monthDate}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!monthDate || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToThisMonth}>
            This Month
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-lg" />
        </div>
      ) : data ? (
        <HighlightProvider page="monthly" contextDate={monthDate ? format(monthDate, "yyyy-MM") : ""}>
          <MonthlySummaryCards brandGroups={data.brand_groups} />

          {viewMode === "cards" && (
            <MonthlyCardsGrid brandGroups={data.brand_groups} />
          )}
          {viewMode === "summary" && (
            <MonthlyBrandTable brandGroups={data.brand_groups} />
          )}
          {viewMode === "spreadsheet" && (
            <MonthlyTable brandGroups={data.brand_groups} />
          )}
        </HighlightProvider>
      ) : null}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
  border,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  border?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
        border ? "border-l " : ""
      }${
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
