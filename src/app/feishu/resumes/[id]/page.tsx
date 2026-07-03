import { ResumeDetailPage } from "@/features/resume-library/components/ResumeDetailPage";

type FeishuResumeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeishuResumeDetailPage({
  params
}: FeishuResumeDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return <ResumeDetailPage resumeId={id} />;
}
