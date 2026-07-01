import { feishuSettingsModule } from "@/modules/feishu";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuSettingsPage(): JSX.Element {
  return <FeishuModulePage module={feishuSettingsModule} />;
}
