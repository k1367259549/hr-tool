"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { KnowledgeFilters } from "@/features/knowledge/components/KnowledgeFilters";
import { KnowledgeForm } from "@/features/knowledge/components/KnowledgeForm";
import { KnowledgeList } from "@/features/knowledge/components/KnowledgeList";
import { useKnowledge } from "@/features/knowledge/hooks/useKnowledge";

export default function KnowledgePage(): JSX.Element {
  const knowledge = useKnowledge();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge Base"
        description="Create, search, filter, edit, and delete reusable recruiting knowledge."
      />

      {knowledge.successMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span>{knowledge.successMessage}</span>
            <button
              type="button"
              className="text-xs font-semibold text-emerald-900 underline"
              onClick={knowledge.dismissSuccessMessage}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

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
          action={
            <button
              type="button"
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={knowledge.dismissError}
            >
              Dismiss
            </button>
          }
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

      {knowledge.deleteCandidate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg">
            <SectionCard
              title="Delete Knowledge"
              description="This action removes the selected knowledge entry."
            >
              <div className="space-y-5">
                <p className="text-sm leading-6 text-slate-700">
                  Delete <span className="font-semibold">{knowledge.deleteCandidate.title}</span>?
                </p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={knowledge.cancelDelete}
                    disabled={knowledge.isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void knowledge.confirmDelete()}
                    disabled={knowledge.isDeleting}
                  >
                    {knowledge.isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}
