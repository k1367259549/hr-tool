"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ExportMarkdownButton } from "@/components/shared/ExportMarkdownButton";
import { useToast } from "@/components/shared/ToastProvider";
import { LogForm } from "@/features/log/components/LogForm";
import { LogList } from "@/features/log/components/LogList";
import { useLogForm } from "@/features/log/hooks/useLogForm";

export default function LogPage(): JSX.Element {
  const logForm = useLogForm();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const { consumeSuccessMessage, successMessage } = logForm;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  async function confirmDeleteLog(): Promise<void> {
    await logForm.deleteSelectedLog();
    setIsDeleteDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="每日记录"
        description="记录结构化招聘活动，包括简历、筛选、沟通、面试、Offer、入职和复盘。"
      />
      <div className="flex justify-end">
        <ExportMarkdownButton date={logForm.formValues.date} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <LogForm
          values={logForm.formValues}
          isSaving={logForm.isSaving}
          isDeleting={logForm.isDeleting}
          canDelete={logForm.canDelete}
          errorMessage={logForm.errorMessage}
          onChange={logForm.updateField}
          onSave={logForm.saveLog}
          onDelete={() => {
            setIsDeleteDialogOpen(true);
            return Promise.resolve();
          }}
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
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="删除每日记录"
        description="确定删除选中的每日记录吗？此操作无法撤销。"
        confirmLabel="删除"
        tone="danger"
        isConfirming={logForm.isDeleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteLog}
      />
    </div>
  );
}
