import { AlertTriangle } from "lucide-react";
import { BRANDS_CONFIG } from "@/lib/constants";
import type { BrandFreshness } from "@/lib/types";

interface DataFreshnessBannerProps {
  freshness: Record<string, BrandFreshness>;
}

function formatStaleSources(f: BrandFreshness): string {
  const parts: string[] = [];
  if (!f.latest_campaign) parts.push("campaigns: none");
  else parts.push(`campaigns: ${f.latest_campaign}`);
  if (!f.latest_sales) parts.push("sales: none");
  else parts.push(`sales: ${f.latest_sales}`);
  return parts.join(", ");
}

export function DataFreshnessBanner({ freshness }: DataFreshnessBannerProps) {
  const issues = Object.entries(freshness).filter(
    ([, f]) => f.status !== "ok"
  );

  if (issues.length === 0) return null;

  const stale = issues.filter(([, f]) => f.status === "stale");
  const partial = issues.filter(([, f]) => f.status === "partial");
  const missing = issues.filter(([, f]) => f.status === "missing");

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Some brand data may be incomplete</p>
          {stale.length > 0 && (
            <p>
              <span className="font-medium">Stale data:</span>{" "}
              {stale.map(([key, f]) => {
                const name = BRANDS_CONFIG[key]?.display_name ?? key;
                return `${name} (${formatStaleSources(f)})`;
              }).join(", ")}
            </p>
          )}
          {partial.length > 0 && (
            <p>
              <span className="font-medium">Partial data:</span>{" "}
              {partial.map(([key, f]) => {
                const name = BRANDS_CONFIG[key]?.display_name ?? key;
                return `${name} (${formatStaleSources(f)})`;
              }).join(", ")}
            </p>
          )}
          {missing.length > 0 && (
            <p>
              <span className="font-medium">No data found:</span>{" "}
              {missing.map(([key]) => BRANDS_CONFIG[key]?.display_name ?? key).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BrandFreshnessBannerProps {
  freshness: BrandFreshness;
  brandName: string;
}

export function BrandFreshnessBanner({ freshness, brandName }: BrandFreshnessBannerProps) {
  if (freshness.status === "ok") return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          {freshness.status === "missing" ? (
            <><span className="font-medium">No data found</span> for {brandName}. The database may not have synced yet.</>
          ) : freshness.status === "partial" ? (
            <><span className="font-medium">Partial data</span> for {brandName} — {formatStaleSources(freshness)}.</>
          ) : (
            <><span className="font-medium">Stale data</span> for {brandName} — {formatStaleSources(freshness)}.</>
          )}
        </p>
      </div>
    </div>
  );
}
