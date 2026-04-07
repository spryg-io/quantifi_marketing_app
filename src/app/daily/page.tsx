"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCards } from "@/components/daily/summary-cards";
import { BrandCardsGrid } from "@/components/daily/brand-cards-grid";
import { HighlightProvider } from "@/components/highlights/highlight-context";
import { SpendLegend } from "@/components/shared/spend-legend";
import { DataFreshnessBanner } from "@/components/shared/data-freshness-banner";
import type { DailyResponse } from "@/lib/types";

export default function DailyPage() {
  const [date, setDate] = useState<Date | null>(null);
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Comparison state
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareDate, setCompareDate] = useState<Date | null>(null);
  const [compareData, setCompareData] = useState<DailyResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareCalendarOpen, setCompareCalendarOpen] = useState(false);

  // Initialize date on client only to avoid hydration mismatch
  useEffect(() => {
    setDate(subDays(new Date(), 1));
  }, []);

  const fetchData = useCallback(async (d: Date, refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(d, "yyyy-MM-dd");
      const params = new URLSearchParams({ date: dateStr });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/daily?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompareData = useCallback(async (d: Date) => {
    setCompareLoading(true);
    try {
      const dateStr = format(d, "yyyy-MM-dd");
      const res = await fetch(`/api/daily?date=${dateStr}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCompareData(json);
    } catch {
      setCompareData(null);
    } finally {
      setCompareLoading(false);
    }
  }, []);

  useEffect(() => {
    if (date) fetchData(date);
  }, [date, fetchData]);

  // When compare is enabled, set default compare date and fetch
  useEffect(() => {
    if (compareEnabled && date) {
      const cd = subDays(date, 1);
      setCompareDate(cd);
      fetchCompareData(cd);
    }
    if (!compareEnabled) {
      setCompareDate(null);
      setCompareData(null);
    }
  }, [compareEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // When primary date changes while compare is on, auto-update compare date
  useEffect(() => {
    if (compareEnabled && date) {
      const cd = subDays(date, 1);
      setCompareDate(cd);
      fetchCompareData(cd);
    }
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  // When compare date changes explicitly (user picks a different date)
  const handleCompareDateChange = (d: Date | undefined) => {
    if (!d) return;
    setCompareDate(d);
    setCompareCalendarOpen(false);
    fetchCompareData(d);
  };

  const goToPrevDay = () => setDate((d) => d ? subDays(d, 1) : null);
  const goToNextDay = () => setDate((d) => d ? addDays(d, 1) : null);
  const goToYesterday = () => setDate(subDays(new Date(), 1));
  const handleRefresh = () => { if (date) fetchData(date, true); };

  const allBrandOrder = [
    ...(data?.brand_order || []),
    ...(data?.sbl_brand_order || []),
  ];

  const showLoading = !date || loading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Daily Performance</h2>
          <SpendLegend />
          <Button
            variant={compareEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareEnabled((v) => !v)}
            className="gap-1.5"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Compare
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevDay} disabled={!date}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {date ? (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger>
                <Button variant="outline" className="min-w-[10rem]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(date, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <Calendar
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  month={date}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Skeleton className="h-9 w-[10rem] rounded-md" />
          )}

          <Button variant="outline" size="icon" onClick={goToNextDay} disabled={!date}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!date || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToYesterday}>
            Yesterday
          </Button>
        </div>
      </div>

      {/* Comparison sub-header */}
      {compareEnabled && (
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
          <span className="font-medium">Comparing to:</span>
          {compareDate ? (
            <Popover open={compareCalendarOpen} onOpenChange={setCompareCalendarOpen}>
              <PopoverTrigger>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <CalendarIcon className="h-3 w-3 mr-1.5" />
                  {format(compareDate, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <Calendar
                  selected={compareDate}
                  onSelect={handleCompareDateChange}
                  month={compareDate}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Skeleton className="h-7 w-[8rem] rounded-md" />
          )}
          {compareLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </div>
      )}

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
        <HighlightProvider page="daily" contextDate={date ? format(date, "yyyy-MM-dd") : ""}>
          {data.freshness && <DataFreshnessBanner freshness={data.freshness} />}
          <SummaryCards
            brands={data.brands}
            brandOrder={allBrandOrder}
            compareBrands={compareEnabled && !compareLoading ? compareData?.brands : undefined}
          />

          <BrandCardsGrid
            brands={data.brands}
            brandOrder={allBrandOrder}
            compareBrands={compareEnabled && !compareLoading ? compareData?.brands : undefined}
          />
        </HighlightProvider>
      ) : null}
    </div>
  );
}
