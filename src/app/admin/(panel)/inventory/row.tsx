"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/admin/form-bits";
import { num } from "@/lib/format";
import { ProductImage } from "@/store/components/product-image";
import { addStock, setStock } from "./actions";

export function InventoryRow({ p }: { p: { id: string; name: string; stock: number; low: number; image: string | null; active: boolean } }) {
  const [mode, setMode] = useState<"add" | "set" | null>(null);
  const tone = p.stock <= 0 ? "bg-[#fdecec] text-sale" : p.stock <= p.low ? "bg-warn-bg text-warn" : "bg-ok-bg text-ok";
  return (
    <li className="card grid gap-3 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <ProductImage path={p.image} alt="" className="size-16 shrink-0 rounded-xl border border-line p-1" />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/products/${p.id}`} className="text-[18px] leading-snug font-bold hover:text-blue">
            {p.name}
          </Link>
          {!p.active && <span className="badge ms-2 bg-[#6b7280] text-white">مخفي</span>}
        </div>
        <span className={`grid min-w-20 place-items-center rounded-xl px-3 py-1 text-center ${tone}`}>
          <span className="text-[26px] leading-tight font-extrabold">{num(p.stock)}</span>
          <span className="text-[14px] font-bold">قطعة</span>
        </span>
      </div>
      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode("add")}>
            + وصل بضاعة
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode("set")}>
            تعديل العدد
          </button>
        </div>
      ) : mode === "add" ? (
        <ActionForm action={addStock.bind(null, p.id)} className="grid gap-2" resetOnSuccess onSuccess={() => setTimeout(() => setMode(null), 1200)}>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[17px] font-bold" htmlFor={`add-${p.id}`}>عدد القطع اللي وصلت:</label>
            <input id={`add-${p.id}`} name="add" inputMode="numeric" className="input w-28" dir="ltr" autoFocus />
            <SubmitButton className="btn btn-primary btn-sm">ضيف</SubmitButton>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode(null)}>إلغاء</button>
          </div>
        </ActionForm>
      ) : (
        <ActionForm action={setStock.bind(null, p.id)} className="grid gap-2" onSuccess={() => setTimeout(() => setMode(null), 1200)}>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[17px] font-bold" htmlFor={`set-${p.id}`}>العدد الموجود فعلاً:</label>
            <input id={`set-${p.id}`} name="stock" inputMode="numeric" defaultValue={p.stock} className="input w-28" dir="ltr" autoFocus />
            <SubmitButton className="btn btn-primary btn-sm">احفظ</SubmitButton>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode(null)}>إلغاء</button>
          </div>
        </ActionForm>
      )}
    </li>
  );
}
