import { pipelineModule } from "@/modules/pipeline";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuPipelinePage(): JSX.Element {
  return <FeishuModulePage module={pipelineModule} />;
}
