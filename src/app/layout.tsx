import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { I18nProvider } from "@/hooks/useI18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Daily AI",
  description: "AI 辅助招聘运营系统"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <ErrorBoundary>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </ErrorBoundary>
        </I18nProvider>
      </body>
    </html>
  );
}
