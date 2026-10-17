"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { num } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { dbError, query, tx, type Stmt } from "@/lib/db";

export async function saveShipping(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertAdmin();
  const bad: string[] = [];
  const stmts: Stmt[] = [];
  try {
    const gs = await query<{ id: number; fee: number; is_active: boolean }>("select id, fee, is_active from governorates");
    for (const g of gs) {
      const fee = num(fd, `fee_${g.id}`);
      const active = fd.get(`active_${g.id}`) === "on";
      if (fee === null || Number.isNaN(fee) || fee < 0) {
        bad.push(String(g.id));
        continue;
      }
      if (Number(g.fee) !== fee || g.is_active !== active) {
        stmts.push(["update governorates set fee = $2, is_active = $3 where id = $1", [g.id, fee, active]]);
      }
    }
    if (stmts.length) await tx(stmts);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  if (bad.length) return fail("في محافظات سعرها مش رقم، ماتحفظتش. الباقي اتحفظ.");
  return ok("أسعار الشحن اتحفظت ✓");
}
