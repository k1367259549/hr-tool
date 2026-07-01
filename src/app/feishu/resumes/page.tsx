import { resumeModule } from "@/modules/resume";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuResumesPage(): JSX.Element {
  return <FeishuModulePage module={resumeModule} />;
}
