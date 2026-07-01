"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import { useI18n, type Language } from "@/hooks/useI18n";
import type { ApiResponse } from "@/types/api";
import type { PromptStatusItem, PromptStatusResponse } from "@/types/prompt";
import type { SettingsStatus } from "@/types/settings";

export default function SettingsPage(): JSX.Element {
  const { language, setLanguage } = useI18n();
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [promptStatus, setPromptStatus] = useState<PromptStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextStatus, nextPromptStatus] = await Promise.all([
        requestApi<SettingsStatus>("/api/settings/status"),
        requestApi<PromptStatusResponse>("/api/prompts/status")
      ]);

      setStatus(nextStatus);
      setPromptStatus(nextPromptStatus);
    } catch (error) {
      setStatus(null);
      setPromptStatus(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="设置"
        description="查看只读的系统、AI、数据库和环境配置状态。"
      />

      {isLoading ? (
        <LoadingState title="正在加载设置" description="正在检查配置状态。" />
      ) : errorMessage ? (
        <ErrorState
          title="无法加载设置"
          message={errorMessage}
          actionLabel="重试"
          onAction={() => void loadStatus()}
        />
      ) : status ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <LanguageSettingsSection language={language} onLanguageChange={setLanguage} />
          <SettingsSection
            title="应用信息"
            rows={[
              createTextRow("应用名称", status.appName),
              createTextRow("版本", status.version),
              createTextRow("环境", status.environment)
            ]}
          />
          <SettingsSection
            title="AI 配置"
            rows={[
              createTextRow("AI 提供商", status.ai.provider),
              createTextRow("Base URL", status.ai.baseUrl),
              createTextRow("配置模型", status.ai.model),
              createStatusRow("API Key", status.ai.apiKeyConfigured),
              createAiStatusRow("AI 状态", status.ai.status),
              createStatusRow("提示词目录", status.ai.promptDirectoryAvailable)
            ]}
          />
          <SettingsSection
            title="数据库状态"
            rows={[
              createTextRow("数据库提供商", status.database.provider),
              createConnectionRow("连接状态", status.database.connected)
            ]}
          />
          <SettingsSection
            title="环境状态"
            rows={[
              createTextRow("NODE_ENV", status.environmentStatus.nodeEnv),
              createStatusRow("DATABASE_URL", status.environmentStatus.databaseUrlConfigured),
              createStatusRow("AI_API_KEY", status.environmentStatus.aiApiKeyConfigured),
              createStatusRow("AI_BASE_URL", status.environmentStatus.aiBaseUrlConfigured),
              createStatusRow("OPENAI_API_KEY", status.environmentStatus.openAiApiKeyConfigured),
              createStatusRow("OPENAI_BASE_URL", status.environmentStatus.openAiBaseUrlConfigured)
            ]}
          />
          <div className="xl:col-span-2">
            <SettingsSection
              title="开发者信息"
              rows={[
                createTextRow("运行时", status.developer.runtime),
                createTextRow("部署方式", status.developer.deployment),
                createTextRow("配置模式", status.developer.configurationMode)
              ]}
            />
          </div>
          {promptStatus ? (
            <div className="xl:col-span-2">
              <PromptStatusSection prompts={promptStatus.prompts} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type PromptStatusSectionProps = {
  prompts: PromptStatusItem[];
};

type LanguageSettingsSectionProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
};

const languageOptions: Array<{
  value: Language;
  label: string;
  description: string;
}> = [
  {
    value: "zh",
    label: "中文",
    description: "使用简体中文显示界面。"
  },
  {
    value: "en",
    label: "English",
    description: "Use English for the interface."
  }
];

function LanguageSettingsSection({
  language,
  onLanguageChange
}: LanguageSettingsSectionProps): JSX.Element {
  return (
    <SectionCard title="语言设置" description="只读的界面语言设置，保存在当前浏览器中。">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {languageOptions.map((option) => {
            const isSelected = option.value === language;

            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-md border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-slate-950 bg-slate-100"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => onLanguageChange(option.value)}
              >
                <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm leading-6 text-slate-600">可见界面会立即切换语言。</p>
      </div>
    </SectionCard>
  );
}

function PromptStatusSection({ prompts }: PromptStatusSectionProps): JSX.Element {
  return (
    <SectionCard title="提示词状态" description="必需提示词文件的只读校验状态。">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-2 font-semibold">提示词</th>
              <th className="px-3 py-2 font-semibold">路径</th>
              <th className="px-3 py-2 font-semibold">存在</th>
              <th className="px-3 py-2 font-semibold">有效</th>
              <th className="px-3 py-2 font-semibold">输入占位符</th>
              <th className="px-3 py-2 font-semibold">警告</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {prompts.map((prompt) => (
              <tr key={prompt.name}>
                <td className="px-3 py-3 font-semibold text-slate-950">{prompt.name}</td>
                <td className="px-3 py-3 text-slate-600">{prompt.path}</td>
                <td className="px-3 py-3">
                  <StatusBadge value={prompt.exists ? "存在" : "缺失"} tone={prompt.exists ? "success" : "danger"} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge value={prompt.valid ? "有效" : "无效"} tone={prompt.valid ? "success" : "warning"} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    value={prompt.hasInputPlaceholder ? "已包含" : "缺失"}
                    tone={prompt.hasInputPlaceholder ? "success" : "warning"}
                  />
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {prompt.warnings.length > 0 ? prompt.warnings.join(" ") : "无"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

type StatusBadgeProps = {
  value: string;
  tone: SettingsRow["tone"];
};

function StatusBadge({ value, tone }: StatusBadgeProps): JSX.Element {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-sm font-semibold ${toneClasses[tone]}`}>
      {value}
    </span>
  );
}

type SettingsRow = {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

type SettingsSectionProps = {
  title: string;
  rows: SettingsRow[];
};

const toneClasses: Record<SettingsRow["tone"], string> = {
  neutral: "border-slate-200 bg-white text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700"
};

function SettingsSection({ title, rows }: SettingsSectionProps): JSX.Element {
  return (
    <SectionCard title={title}>
      <dl className="divide-y divide-slate-200">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-2 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
          >
            <dt className="text-sm font-medium text-slate-600">{row.label}</dt>
            <dd>
              <span
                className={`inline-flex rounded-md border px-2 py-1 text-sm font-semibold ${toneClasses[row.tone]}`}
              >
                {row.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

function createTextRow(label: string, value: string): SettingsRow {
  return {
    label,
    value,
    tone: "neutral"
  };
}

function createStatusRow(label: string, isConfigured: boolean): SettingsRow {
  return {
    label,
    value: isConfigured ? "已配置" : "缺失",
    tone: isConfigured ? "success" : "warning"
  };
}

function createAiStatusRow(label: string, status: SettingsStatus["ai"]["status"]): SettingsRow {
  if (status === "missing_base_url") {
    return {
      label,
      value: "缺少 Base URL",
      tone: "warning"
    };
  }

  return {
    label,
    value: status === "ready" ? "就绪" : "缺少 API Key",
    tone: status === "ready" ? "success" : "warning"
  };
}

function createConnectionRow(label: string, isConnected: boolean): SettingsRow {
  return {
    label,
    value: isConnected ? "已连接" : "未连接",
    tone: isConnected ? "success" : "danger"
  };
}

async function requestApi<TData>(path: string): Promise<TData> {
  const response = await fetch(path);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
