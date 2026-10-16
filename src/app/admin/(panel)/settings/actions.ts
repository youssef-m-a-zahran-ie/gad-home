"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, int, num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

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
  const { supabase } = await assertAdmin();
  const name = str(fd, "store_name");
  if (!name) return fail("اكتب اسم المتجر", { store_name: "اكتب اسم المتجر" });
  const free = num(fd, "free_shipping_over");
  const min = num(fd, "min_order");
  if (free !== null && (Number.isNaN(free) || free < 0)) return fail("الشحن المجاني لازم يكون رقم أو فاضي", { free_shipping_over: "رقم أو فاضي" });
  if (min !== null && (Number.isNaN(min) || min < 0)) return fail("أقل طلب لازم يكون رقم", { min_order: "رقم" });
  const logo = firstImage(fd, "logo");
  const { data: old } = await supabase.from("settings").select("logo_path").eq("id", 1).maybeSingle();
  const { error } = await supabase
    .from("settings")
    .update({
      store_name: name,
      tagline: str(fd, "tagline") || null,
      announcement: str(fd, "announcement") || null,
      phone: str(fd, "phone"),
      whatsapp: str(fd, "whatsapp"),
      instapay: str(fd, "instapay"),
      wallet: str(fd, "wallet"),
      address: str(fd, "address"),
      facebook: str(fd, "facebook"),
      instagram: str(fd, "instagram"),
      tiktok: str(fd, "tiktok"),
      delivery_days: str(fd, "delivery_days") || null,
      return_days: Math.max(0, int(fd, "return_days", 14)),
      free_shipping_over: free,
      min_order: min ?? 0,
      logo_path: logo,
    })
    .eq("id", 1);
  if (error) return fail(friendlyDbError(error));
  if (old?.logo_path && old.logo_path !== logo) await supabase.storage.from(MEDIA_BUCKET).remove([old.logo_path]);
  refresh();
  return ok("الإعدادات اتحفظت ✓");
}

export async function addBanner(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const image = firstImage(fd, "image");
  if (!image) return fail("اختار صورة البانر الأول.");
  const { error } = await supabase.from("banners").insert({
    image_path: image,
    mobile_image_path: firstImage(fd, "mobile_image"),
    link: str(fd, "link") || null,
    title: str(fd, "title") || null,
    sort: int(fd, "sort", 0),
    is_active: true,
  });
  if (error) return fail(friendlyDbError(error));
  refresh();
  return ok("البانر اتضاف ✓");
}

export async function updateBanner(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("banners")
    .update({ link: str(fd, "link") || null, sort: int(fd, "sort", 0), is_active: bool(fd, "is_active") })
    .eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh();
  return ok("اتحفظ ✓");
}

export async function deleteBanner(id: string): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { data: b } = await supabase.from("banners").select("image_path, mobile_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return fail(friendlyDbError(error));
  const paths = [b?.image_path, b?.mobile_image_path].filter((x): x is string => Boolean(x));
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  refresh();
  return ok("البانر اتمسح.");
}

export async function addAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("اكتب الإيميل صح", { email: "اكتب الإيميل صح" });
  const { error } = await supabase.from("admins").insert({ email });
  if (error) return fail(error.code === "23505" ? "الإيميل ده أدمن أصلاً." : friendlyDbError(error));
  revalidatePath("/admin/settings");
  return ok(`اتضاف. خلّي صاحب الإيميل يفتح /admin/login ويختار «أول مرة؟ اعمل الحساب».`);
}

export async function removeAdmin(email: string): Promise<ActionState> {
  const { supabase, user } = await assertAdmin();
  if (email === user.email?.toLowerCase()) return fail("مينفعش تشيل نفسك.");
  const { error } = await supabase.from("admins").delete().eq("email", email);
  if (error) return fail(friendlyDbError(error));
  revalidatePath("/admin/settings");
  return ok("اتشال من الأدمن.");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const p = str(fd, "password");
  if (p.length < 8) return fail("٨ حروف أو أرقام على الأقل", { password: "٨ حروف أو أرقام على الأقل" });
  if (p !== str(fd, "confirm")) return fail("الباسوردين مش زي بعض", { confirm: "مش زي الأول" });
  const { error } = await supabase.auth.updateUser({ password: p });
  if (error) return fail(error.message);
  return ok("الباسورد اتغير ✓");
}
