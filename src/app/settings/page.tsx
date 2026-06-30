"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import type { ApiResponse } from "@/types/api";
import type { PromptStatusItem, PromptStatusResponse } from "@/types/prompt";
import type { SettingsStatus } from "@/types/settings";

export default function SettingsPage(): JSX.Element {
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
        title="Settings"
        description="View read-only system, AI, database, and environment configuration status."
      />

      {isLoading ? (
        <LoadingState title="Loading settings" description="Checking configuration status." />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load settings"
          message={errorMessage}
          action={
            <button
              type="button"
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={() => void loadStatus()}
            >
              Retry
            </button>
          }
        />
      ) : status ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SettingsSection
            title="Application Info"
            rows={[
              createTextRow("App name", status.appName),
              createTextRow("Version", status.version),
              createTextRow("Environment", status.environment)
            ]}
          />
          <SettingsSection
            title="AI Configuration"
            rows={[
              createTextRow("AI provider", status.ai.provider),
              createTextRow("Configured model", status.ai.model),
              createStatusRow("API key", status.ai.apiKeyConfigured),
              createStatusRow("Prompt directory", status.ai.promptDirectoryAvailable)
            ]}
          />
          <SettingsSection
            title="Database Status"
            rows={[
              createTextRow("Database provider", status.database.provider),
              createConnectionRow("Connection", status.database.connected)
            ]}
          />
          <SettingsSection
            title="Environment Status"
            rows={[
              createTextRow("NODE_ENV", status.environmentStatus.nodeEnv),
              createStatusRow("DATABASE_URL", status.environmentStatus.databaseUrlConfigured),
              createStatusRow("OPENAI_API_KEY", status.environmentStatus.openAiApiKeyConfigured)
            ]}
          />
          <div className="xl:col-span-2">
            <SettingsSection
              title="Developer Info"
              rows={[
                createTextRow("Runtime", status.developer.runtime),
                createTextRow("Deployment", status.developer.deployment),
                createTextRow("Configuration mode", status.developer.configurationMode)
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

function PromptStatusSection({ prompts }: PromptStatusSectionProps): JSX.Element {
  return (
    <SectionCard title="Prompt Status" description="Read-only validation status for required prompt files.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-2 font-semibold">Prompt</th>
              <th className="px-3 py-2 font-semibold">Path</th>
              <th className="px-3 py-2 font-semibold">Exists</th>
              <th className="px-3 py-2 font-semibold">Valid</th>
              <th className="px-3 py-2 font-semibold">Input</th>
              <th className="px-3 py-2 font-semibold">Warnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {prompts.map((prompt) => (
              <tr key={prompt.name}>
                <td className="px-3 py-3 font-semibold text-slate-950">{prompt.name}</td>
                <td className="px-3 py-3 text-slate-600">{prompt.path}</td>
                <td className="px-3 py-3">
                  <StatusBadge value={prompt.exists ? "Exists" : "Missing"} tone={prompt.exists ? "success" : "danger"} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge value={prompt.valid ? "Valid" : "Invalid"} tone={prompt.valid ? "success" : "warning"} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    value={prompt.hasInputPlaceholder ? "Present" : "Missing"}
                    tone={prompt.hasInputPlaceholder ? "success" : "warning"}
                  />
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {prompt.warnings.length > 0 ? prompt.warnings.join(" ") : "None"}
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
    value: isConfigured ? "Configured" : "Missing",
    tone: isConfigured ? "success" : "warning"
  };
}

function createConnectionRow(label: string, isConnected: boolean): SettingsRow {
  return {
    label,
    value: isConnected ? "Connected" : "Disconnected",
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

  return "Request failed.";
}
