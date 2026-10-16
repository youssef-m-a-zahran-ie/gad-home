"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/state";

const PendingContext = createContext(false);

export function SubmitButton({
  children,
  pending,
  className = "btn btn-primary",
  name,
  value,
}: {
  children: ReactNode;
  pending?: ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const status = useFormStatus();
  const ctxPending = useContext(PendingContext);
  const isPending = status.pending || ctxPending;
  return (
    <button type="submit" className={className} disabled={isPending} name={name} value={value}>
      {isPending ? (pending ?? "بيتحفظ…") : children}
    </button>
  );
}

export function Notice({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-[17px] font-bold ${state.ok ? "bg-ok-bg text-ok" : "bg-[#fdecec] text-sale"}`}
    >
      {state.message}
    </p>
  );
}

/** A form bound to a server action, with a status message under it. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  hideNotice = false,
  onSuccess,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  hideNotice?: boolean;
  onSuccess?: (state: ActionState) => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const cb = useRef(onSuccess);
  useEffect(() => {
    cb.current = onSuccess;
  });
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      cb.current?.(state);
    }
  }, [state, resetOnSuccess]);
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  }
  return (
    <PendingContext.Provider value={pending}>
      <form ref={ref} onSubmit={onSubmit} className={className} aria-busy={pending}>
        {typeof children === "function" ? children(state) : children}
        {!hideNotice && <Notice state={state} />}
      </form>
    </PendingContext.Provider>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1 text-[15px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: ReactNode; defaultChecked?: boolean; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line bg-white p-3 hover:border-blue">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-6 shrink-0 accent-[var(--blue)]" />
      <span>
        <span className="block text-[18px] font-bold">{label}</span>
        {hint && <span className="block text-[15px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}
