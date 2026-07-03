import { EvaluationDetailPage } from "@/features/evaluation-result/components/EvaluationDetailPage";

type FeishuEvaluationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeishuEvaluationDetailPage({
  params
}: FeishuEvaluationDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return <EvaluationDetailPage evaluationId={id} />;
}
