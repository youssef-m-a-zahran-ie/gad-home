"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { str } from "@/lib/admin/form";
import { dbError, tx } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

function refresh(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin", "layout");
}

export async function setOrderStatus(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const status = str(fd, "status") as OrderStatus;
  if (!STATUSES.includes(status)) return fail("حالة مش معروفة.");
  try {
    await tx([["update orders set status = $2::order_status where id = $1::uuid", [id, status]]], user.email);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh(id);
  return ok(status === "cancelled" ? "الطلب اتلغى ورجعنا المنتجات للمخزون." : "اتحفظ.");
}

export async function setOrderPaid(id: string, paid: boolean): Promise<ActionState> {
  const { user } = await assertAdmin();
  try {
    await tx([["update orders set paid = $2 where id = $1::uuid", [id, paid]]], user.email);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh(id);
  return ok(paid ? "اتسجل إن الطلب مدفوع." : "اتشال علامة مدفوع.");
}

export async function saveOrderNote(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const note = str(fd, "admin_note").slice(0, 2000);
  try {
    await tx([["update orders set admin_note = $2 where id = $1::uuid", [id, note || null]]], user.email);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh(id);
  return ok("الملاحظة اتحفظت.");
}

export async function saveOrderCustomer(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const customer_name = str(fd, "customer_name");
  const phone = str(fd, "phone");
  const city = str(fd, "city");
  const address = str(fd, "address");
  if (!customer_name || !phone || !address) return fail("الاسم والموبايل والعنوان لازم يكونوا مكتوبين.");
  try {
    await tx(
      [[
        "update orders set customer_name = $2, phone = $3, phone2 = $4, city = $5, address = $6 where id = $1::uuid",
        [id, customer_name, phone, str(fd, "phone2") || null, city, address],
      ]],
      user.email,
    );
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh(id);
  return ok("بيانات العميل اتحفظت.");
}
