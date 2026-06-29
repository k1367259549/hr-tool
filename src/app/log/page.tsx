"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LogForm } from "@/features/log/components/LogForm";
import { LogList } from "@/features/log/components/LogList";
import { useLogForm } from "@/features/log/hooks/useLogForm";

export default function LogPage(): JSX.Element {
  const logForm = useLogForm();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Log"
        description="Record structured recruiting activity including screening, communication, interviews, offers, entries, and reflection."
      />
      {logForm.successMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span>{logForm.successMessage}</span>
            <button
              type="button"
              className="text-xs font-semibold text-emerald-900 underline"
              onClick={logForm.dismissSuccessMessage}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <LogForm
          values={logForm.formValues}
          isSaving={logForm.isSaving}
          isDeleting={logForm.isDeleting}
          canDelete={logForm.canDelete}
          errorMessage={logForm.errorMessage}
          onChange={logForm.updateField}
          onSave={logForm.saveLog}
          onDelete={logForm.deleteSelectedLog}
          onReset={logForm.resetForm}
          onLoadByDate={logForm.loadLogByDate}
        />
        <LogList
          logs={logForm.logs}
          selectedLogId={logForm.selectedLog?.id ?? null}
          isLoading={logForm.isLoading}
          onSelect={logForm.selectLog}
          onRefresh={logForm.refreshLogs}
        />
      </div>
    </div>
  );
}
