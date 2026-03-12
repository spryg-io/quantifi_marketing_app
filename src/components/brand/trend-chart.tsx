"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BrandTimeSeriesPoint } from "@/lib/types";

interface TrendChartProps {
  data: BrandTimeSeriesPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={formatted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) =>
              `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="spend"
            stroke="#2563eb"
            name="Spend"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="total_sales"
            stroke="#16a34a"
            name="Total Sales"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#9333ea"
            name="Ad Sales"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
