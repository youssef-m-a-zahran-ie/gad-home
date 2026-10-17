"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, int, num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { dbError, one, query } from "@/lib/db";
import { removeFiles } from "@/lib/storage";
import { endAllSessions } from "@/lib/admin/session";

function firstImage(fd: FormData, key: string): string | null {
  try {
    const v = JSON.parse(str(fd, key) || "[]");
    return Array.isArray(v) && typeof v[0] === "string" ? v[0] : null;
  } catch {
    return null;
  }
}

function refresh() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertAdmin();
  const name = str(fd, "store_name");
  if (!name) return fail("اكتب اسم المتجر", { store_name: "اكتب اسم المتجر" });
  const free = num(fd, "free_shipping_over");
  const min = num(fd, "min_order");
  if (free !== null && (Number.isNaN(free) || free < 0)) return fail("الشحن المجاني لازم يكون رقم أو فاضي", { free_shipping_over: "رقم أو فاضي" });
  if (min !== null && (Number.isNaN(min) || min < 0)) return fail("أقل طلب لازم يكون رقم", { min_order: "رقم" });
  const logo = firstImage(fd, "logo");
  try {
    const old = await one<{ logo_path: string | null }>("select logo_path from settings where id = 1");
    await query(
      `update settings set store_name = $1, tagline = $2, announcement = $3, phone = $4, whatsapp = $5, instapay = $6,
         wallet = $7, address = $8, facebook = $9, instagram = $10, tiktok = $11, delivery_days = $12, return_days = $13,
         free_shipping_over = $14, min_order = $15, logo_path = $16 where id = 1`,
      [
        name, str(fd, "tagline") || null, str(fd, "announcement") || null, str(fd, "phone"), str(fd, "whatsapp"),
        str(fd, "instapay"), str(fd, "wallet"), str(fd, "address"), str(fd, "facebook"), str(fd, "instagram"),
        str(fd, "tiktok"), str(fd, "delivery_days") || null, Math.max(0, int(fd, "return_days", 14)), free, min ?? 0, logo,
      ],
    );
    if (old?.logo_path && old.logo_path !== logo) await removeFiles([old.logo_path]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("الإعدادات اتحفظت ✓");
}

export async function addBanner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertAdmin();
  const image = firstImage(fd, "image");
  if (!image) return fail("اختار صورة البانر الأول.");
  try {
    await query(
      "insert into banners (image_path, mobile_image_path, link, title, sort, is_active) values ($1, $2, $3, $4, $5, true)",
      [image, firstImage(fd, "mobile_image"), str(fd, "link") || null, str(fd, "title") || null, int(fd, "sort", 0)],
    );
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("البانر اتضاف ✓");
}

export async function updateBanner(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertAdmin();
  try {
    await query("update banners set link = $2, sort = $3, is_active = $4 where id = $1::uuid", [
      id, str(fd, "link") || null, int(fd, "sort", 0), bool(fd, "is_active"),
    ]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("اتحفظ ✓");
}

export async function deleteBanner(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const b = await one<{ image_path: string; mobile_image_path: string | null }>(
      "delete from banners where id = $1::uuid returning image_path, mobile_image_path",
      [id],
    );
    await removeFiles([b?.image_path, b?.mobile_image_path]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  return ok("البانر اتمسح.");
}

/** Adds an admin with a temporary password they can change from this page after signing in. */
export async function addAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertAdmin();
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("اكتب الإيميل صح", { email: "اكتب الإيميل صح" });
  if (password.length < 8) return fail("الباسورد ٨ حروف أو أرقام على الأقل", { password: "٨ حروف أو أرقام على الأقل" });
  try {
    await query("insert into admins (email, password_hash) values ($1, crypt($2, gen_salt('bf', 10)))", [email, password]);
  } catch (e) {
    const err = dbError(e);
    return fail(err.code === "23505" ? "الإيميل ده أدمن أصلاً." : friendlyDbError(err));
  }
  revalidatePath("/admin/settings");
  return ok("اتضاف. ادّي صاحب الإيميل الباسورد ده، وهو يغيره بعد ما يدخل.");
}

export async function removeAdmin(email: string): Promise<ActionState> {
  const { user } = await assertAdmin();
  if (email === user.email.toLowerCase()) return fail("مينفعش تشيل نفسك.");
  try {
    await query("delete from admins where email = $1", [email]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  revalidatePath("/admin/settings");
  return ok("اتشال من الأدمن.");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { user } = await assertAdmin();
  const p = str(fd, "password");
  if (p.length < 8) return fail("٨ حروف أو أرقام على الأقل", { password: "٨ حروف أو أرقام على الأقل" });
  if (p !== str(fd, "confirm")) return fail("الباسوردين مش زي بعض", { confirm: "مش زي الأول" });
  try {
    await query("update admins set password_hash = crypt($2, gen_salt('bf', 10)) where email = $1", [user.email, p]);
    // Sign out other devices; the current browser signs in again next time.
    await endAllSessions(user.email);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  return ok("الباسورد اتغير ✓ — هتسجّل دخول تاني.");
}
