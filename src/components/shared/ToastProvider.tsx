"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

const toastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 1;

const toastToneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-white text-slate-700"
};

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number): void => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success"): void => {
      const id = nextToastId;
      nextToastId += 1;

      setToasts((currentToasts) => [...currentToasts, { id, message, tone }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3000);
    },
    [dismissToast]
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      dismissToast,
      showToast
    }),
    [dismissToast, showToast]
  );

  return (
    <toastContext.Provider value={contextValue}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-6 top-6 z-50 flex w-[min(360px,calc(100vw-3rem))] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-md border px-4 py-3 text-sm font-medium shadow-sm ${toastToneClasses[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button
                type="button"
                className="text-xs font-semibold underline"
                onClick={() => dismissToast(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </toastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contextValue = useContext(toastContext);

  if (!contextValue) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return contextValue;
}
