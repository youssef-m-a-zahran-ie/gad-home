"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { dbError, tx } from "@/lib/db";

function refresh() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** "وصل بضاعة": adds pieces to the current stock. */
export async function addStock(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const n = num(fd, "add");
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n === 0) return fail("اكتب عدد القطع اللي وصلت");
  try {
    await tx(
      [[
        "insert into stock_movements (product_id, change, reason, note, created_by) values ($1::uuid, $2, $3, $4, $5)",
        [id, n, n > 0 ? "restock" : "correction", str(fd, "note") || null, user.email],
      ]],
      user.email,
    );
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok(n > 0 ? `اتضاف ${n} قطعة ✓` : `اتشال ${-n} قطعة ✓`);
}

/** Sets the stock to an exact count (after counting the shelf). */
export async function setStock(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const n = num(fd, "stock");
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n < 0) return fail("اكتب رقم صحيح ٠ أو أكتر");
  try {
    await tx([["select set_stock($1::uuid, $2::int, $3)", [id, n, "جرد"]]], user.email);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("اتحفظ ✓");
}
