import type {
  DashboardFunnelStageView,
  DashboardKpiSummary,
  DashboardMetricCardView,
  DashboardRangeOptionView,
  DashboardRangeSummaryView,
  DashboardTimeRange,
  DashboardTrendItem
} from "@/types/dashboard";

type MetricDefinition = {
  id: keyof Omit<DashboardKpiSummary, "logCount">;
  title: string;
  description: string;
  format: "number" | "rate";
  tone: "neutral" | "success" | "warning" | "danger";
};

const metricDefinitions: MetricDefinition[] = [
  {
    id: "resumeCount",
    title: "简历数",
    description: "收到的简历总数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "screenCount",
    title: "筛选数",
    description: "已筛选的候选人数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "phoneCount",
    title: "电话沟通数",
    description: "已完成的电话沟通次数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "interviewCount",
    title: "面试数",
    description: "已完成的面试次数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "offerCount",
    title: "Offer 数",
    description: "已发出的 Offer 数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "entryCount",
    title: "入职数",
    description: "已完成的入职人数。",
    format: "number",
    tone: "neutral"
  },
  {
    id: "screenRate",
    title: "筛选率",
    description: "筛选数 / 简历数。",
    format: "rate",
    tone: "success"
  },
  {
    id: "interviewRate",
    title: "面试率",
    description: "面试数 / 筛选数。",
    format: "rate",
    tone: "success"
  },
  {
    id: "offerRate",
    title: "Offer 率",
    description: "Offer 数 / 面试数。",
    format: "rate",
    tone: "warning"
  },
  {
    id: "entryRate",
    title: "入职率",
    description: "入职数 / Offer 数。",
    format: "rate",
    tone: "warning"
  }
];

const rangeLabels: Record<
  DashboardTimeRange,
  {
    title: string;
    description: string;
  }
> = {
  today: {
    title: "今日汇总",
    description: "当前 UTC 日期的招聘表现。"
  },
  week: {
    title: "本周汇总",
    description: "当前 UTC 周的招聘表现。"
  },
  month: {
    title: "本月汇总",
    description: "当前 UTC 月的招聘表现。"
  },
  all: {
    title: "全部汇总",
    description: "所有已保存的招聘记录。"
  }
};

const rangeOrder: DashboardTimeRange[] = ["today", "week", "month", "all"];

const numberFormatter = new Intl.NumberFormat("zh-CN");
const rateFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
  style: "percent"
});

export function createRangeSummaryView(
  range: DashboardTimeRange,
  summary: DashboardKpiSummary
): DashboardRangeSummaryView {
  return {
    id: range,
    title: rangeLabels[range].title,
    description: rangeLabels[range].description,
    logCountLabel: `${formatNumber(summary.logCount)} 条记录`,
    metrics: metricDefinitions.map((definition) => createMetricCardView(definition, summary))
  };
}

export function createRangeOptions(
  summary: Record<DashboardTimeRange, DashboardKpiSummary>
): DashboardRangeOptionView[] {
  return rangeOrder.map((range) => ({
    id: range,
    label: rangeLabels[range].title.replace("汇总", ""),
    description: rangeLabels[range].description,
    logCountLabel: `${formatNumber(summary[range].logCount)} 条记录`
  }));
}

export function createFunnelStages(summary: DashboardKpiSummary): DashboardFunnelStageView[] {
  const maxValue = Math.max(summary.resumeCount, 1);

  return [
    createFunnelStage("resume", "简历", summary.resumeCount, "基准", "100%", maxValue),
    createFunnelStage("screen", "筛选", summary.screenCount, formatRate(summary.screenRate), formatPreviousStageRate(summary.screenCount, summary.resumeCount), maxValue),
    createFunnelStage("phone", "电话沟通", summary.phoneCount, "沟通", formatPreviousStageRate(summary.phoneCount, summary.screenCount), maxValue),
    createFunnelStage("interview", "面试", summary.interviewCount, formatRate(summary.interviewRate), formatPreviousStageRate(summary.interviewCount, summary.phoneCount), maxValue),
    createFunnelStage("offer", "Offer", summary.offerCount, formatRate(summary.offerRate), formatPreviousStageRate(summary.offerCount, summary.interviewCount), maxValue),
    createFunnelStage("entry", "入职", summary.entryCount, formatRate(summary.entryRate), formatPreviousStageRate(summary.entryCount, summary.offerCount), maxValue)
  ];
}

export function filterTrendItems(
  items: DashboardTrendItem[],
  range: DashboardTimeRange
): DashboardTrendItem[] {
  if (range === "all") {
    return items;
  }

  const rangeBounds = getUtcRangeBounds(range, new Date());

  return items.filter((item) => {
    const itemDate = new Date(`${item.date}T00:00:00.000Z`);

    return itemDate >= rangeBounds.startDate && itemDate < rangeBounds.endDate;
  });
}

function createMetricCardView(
  definition: MetricDefinition,
  summary: DashboardKpiSummary
): DashboardMetricCardView {
  const rawValue = summary[definition.id];

  return {
    id: definition.id,
    title: definition.title,
    value: definition.format === "rate" ? formatRate(rawValue) : formatNumber(rawValue),
    description: definition.description,
    footer:
      definition.format === "rate"
        ? `${formatNumber(Math.round(rawValue * 1000) / 10)} 个百分点`
        : "数量",
    tone: definition.tone
  };
}

function createFunnelStage(
  id: string,
  label: string,
  value: number,
  rateLabel: string,
  previousRateLabel: string,
  maxValue: number
): DashboardFunnelStageView {
  return {
    id,
    label,
    value,
    valueLabel: formatNumber(value),
    rateLabel,
    previousRateLabel,
    maxValue
  };
}

function getUtcRangeBounds(
  range: Exclude<DashboardTimeRange, "all">,
  referenceDate: Date
): { startDate: Date; endDate: Date } {
  const todayStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  if (range === "today") {
    const endDate = new Date(todayStart);
    endDate.setUTCDate(todayStart.getUTCDate() + 1);

    return {
      startDate: todayStart,
      endDate
    };
  }

  if (range === "week") {
    const dayOfWeek = todayStart.getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(todayStart);
    startDate.setUTCDate(todayStart.getUTCDate() - daysFromMonday);
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 7);

    return {
      startDate,
      endDate
    };
  }

  return {
    startDate: new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1)),
    endDate: new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1))
  };
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatRate(value: number): string {
  return rateFormatter.format(value);
}

function formatPreviousStageRate(value: number, previousValue: number): string {
  if (previousValue === 0) {
    return "较上一阶段 0%";
  }

  return `较上一阶段 ${formatRate(value / previousValue)}`;
}
