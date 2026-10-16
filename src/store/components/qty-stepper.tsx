"use client";

import { num } from "@/lib/format";
import { MinusIcon, PlusIcon } from "./icons";

export function QtyStepper({ value, max, onChange, size = "lg" }: { value: number; max: number; onChange: (n: number) => void; size?: "lg" | "md" }) {
  const box = size === "lg" ? "size-14" : "size-12";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-2xl border-2 border-line bg-white" role="group" aria-label="الكمية">
      <button type="button" className={`${box} grid place-items-center text-navy hover:bg-sky disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="زوّد واحد">
        <PlusIcon size={26} />
      </button>
      <span className={`min-w-12 text-center font-extrabold text-ink ${size === "lg" ? "text-[24px]" : "text-[20px]"}`} aria-live="polite">
        {num(value)}
      </span>
      <button type="button" className={`${box} grid place-items-center text-navy hover:bg-sky disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="قلّل واحد">
        <MinusIcon size={26} />
      </button>
    </div>
  );
}
