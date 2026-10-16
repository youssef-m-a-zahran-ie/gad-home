"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { str } from "@/lib/admin/form";
import type { OrderStatus } from "@/lib/supabase/database.types";

const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

function refresh(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin", "layout");
}

export async function setOrderStatus(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const status = str(fd, "status") as OrderStatus;
  if (!STATUSES.includes(status)) return fail("حالة مش معروفة.");
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh(id);
  return ok(status === "cancelled" ? "الطلب اتلغى ورجعنا المنتجات للمخزون." : "اتحفظ.");
}

export async function setOrderPaid(id: string, paid: boolean): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("orders").update({ paid }).eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh(id);
  return ok(paid ? "اتسجل إن الطلب مدفوع." : "اتشال علامة مدفوع.");
}

export async function saveOrderNote(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const note = str(fd, "admin_note").slice(0, 2000);
  const { error } = await supabase.from("orders").update({ admin_note: note || null }).eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh(id);
  return ok("الملاحظة اتحفظت.");
}

export async function saveOrderCustomer(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const customer_name = str(fd, "customer_name");
  const phone = str(fd, "phone");
  const city = str(fd, "city");
  const address = str(fd, "address");
  if (!customer_name || !phone || !address) return fail("الاسم والموبايل والعنوان لازم يكونوا مكتوبين.");
  const { error } = await supabase
    .from("orders")
    .update({ customer_name, phone, phone2: str(fd, "phone2") || null, city, address })
    .eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh(id);
  return ok("بيانات العميل اتحفظت.");
}
