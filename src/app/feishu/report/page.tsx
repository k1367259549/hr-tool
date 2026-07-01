import { reportModule } from "@/modules/report";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuReportPage(): JSX.Element {
  return <FeishuModulePage module={reportModule} />;
}
