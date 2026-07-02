import { offerModule } from "@/modules/offer";
import { FeishuModulePage } from "@/modules/feishu/components/FeishuModulePage";

export default function FeishuOffersPage(): JSX.Element {
  return <FeishuModulePage module={offerModule} />;
}
