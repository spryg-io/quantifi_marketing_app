"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { getDefaultMonth } from "@/lib/dates";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlySummaryCards } from "@/components/monthly/monthly-summary-cards";
import { MonthlyCardsGrid } from "@/components/monthly/monthly-cards-grid";
import { HighlightProvider } from "@/components/highlights/highlight-context";
import { SpendLegend } from "@/components/shared/spend-legend";
import { DataFreshnessBanner } from "@/components/shared/data-freshness-banner";
import type { MonthlyResponse } from "@/lib/types";

export default function MonthlyPage() {
  const [monthDate, setMonthDate] = useState<Date | null>(null);
  const [data, setData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize on client only to avoid hydration mismatch
  useEffect(() => {
    setMonthDate(getDefaultMonth());
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
          {data.freshness && <DataFreshnessBanner freshness={data.freshness} />}
          <MonthlySummaryCards brandGroups={data.brand_groups} />
          <MonthlyCardsGrid brandGroups={data.brand_groups} />
        </HighlightProvider>
      ) : null}
    </div>
  );
}
