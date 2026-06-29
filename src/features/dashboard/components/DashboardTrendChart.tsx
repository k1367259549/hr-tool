"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { DashboardTrendItem } from "@/types/dashboard";

type DashboardTrendChartProps = {
  items: DashboardTrendItem[];
};

export function DashboardTrendChart({ items }: DashboardTrendChartProps): JSX.Element {
  return (
    <SectionCard
      title="Simple Trend Chart"
      description="Recent daily recruiting activity from saved logs."
    >
      {items.length === 0 ? (
        <EmptyState
          title="No trend data"
          description="Create daily logs to populate recruiting trend data."
          className="min-h-72"
        />
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={items} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="resumeCount"
                name="Resumes"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="screenCount"
                name="Screens"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="interviewCount"
                name="Interviews"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="offerCount"
                name="Offers"
                stroke="#c2410c"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="entryCount"
                name="Entries"
                stroke="#15803d"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
