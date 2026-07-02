import type { FormEvent } from "react";
import type { CandidateCreateInput, CandidateDto } from "@/types/candidate";

export type CandidateFormState = {
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string;
  currentTitle: string;
  targetRoles: string;
  sourceChannel: string;
  owner: string;
  tags: string;
  notes: string;
  status: "ACTIVE" | "TALENT_POOL";
};

type CandidateFormProps = {
  candidate?: CandidateDto;
  disabled?: boolean;
  submitLabel: string;
  onSubmit: (input: CandidateCreateInput) => Promise<void>;
};

export function CandidateForm({
  candidate,
  disabled = false,
  submitLabel,
  onSubmit
}: CandidateFormProps): JSX.Element {
  const initialState = createFormState(candidate);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const state = readFormState(formData);

    if (!state.fullName.trim()) {
      window.alert("姓名为必填项。");
      return;
    }

    await onSubmit(toCandidatePayload(state));
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput name="fullName" label="姓名" required defaultValue={initialState.fullName} disabled={disabled} />
        <FormInput name="email" label="邮箱" type="email" defaultValue={initialState.email} disabled={disabled} />
        <FormInput name="phone" label="手机号" defaultValue={initialState.phone} disabled={disabled} />
        <FormInput name="currentCompany" label="当前公司" defaultValue={initialState.currentCompany} disabled={disabled} />
        <FormInput name="currentTitle" label="当前职位" defaultValue={initialState.currentTitle} disabled={disabled} />
        <FormInput name="targetRoles" label="目标岗位" defaultValue={initialState.targetRoles} disabled={disabled} />
        <FormInput name="sourceChannel" label="来源渠道" defaultValue={initialState.sourceChannel} disabled={disabled} />
        <FormInput name="owner" label="负责人" defaultValue={initialState.owner} disabled={disabled} />
        <FormInput name="tags" label="标签" defaultValue={initialState.tags} disabled={disabled} />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">状态</span>
          <select
            name="status"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={initialState.status}
            disabled={disabled}
          >
            <option value="ACTIVE">活跃</option>
            <option value="TALENT_POOL">人才池</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">备注</span>
        <textarea
          name="notes"
          className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
          defaultValue={initialState.notes}
          disabled={disabled}
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={disabled}
      >
        {submitLabel}
      </button>
    </form>
  );
}

type FormInputProps = {
  name: keyof CandidateFormState;
  label: string;
  defaultValue: string;
  disabled: boolean;
  required?: boolean;
  type?: string;
};

function FormInput({
  name,
  label,
  defaultValue,
  disabled,
  required = false,
  type = "text"
}: FormInputProps): JSX.Element {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}

function createFormState(candidate?: CandidateDto): CandidateFormState {
  return {
    currentCompany: candidate?.currentCompany ?? "",
    currentTitle: candidate?.currentTitle ?? "",
    email: candidate?.email ?? "",
    fullName: candidate?.fullName ?? "",
    notes: candidate?.notes ?? "",
    owner: candidate?.owner ?? "",
    phone: candidate?.phone ?? "",
    sourceChannel: candidate?.sourceChannel ?? "",
    status: candidate?.status === "TALENT_POOL" ? "TALENT_POOL" : "ACTIVE",
    tags: candidate?.tags.join(", ") ?? "",
    targetRoles: candidate?.targetRoles.join(", ") ?? ""
  };
}

function readFormState(formData: FormData): CandidateFormState {
  return {
    currentCompany: readFormText(formData, "currentCompany"),
    currentTitle: readFormText(formData, "currentTitle"),
    email: readFormText(formData, "email"),
    fullName: readFormText(formData, "fullName"),
    notes: readFormText(formData, "notes"),
    owner: readFormText(formData, "owner"),
    phone: readFormText(formData, "phone"),
    sourceChannel: readFormText(formData, "sourceChannel"),
    status: readFormText(formData, "status") === "TALENT_POOL" ? "TALENT_POOL" : "ACTIVE",
    tags: readFormText(formData, "tags"),
    targetRoles: readFormText(formData, "targetRoles")
  };
}

function toCandidatePayload(state: CandidateFormState): CandidateCreateInput {
  return {
    currentCompany: state.currentCompany || null,
    currentTitle: state.currentTitle || null,
    email: state.email || null,
    fullName: state.fullName,
    notes: state.notes || null,
    owner: state.owner || null,
    phone: state.phone || null,
    sourceChannel: state.sourceChannel || null,
    status: state.status,
    tags: splitList(state.tags),
    targetRoles: splitList(state.targetRoles)
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readFormText(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}
