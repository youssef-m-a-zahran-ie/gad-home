"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { num } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";

export async function saveShipping(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { data } = await supabase.from("governorates").select("id, fee, is_active");
  const bad: string[] = [];
  for (const g of data ?? []) {
    const fee = num(fd, `fee_${g.id}`);
    const active = fd.get(`active_${g.id}`) === "on";
    if (fee === null || Number.isNaN(fee) || fee < 0) {
      bad.push(String(g.id));
      continue;
    }
    if (Number(g.fee) !== fee || g.is_active !== active) {
      const { error } = await supabase.from("governorates").update({ fee, is_active: active }).eq("id", g.id);
      if (error) return fail(friendlyDbError(error));
    }
  }
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  if (bad.length) return fail("في محافظات سعرها مش رقم، ماتحفظتش. الباقي اتحفظ.");
  return ok("أسعار الشحن اتحفظت ✓");
}
