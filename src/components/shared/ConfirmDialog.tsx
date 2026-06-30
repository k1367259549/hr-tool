"use client";

import { SectionCard } from "@/components/shared/SectionCard";

type ConfirmDialogTone = "danger" | "neutral";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

const confirmButtonClasses: Record<ConfirmDialogTone, string> = {
  danger: "border-rose-200 bg-rose-600 text-white hover:bg-rose-700",
  neutral: "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "neutral",
  isConfirming = false,
  onCancel,
  onConfirm
}: ConfirmDialogProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg">
        <SectionCard title={title}>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-slate-700">{description}</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onCancel}
                disabled={isConfirming}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClasses[tone]}`}
                onClick={() => void onConfirm()}
                disabled={isConfirming}
              >
                {isConfirming ? "Working..." : confirmLabel}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
