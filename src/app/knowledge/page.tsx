"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import { KnowledgeFilters } from "@/features/knowledge/components/KnowledgeFilters";
import { KnowledgeForm } from "@/features/knowledge/components/KnowledgeForm";
import { KnowledgeList } from "@/features/knowledge/components/KnowledgeList";
import { useKnowledge } from "@/features/knowledge/hooks/useKnowledge";

export default function KnowledgePage(): JSX.Element {
  const knowledge = useKnowledge();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = knowledge;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="知识库"
        description="创建、搜索、筛选、编辑和删除可复用的招聘知识。"
      />
      <KnowledgeFilters
        filters={knowledge.filters}
        typeOptions={knowledge.typeOptions}
        isLoading={knowledge.isLoading}
        onFilterChange={knowledge.updateFilter}
        onCreate={knowledge.openCreateForm}
        onRefresh={knowledge.refreshEntries}
      />

      {knowledge.errorMessage && !knowledge.isFormOpen ? (
        <ErrorState
          title="无法加载知识库"
          message={knowledge.errorMessage}
          actionLabel="关闭"
          onAction={knowledge.dismissError}
        />
      ) : null}

      <KnowledgeList
        entries={knowledge.entries}
        isLoading={knowledge.isLoading}
        onEdit={knowledge.openEditForm}
        onDelete={knowledge.requestDelete}
      />

      {knowledge.isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <SectionCard
              title={knowledge.formMode === "edit" ? "Edit Knowledge" : "Create Knowledge"}
              description="沉淀结构化招聘知识，便于后续复用。"
            >
              <KnowledgeForm
                values={knowledge.formValues}
                mode={knowledge.formMode}
                typeOptions={knowledge.typeOptions}
                isSaving={knowledge.isSaving}
                errorMessage={knowledge.errorMessage}
                onChange={knowledge.updateFormField}
                onCancel={knowledge.closeForm}
                onSave={knowledge.saveForm}
              />
            </SectionCard>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={knowledge.deleteCandidate !== null}
        title="删除知识"
        description={`确定删除“${knowledge.deleteCandidate?.title ?? "这条知识"}”吗？此操作无法撤销。`}
        confirmLabel="删除"
        tone="danger"
        isConfirming={knowledge.isDeleting}
        onCancel={knowledge.cancelDelete}
        onConfirm={knowledge.confirmDelete}
      />
    </div>
  );
}
