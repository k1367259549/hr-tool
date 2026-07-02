import { CandidateDetailPage } from "@/features/candidate-crm/components/CandidateDetailPage";

type FeishuCandidateDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeishuCandidateDetailPage({
  params
}: FeishuCandidateDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return <CandidateDetailPage candidateId={id} />;
}
