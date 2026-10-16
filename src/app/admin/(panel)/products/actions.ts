"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { slugify } from "@/lib/format";
import { MEDIA_BUCKET } from "@/lib/supabase/env";

function refresh(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/", "layout");
}

function parseImages(fd: FormData): string[] {
  try {
    const v = JSON.parse(str(fd, "images") || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length < 300).slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function saveProduct(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const name = str(fd, "name");
  const price = num(fd, "price");
  const compare = num(fd, "compare_at_price");
  const cost = num(fd, "cost");
  const stock = num(fd, "stock");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "اكتب اسم المنتج";
  if (price === null || Number.isNaN(price) || price < 0) errors.price = "اكتب السعر (رقم)";
  if (compare !== null && (Number.isNaN(compare) || compare < 0)) errors.compare_at_price = "رقم مش مظبوط";
  if (compare !== null && price !== null && compare <= price) errors.compare_at_price = "السعر قبل الخصم لازم يكون أكبر من السعر الحالي (أو سيبه فاضي)";
  if (cost !== null && (Number.isNaN(cost) || cost < 0)) errors.cost = "رقم مش مظبوط";
  if (stock === null || Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) errors.stock = "اكتب عدد القطع (٠ أو أكتر)";
  if (Object.keys(errors).length) return fail("في خانات محتاجة تتظبط.", errors);

  const row = {
    name,
    category_id: str(fd, "category_id") || null,
    price: price!,
    compare_at_price: compare,
    cost,
    sku: str(fd, "sku") || null,
    description: str(fd, "description") || null,
    low_stock_at: Math.max(0, Math.round(num(fd, "low_stock_at") ?? 3)),
    is_active: bool(fd, "is_active"),
    is_best_seller: bool(fd, "is_best_seller"),
    is_trending: bool(fd, "is_trending"),
  };
  const images = parseImages(fd);

  let productId = id;
  if (!productId) {
    // URL name from the product name; add a short code if it's taken.
    const base = slugify(name);
    let slug = base;
    for (let i = 0; i < 5; i++) {
      const { data: taken } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const { data, error } = await supabase.from("products").insert({ ...row, slug, stock: 0 }).select("id").single();
    if (error || !data) return fail(friendlyDbError(error));
    productId = data.id;
  } else {
    const { error } = await supabase.from("products").update(row).eq("id", productId);
    if (error) return fail(friendlyDbError(error));
  }

  // Stock goes through the stock log so every change is recorded.
  const { error: stockErr } = await supabase.rpc("set_stock", { p_product: productId, p_stock: stock!, p_note: id ? "تعديل من صفحة المنتج" : "مخزون أول مرة" });
  if (stockErr) return fail(friendlyDbError(stockErr));

  // Photos: replace the list, then delete files no longer used.
  const { data: old } = await supabase.from("product_images").select("path").eq("product_id", productId);
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (images.length) {
    const { error: imgErr } = await supabase
      .from("product_images")
      .insert(images.map((path, sort) => ({ product_id: productId!, path, sort })));
    if (imgErr) return fail(friendlyDbError(imgErr));
  }
  const removed = (old ?? []).map((o) => o.path).filter((p) => !images.includes(p));
  if (removed.length) await supabase.storage.from(MEDIA_BUCKET).remove(removed);

  refresh(productId);
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return ok("اتحفظ ✓");
}

export async function deleteProduct(id: string): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { data: imgs } = await supabase.from("product_images").select("path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail(friendlyDbError(error));
  const paths = (imgs ?? []).map((i) => i.path);
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  refresh();
  redirect("/admin/products?deleted=1");
}

export async function toggleProductActive(id: string, active: boolean): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("products").update({ is_active: active }).eq("id", id);
  if (error) return fail(friendlyDbError(error));
  refresh(id);
  return ok(active ? "المنتج ظاهر في الموقع." : "المنتج اتخفى من الموقع.");
}

/** Removes the sample products (code DEMO-…) and sample banners that came with the new store. */
export async function clearDemoData(): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("products").delete().like("sku", "DEMO-%");
  if (error) return fail(friendlyDbError(error));
  await supabase.from("banners").delete().like("image_path", "/placeholders/%");
  refresh();
  revalidatePath("/admin/settings");
  return ok("المنتجات والبانرات التجريبية اتمسحت ✓");
}
