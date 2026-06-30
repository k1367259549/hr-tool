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
  rangeLabel: string;
};

export function DashboardTrendChart({
  items,
  rangeLabel
}: DashboardTrendChartProps): JSX.Element {
  return (
    <SectionCard
      title="趋势图"
      description={`${rangeLabel} 的每日招聘活动趋势。`}
    >
      {items.length === 0 ? (
        <EmptyState
          title="暂无趋势数据"
          description="创建每日记录后即可生成招聘趋势数据。"
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
                name="简历"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="screenCount"
                name="筛选"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="phoneCount"
                name="电话沟通"
                stroke="#0891b2"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="interviewCount"
                name="面试"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="offerCount"
                name="Offer"
                stroke="#c2410c"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="entryCount"
                name="入职"
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
