"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, Table2, SquareStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCards } from "@/components/daily/summary-cards";
import { BrandSummaryTable } from "@/components/daily/brand-summary-table";
import { DailyTable } from "@/components/daily/daily-table";
import { BrandCardsGrid } from "@/components/daily/brand-cards-grid";
import type { DailyResponse } from "@/lib/types";

type ViewMode = "summary" | "cards" | "spreadsheet";

export default function DailyPage() {
  const [date, setDate] = useState<Date | null>(null);
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Initialize date on client only to avoid hydration mismatch
  useEffect(() => {
    setDate(subDays(new Date(), 1));
  }, []);

  const fetchData = useCallback(async (d: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(d, "yyyy-MM-dd");
      const res = await fetch(`/api/daily?date=${dateStr}`);
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
    if (date) fetchData(date);
  }, [date, fetchData]);

  const goToPrevDay = () => setDate((d) => d ? subDays(d, 1) : null);
  const goToNextDay = () => setDate((d) => d ? addDays(d, 1) : null);
  const goToYesterday = () => setDate(subDays(new Date(), 1));

  const allBrandOrder = [
    ...(data?.brand_order || []),
    ...(data?.sbl_brand_order || []),
  ];

  const showLoading = !date || loading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Daily Performance</h2>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md overflow-hidden mr-2">
            <ViewToggle active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={SquareStack} label="Cards" />
            <ViewToggle active={viewMode === "summary"} onClick={() => setViewMode("summary")} icon={LayoutGrid} label="Summary" border />
            <ViewToggle active={viewMode === "spreadsheet"} onClick={() => setViewMode("spreadsheet")} icon={Table2} label="Spreadsheet" border />
          </div>

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

          <Button variant="secondary" size="sm" onClick={goToYesterday}>
            Yesterday
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
        <>
          <SummaryCards brands={data.brands} brandOrder={allBrandOrder} />

          {viewMode === "summary" && (
            <BrandSummaryTable
              brands={data.brands}
              brandOrder={allBrandOrder}
            />
          )}
          {viewMode === "cards" && (
            <BrandCardsGrid
              brands={data.brands}
              brandOrder={allBrandOrder}
            />
          )}
          {viewMode === "spreadsheet" && (
            <DailyTable
              brands={data.brands}
              brandOrder={allBrandOrder}
              rowLabels={data.row_labels}
            />
          )}
        </>
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
