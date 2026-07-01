import { interviewModule } from "@/modules/interview";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuInterviewsPage(): JSX.Element {
  return <FeishuModulePage module={interviewModule} />;
}
