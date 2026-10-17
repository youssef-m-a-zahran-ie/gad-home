"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, Notice, SubmitButton } from "@/components/admin/form-bits";
import { STATUS } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin/state";
import type { OrderRow, OrderStatus } from "@/lib/types";
import { saveOrderCustomer, saveOrderNote, setOrderPaid, setOrderStatus } from "../actions";

const FLOW: OrderStatus[] = ["new", "confirmed", "shipped", "delivered"];

export function StatusControl({ id, status }: { id: string; status: OrderStatus }) {
  const action = setOrderStatus.bind(null, id);
  return (
    <ActionForm action={action} className="grid gap-3">
      <p className="text-[17px] text-muted">اضغط على الحالة الجديدة:</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FLOW.map((s) => (
          <SubmitButton
            key={s}
            name="status"
            value={s}
            pending="…"
            className={`btn btn-sm ${status === s ? "btn-navy" : "btn-outline"}`}
          >
            {status === s ? `✓ ${STATUS[s].label}` : STATUS[s].label}
          </SubmitButton>
        ))}
      </div>
      {status !== "cancelled" ? (
        <CancelButton />
      ) : (
        <p className="rounded-xl bg-soft px-4 py-3 text-[17px]">الطلب ده ملغي. لو رجعته لأي حالة تانية، المنتجات هتتخصم من المخزون تاني.</p>
      )}
    </ActionForm>
  );
}

function CancelButton() {
  const [sure, setSure] = useState(false);
  if (!sure) {
    return (
      <button type="button" className="btn btn-danger btn-sm w-fit" onClick={() => setSure(true)}>
        إلغاء الطلب
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fdecec] p-3">
      <span className="text-[17px] font-bold text-sale">متأكد؟ المنتجات هترجع للمخزون.</span>
      <SubmitButton name="status" value="cancelled" className="btn btn-sm bg-sale text-white" pending="…">
        أيوه، الغي الطلب
      </SubmitButton>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setSure(false)}>
        لأ
      </button>
    </div>
  );
}

export function PaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const [state, setState] = useState<ActionState>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="grid gap-2">
      <label className="flex cursor-pointer items-center gap-3 text-[18px] font-bold">
        <input
          type="checkbox"
          defaultChecked={paid}
          disabled={pending}
          className="size-6 accent-[var(--ok)]"
          onChange={(e) => {
            const v = e.target.checked;
            start(async () => {
              setState(await setOrderPaid(id, v));
              router.refresh();
            });
          }}
        />
        الفلوس وصلت (مدفوع)
      </label>
      <Notice state={state} />
    </div>
  );
}

export function NoteForm({ id, note }: { id: string; note: string | null }) {
  return (
    <ActionForm action={saveOrderNote.bind(null, id)} className="grid gap-3">
      <textarea name="admin_note" defaultValue={note ?? ""} className="input" placeholder="ملاحظة ليك إنت بس (العميل مش بيشوفها)، مثلاً: رقم بوليصة الشحن" />
      <SubmitButton className="btn btn-outline btn-sm w-fit">احفظ الملاحظة</SubmitButton>
    </ActionForm>
  );
}

export function CustomerForm({ o }: { o: Pick<OrderRow, "id" | "customer_name" | "phone" | "phone2" | "city" | "address"> }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="text-[16px] font-bold text-blue hover:underline" onClick={() => setOpen(true)}>
        تعديل بيانات العميل
      </button>
    );
  }
  return (
    <ActionForm action={saveOrderCustomer.bind(null, o.id)} className="grid gap-3 rounded-xl bg-soft p-3" onSuccess={() => setOpen(false)}>
      <input name="customer_name" defaultValue={o.customer_name} className="input" aria-label="الاسم" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="phone" defaultValue={o.phone} className="input" dir="ltr" aria-label="الموبايل" />
        <input name="phone2" defaultValue={o.phone2 ?? ""} className="input" dir="ltr" aria-label="رقم تاني" placeholder="رقم تاني" />
      </div>
      <input name="city" defaultValue={o.city} className="input" aria-label="المدينة" />
      <textarea name="address" defaultValue={o.address} className="input" aria-label="العنوان" />
      <div className="flex gap-2">
        <SubmitButton className="btn btn-primary btn-sm">احفظ</SubmitButton>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
          إلغاء
        </button>
      </div>
    </ActionForm>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn-outline btn-sm no-print" onClick={() => window.print()}>
      اطبع الطلب
    </button>
  );
}
