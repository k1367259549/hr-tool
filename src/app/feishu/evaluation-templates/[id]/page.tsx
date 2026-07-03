import { EvaluationTemplateDetailPage } from "@/features/evaluation-template/components/EvaluationTemplateDetailPage";

type EvaluationTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeishuEvaluationTemplateDetailPage({
  params
}: EvaluationTemplatePageProps): Promise<JSX.Element> {
  const { id } = await params;

  return <EvaluationTemplateDetailPage templateId={id} />;
}
