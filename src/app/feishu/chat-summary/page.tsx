import { chatSummaryModule } from "@/modules/chat-summary";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuChatSummaryPage(): JSX.Element {
  return <FeishuModulePage module={chatSummaryModule} />;
}
