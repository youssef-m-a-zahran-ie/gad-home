import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { one, query } from "@/lib/db";
import type { BannerRow, CategoryRow, GovernorateRow, SettingsRow } from "@/lib/types";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_best_seller: boolean;
  is_trending: boolean;
  category_id: string | null;
  created_at: string;
  images: string[];
};

export type StoreProductFull = StoreProduct & {
  description: string | null;
  sku: string | null;
  low_stock_at: number;
};

export type Category = Pick<CategoryRow, "id" | "parent_id" | "name" | "slug" | "image_path" | "sort" | "show_on_home">;

type RawCard = {
  id: string; slug: string; name: string; price: number; compare_at_price: number | null; stock: number;
  is_best_seller: boolean; is_trending: boolean; category_id: string | null; created_at: string; sort: number;
  images: string[] | null;
};

const CARD_SQL = `p.id, p.slug, p.name, p.price, p.compare_at_price, p.stock, p.is_best_seller, p.is_trending,
  p.category_id, p.created_at, p.sort,
  coalesce((select array_agg(i.path order by i.sort) from product_images i where i.product_id = p.id), '{}') as images`;

function toCard(p: RawCard): StoreProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    compare_at_price: p.compare_at_price == null ? null : Number(p.compare_at_price),
    stock: p.stock,
    is_best_seller: p.is_best_seller,
    is_trending: p.is_trending,
    category_id: p.category_id,
    created_at: p.created_at,
    images: p.images ?? [],
  };
}

/** Every store read calls this first: marks the page dynamic so prices and stock are always fresh. */
async function live() {
  await connection();
}

const DEFAULT_SETTINGS: SettingsRow = {
  id: 1, store_name: "GAD Home", tagline: null, announcement: null, phone: null, whatsapp: null, instapay: null,
  wallet: null, address: null, facebook: null, instagram: null, tiktok: null, logo_path: null,
  free_shipping_over: null, min_order: 0, delivery_days: null, return_days: 14, updated_at: "",
};

export const getSettings = cache(async (): Promise<SettingsRow> => {
  await live();
  return (await one<SettingsRow>("select * from settings where id = 1")) ?? DEFAULT_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  await live();
  return query<Category>(
    "select id, parent_id, name, slug, image_path, sort, show_on_home from categories where is_active order by sort, name",
  );
});

export const getBanners = cache(async (): Promise<BannerRow[]> => {
  await live();
  return query<BannerRow>("select * from banners where is_active order by sort");
});

export const getGovernorates = cache(async (): Promise<GovernorateRow[]> => {
  await live();
  return query<GovernorateRow>("select * from governorates where is_active order by sort");
});

export type ProductFilter = {
  categoryIds?: string[];
  kind?: "best" | "trending" | "offers" | "new" | "all";
  q?: string;
  sort?: "new" | "price-asc" | "price-desc" | "default";
  limit?: number;
  excludeId?: string;
};

export async function listProducts(f: ProductFilter = {}): Promise<StoreProduct[]> {
  await live();
  const where = ["p.is_active"];
  const args: unknown[] = [];
  const arg = (v: unknown) => `$${args.push(v)}`;
  if (f.categoryIds?.length) where.push(`p.category_id = any(${arg(f.categoryIds)}::uuid[])`);
  if (f.kind === "best") where.push("p.is_best_seller");
  if (f.kind === "trending") where.push("p.is_trending");
  if (f.kind === "offers") where.push("p.compare_at_price is not null and p.compare_at_price > p.price");
  if (f.excludeId) where.push(`p.id <> ${arg(f.excludeId)}::uuid`);
  if (f.q) {
    const term = f.q.replace(/[%_\\]/g, " ").trim().slice(0, 60);
    if (term) {
      const t = arg(`%${term}%`);
      where.push(`(p.name ilike ${t} or p.description ilike ${t} or p.sku ilike ${t})`);
    }
  }
  const sort = f.sort ?? (f.kind === "new" ? "new" : "default");
  const order =
    sort === "price-asc" ? "p.price asc"
    : sort === "price-desc" ? "p.price desc"
    : sort === "new" ? "p.created_at desc"
    : "p.sort asc, p.created_at desc";
  const limit = Math.max(1, Math.min(500, Math.round(f.limit ?? 200)));
  const rows = await query<RawCard>(
    `select ${CARD_SQL} from products p where ${where.join(" and ")} order by ${order} limit ${limit}`,
    args,
  );
  // In stock first, so shoppers see what they can buy.
  return rows.map(toCard).sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

export const getProduct = cache(async (slug: string): Promise<StoreProductFull | null> => {
  await live();
  const raw = await one<RawCard & { description: string | null; sku: string | null; low_stock_at: number }>(
    `select ${CARD_SQL}, p.description, p.sku, p.low_stock_at from products p where p.slug = $1 and p.is_active`,
    [slug],
  );
  if (!raw) return null;
  return { ...toCard(raw), description: raw.description, sku: raw.sku, low_stock_at: raw.low_stock_at };
});

export type Receipt = {
  id: string;
  number: number;
  status: string;
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  payment: "cod" | "instapay";
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  items: { name: string; qty: number; price: number; image: string | null; line_total: number }[];
};

export async function getReceipt(id: string): Promise<Receipt | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await live();
  const row = await one<{ r: Receipt | null }>("select order_receipt($1::uuid) as r", [id]);
  return row?.r ?? null;
}

/** Category tree helpers */
export function topCategories(all: Category[]) {
  return all.filter((c) => !c.parent_id || !all.some((p) => p.id === c.parent_id));
}
export function childrenOf(all: Category[], id: string) {
  return all.filter((c) => c.parent_id === id);
}
/** A category and all its sub-categories (for listing products). */
export function withDescendants(all: Category[], id: string): string[] {
  const out = [id];
  for (const c of childrenOf(all, id)) out.push(...withDescendants(all, c.id));
  return out;
}
