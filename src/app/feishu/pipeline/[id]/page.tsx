import { ApplicationDetailPage } from "@/features/pipeline/components/ApplicationDetailPage";

type FeishuPipelineDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeishuPipelineDetailPage({
  params
}: FeishuPipelineDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return <ApplicationDetailPage applicationId={id} />;
}
