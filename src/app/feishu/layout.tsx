import type { ReactNode } from "react";
import { FeishuShell } from "@/modules/feishu/components/FeishuShell";

export default function FeishuLayout({
  children
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return <FeishuShell>{children}</FeishuShell>;
}
