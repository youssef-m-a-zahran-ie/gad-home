import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import type { GovernorateRow } from "@/lib/supabase/database.types";
import { ActionForm, SubmitButton } from "@/components/admin/form-bits";
import { PageHead } from "@/components/admin/ui";
import { saveShipping } from "./actions";

export const metadata: Metadata = { title: "الشحن" };

export default async function ShippingPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: s }] = await Promise.all([
    supabase.from("governorates").select("*").order("sort"),
    supabase.from("settings").select("free_shipping_over").eq("id", 1).maybeSingle(),
  ]);
  const govs = (data ?? []) as GovernorateRow[];
  return (
    <>
      <PageHead
        title="أسعار الشحن"
        sub={
          <>
            سعر الشحن لكل محافظة. شيل العلامة من أي محافظة مش بتوصلها.{" "}
            {s?.free_shipping_over ? `الشحن مجاني للطلبات من ${s.free_shipping_over} جنيه. ` : ""}
            <Link href="/admin/settings" className="font-bold text-blue underline">الشحن المجاني من الإعدادات</Link>
          </>
        }
      />
      <ActionForm action={saveShipping} className="grid gap-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {govs.map((g) => (
            <li key={g.id} className="card flex items-center gap-3 p-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-[18px] font-bold">
                <input type="checkbox" name={`active_${g.id}`} defaultChecked={g.is_active} className="size-6 accent-[var(--blue)]" />
                {g.name}
              </label>
              <input name={`fee_${g.id}`} defaultValue={Number(g.fee)} inputMode="decimal" className="input w-28 text-center" dir="ltr" aria-label={`سعر الشحن ${g.name}`} />
              <span className="text-[16px] text-muted">جنيه</span>
            </li>
          ))}
        </ul>
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-white/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <SubmitButton className="btn btn-primary min-w-48">احفظ أسعار الشحن</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
