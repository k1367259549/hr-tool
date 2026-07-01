import { candidateModule } from "@/modules/candidate";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuCandidatesPage(): JSX.Element {
  return <FeishuModulePage module={candidateModule} />;
}
