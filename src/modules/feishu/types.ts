export type FeishuModuleDefinition = {
  title: string;
  href: string;
  marker: string;
  description: string;
  placeholder: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  nextSteps: string[];
};
