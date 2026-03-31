"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, startOfMonth, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/brand/trend-chart";
import { CampaignBreakdown } from "@/components/brand/campaign-breakdown";
import { MetricsGrid } from "@/components/brand/metrics-grid";
import { BRANDS_CONFIG, ALL_BRANDS } from "@/lib/constants";
import type { BrandDetailResponse } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<BrandDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  // Initialize date range on client only to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setDateRange({
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(subDays(now, 1), "yyyy-MM-dd"),
    });
  }, []);

  const fetchData = useCallback(async (refresh = false) => {
    if (!dateRange) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/brand/${slug}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [slug, dateRange]);

  const handleRefresh = () => fetchData(true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={slug}
            onChange={(e) => router.push(`/brand/${e.target.value}`)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ALL_BRANDS.map((key) => (
              <option key={key} value={key}>
                {BRANDS_CONFIG[key]?.display_name || key}
              </option>
            ))}
          </select>
          <h2 className="text-xl font-semibold text-slate-900">
            {data?.display_name || BRANDS_CONFIG[slug]?.display_name || slug}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {dateRange ? (
            <span className="text-sm text-muted-foreground">
              {dateRange.from} to {dateRange.to}
            </span>
          ) : (
            <Skeleton className="h-5 w-48 rounded" />
          )}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={!dateRange || loading} title="Refresh data">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!dateRange || loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : data ? (
        <>
          <MetricsGrid totals={data.totals} />

          <Card>
            <CardHeader>
              <CardTitle>Daily Spend & Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={data.time_series} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignBreakdown data={data.campaign_breakdown} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
