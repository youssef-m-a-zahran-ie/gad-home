"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";

function refresh() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** "وصل بضاعة": adds pieces to the current stock. */
export async function addStock(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await assertAdmin();
  const n = num(fd, "add");
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n === 0) return fail("اكتب عدد القطع اللي وصلت");
  const { error } = await supabase.from("stock_movements").insert({
    product_id: id,
    change: n,
    reason: n > 0 ? "restock" : "correction",
    note: str(fd, "note") || null,
    created_by: user.email,
  });
  if (error) return fail(friendlyDbError(error));
  refresh();
  return ok(n > 0 ? `اتضاف ${n} قطعة ✓` : `اتشال ${-n} قطعة ✓`);
}

/** Sets the stock to an exact count (after counting the shelf). */
export async function setStock(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const n = num(fd, "stock");
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n < 0) return fail("اكتب رقم صحيح ٠ أو أكتر");
  const { error } = await supabase.rpc("set_stock", { p_product: id, p_stock: n, p_note: "جرد" });
  if (error) return fail(friendlyDbError(error));
  refresh();
  return ok("اتحفظ ✓");
}
