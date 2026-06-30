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
        title="Knowledge Base"
        description="Create, search, filter, edit, and delete reusable recruiting knowledge."
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
          title="Unable to load knowledge"
          message={knowledge.errorMessage}
          actionLabel="Dismiss"
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
              description="Store structured recruiting knowledge for future reference."
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
        title="Delete Knowledge"
        description={`Delete "${knowledge.deleteCandidate?.title ?? "this knowledge entry"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        isConfirming={knowledge.isDeleting}
        onCancel={knowledge.cancelDelete}
        onConfirm={knowledge.confirmDelete}
      />
    </div>
  );
}
