"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BrandCampaignBreakdown } from "@/lib/types";

interface CampaignBreakdownProps {
  data: BrandCampaignBreakdown[];
}

export function CampaignBreakdown({ data }: CampaignBreakdownProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) =>
              `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            }
          />
          <Legend />
          <Bar dataKey="spend" fill="#2563eb" name="Spend" />
          <Bar dataKey="sales" fill="#16a34a" name="Ad Sales" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
