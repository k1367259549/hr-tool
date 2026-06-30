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
    title: "Resume Count",
    description: "Total resumes received.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "screenCount",
    title: "Screen Count",
    description: "Candidates screened.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "phoneCount",
    title: "Phone Count",
    description: "Phone communications completed.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "interviewCount",
    title: "Interview Count",
    description: "Interviews completed.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "offerCount",
    title: "Offer Count",
    description: "Offers sent.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "entryCount",
    title: "Entry Count",
    description: "Entries completed.",
    format: "number",
    tone: "neutral"
  },
  {
    id: "screenRate",
    title: "Screen Rate",
    description: "Screened resumes divided by resumes.",
    format: "rate",
    tone: "success"
  },
  {
    id: "interviewRate",
    title: "Interview Rate",
    description: "Interviews divided by screened candidates.",
    format: "rate",
    tone: "success"
  },
  {
    id: "offerRate",
    title: "Offer Rate",
    description: "Offers divided by interviews.",
    format: "rate",
    tone: "warning"
  },
  {
    id: "entryRate",
    title: "Entry Rate",
    description: "Entries divided by offers.",
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
    title: "Today Summary",
    description: "Current UTC day recruiting performance."
  },
  week: {
    title: "Weekly Summary",
    description: "Current UTC week recruiting performance."
  },
  month: {
    title: "Monthly Summary",
    description: "Current UTC month recruiting performance."
  },
  all: {
    title: "All Logs Summary",
    description: "All saved recruiting logs."
  }
};

const rangeOrder: DashboardTimeRange[] = ["today", "week", "month", "all"];

const numberFormatter = new Intl.NumberFormat("en");
const rateFormatter = new Intl.NumberFormat("en", {
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
    logCountLabel: `${formatNumber(summary.logCount)} logs`,
    metrics: metricDefinitions.map((definition) => createMetricCardView(definition, summary))
  };
}

export function createRangeOptions(
  summary: Record<DashboardTimeRange, DashboardKpiSummary>
): DashboardRangeOptionView[] {
  return rangeOrder.map((range) => ({
    id: range,
    label: rangeLabels[range].title.replace(" Summary", ""),
    description: rangeLabels[range].description,
    logCountLabel: `${formatNumber(summary[range].logCount)} logs`
  }));
}

export function createFunnelStages(summary: DashboardKpiSummary): DashboardFunnelStageView[] {
  const maxValue = Math.max(summary.resumeCount, 1);

  return [
    createFunnelStage("resume", "Resume", summary.resumeCount, "Base", "100%", maxValue),
    createFunnelStage("screen", "Screen", summary.screenCount, formatRate(summary.screenRate), formatPreviousStageRate(summary.screenCount, summary.resumeCount), maxValue),
    createFunnelStage("phone", "Phone", summary.phoneCount, "Contact", formatPreviousStageRate(summary.phoneCount, summary.screenCount), maxValue),
    createFunnelStage("interview", "Interview", summary.interviewCount, formatRate(summary.interviewRate), formatPreviousStageRate(summary.interviewCount, summary.phoneCount), maxValue),
    createFunnelStage("offer", "Offer", summary.offerCount, formatRate(summary.offerRate), formatPreviousStageRate(summary.offerCount, summary.interviewCount), maxValue),
    createFunnelStage("entry", "Entry", summary.entryCount, formatRate(summary.entryRate), formatPreviousStageRate(summary.entryCount, summary.offerCount), maxValue)
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
        ? `${formatNumber(Math.round(rawValue * 1000) / 10)} percentage points`
        : "Count",
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
    return "0% from previous";
  }

  return `${formatRate(value / previousValue)} from previous`;
}
