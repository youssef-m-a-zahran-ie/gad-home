"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/admin/guard";
import { bool, num, str } from "@/lib/admin/form";
import { fail, friendlyDbError, ok, type ActionState } from "@/lib/admin/state";
import { slugify } from "@/lib/format";
import { dbError, one, query, tx, type Stmt } from "@/lib/db";
import { removeFiles } from "@/lib/storage";

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
  const { user } = await assertAdmin();
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
  let removed: string[] = [];
  try {
    if (!productId) {
      // URL name from the product name; add a short code if it's taken.
      const base = slugify(name);
      let slug = base;
      for (let i = 0; i < 5; i++) {
        const taken = await one("select 1 from products where slug = $1", [slug]);
        if (!taken) break;
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }
      const created = await one<{ id: string }>(
        `insert into products (name, slug, category_id, price, compare_at_price, cost, sku, description, low_stock_at, is_active, is_best_seller, is_trending, stock)
         values ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0) returning id`,
        [row.name, slug, row.category_id, row.price, row.compare_at_price, row.cost, row.sku, row.description, row.low_stock_at, row.is_active, row.is_best_seller, row.is_trending],
      );
      if (!created) return fail(friendlyDbError(null));
      productId = created.id;
    } else {
      await query(
        `update products set name = $2, category_id = $3::uuid, price = $4, compare_at_price = $5, cost = $6, sku = $7,
           description = $8, low_stock_at = $9, is_active = $10, is_best_seller = $11, is_trending = $12
         where id = $1::uuid`,
        [productId, row.name, row.category_id, row.price, row.compare_at_price, row.cost, row.sku, row.description, row.low_stock_at, row.is_active, row.is_best_seller, row.is_trending],
      );
    }

    const old = await query<{ path: string }>("select path from product_images where product_id = $1::uuid", [productId]);
    // Stock goes through the stock log so every change is recorded; photos are replaced in the same transaction.
    const stmts: Stmt[] = [
      ["select set_stock($1::uuid, $2::int, $3)", [productId, stock!, id ? "تعديل من صفحة المنتج" : "مخزون أول مرة"]],
      ["delete from product_images where product_id = $1::uuid", [productId]],
      ...images.map((path, sort): Stmt => ["insert into product_images (product_id, path, sort) values ($1::uuid, $2, $3)", [productId, path, sort]]),
    ];
    await tx(stmts, user.email);
    removed = old.map((o) => o.path).filter((p) => !images.includes(p));
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  await removeFiles(removed);

  refresh(productId!);
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return ok("اتحفظ ✓");
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const imgs = await query<{ path: string }>("select path from product_images where product_id = $1::uuid", [id]);
    await query("delete from products where id = $1::uuid", [id]);
    await removeFiles(imgs.map((i) => i.path));
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  redirect("/admin/products?deleted=1");
}

export async function toggleProductActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await query("update products set is_active = $2 where id = $1::uuid", [id, active]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh(id);
  return ok(active ? "المنتج ظاهر في الموقع." : "المنتج اتخفى من الموقع.");
}

/** Removes the sample products (code DEMO-…) and sample banners that came with the new store. */
export async function clearDemoData(): Promise<ActionState> {
  await assertAdmin();
  try {
    await tx([
      ["delete from products where sku like 'DEMO-%'"],
      ["delete from banners where image_path like '/placeholders/%'"],
    ]);
  } catch (e) {
    return fail(friendlyDbError(dbError(e)));
  }
  refresh();
  revalidatePath("/admin/settings");
  return ok("المنتجات والبانرات التجريبية اتمسحت ✓");
}
