import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
};

export function FormField({
  id,
  label,
  children,
  description,
  error,
  required = false
}: FormFieldProps): JSX.Element {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      {children}
      {description ? <p className="text-xs leading-5 text-slate-500">{description}</p> : null}
      {error ? <p className="text-xs leading-5 text-rose-600">{error}</p> : null}
    </div>
  );
}
