import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import type { BannerRow, CategoryRow, GovernorateRow, SettingsRow } from "@/lib/supabase/database.types";

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

const CARD_COLS =
  "id, slug, name, price, compare_at_price, stock, is_best_seller, is_trending, category_id, created_at, sort, product_images(path, sort)";

type RawCard = {
  id: string; slug: string; name: string; price: number; compare_at_price: number | null; stock: number;
  is_best_seller: boolean; is_trending: boolean; category_id: string | null; created_at: string; sort: number;
  product_images: { path: string; sort: number }[] | null;
};

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
    images: [...(p.product_images ?? [])].sort((a, b) => a.sort - b.sort).map((i) => i.path),
  };
}

/** Every store read goes through here: marks the page dynamic so prices and stock are always fresh. */
async function db() {
  await connection();
  return createPublicClient();
}

const DEFAULT_SETTINGS: SettingsRow = {
  id: 1, store_name: "GAD Home", tagline: null, announcement: null, phone: null, whatsapp: null, instapay: null,
  wallet: null, address: null, facebook: null, instagram: null, tiktok: null, logo_path: null,
  free_shipping_over: null, min_order: 0, delivery_days: null, return_days: 14, updated_at: "",
};

export const getSettings = cache(async (): Promise<SettingsRow> => {
  const supabase = await db();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return (data as SettingsRow | null) ?? DEFAULT_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await db();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, name, slug, image_path, sort, show_on_home")
    .eq("is_active", true)
    .order("sort")
    .order("name");
  return (data ?? []) as Category[];
});

export const getBanners = cache(async (): Promise<BannerRow[]> => {
  const supabase = await db();
  const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("sort");
  return (data ?? []) as BannerRow[];
});

export const getGovernorates = cache(async (): Promise<GovernorateRow[]> => {
  const supabase = await db();
  const { data } = await supabase.from("governorates").select("*").eq("is_active", true).order("sort");
  return (data ?? []) as GovernorateRow[];
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
  const supabase = await db();
  let q = supabase.from("products").select(CARD_COLS).eq("is_active", true);
  if (f.categoryIds?.length) q = q.in("category_id", f.categoryIds);
  if (f.kind === "best") q = q.eq("is_best_seller", true);
  if (f.kind === "trending") q = q.eq("is_trending", true);
  if (f.kind === "offers") q = q.not("compare_at_price", "is", null);
  if (f.excludeId) q = q.neq("id", f.excludeId);
  if (f.q) {
    const term = f.q.replace(/[%_,()*]/g, " ").trim().slice(0, 60);
    if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  const sort = f.sort ?? (f.kind === "new" ? "new" : "default");
  if (sort === "price-asc") q = q.order("price", { ascending: true });
  else if (sort === "price-desc") q = q.order("price", { ascending: false });
  else if (sort === "new") q = q.order("created_at", { ascending: false });
  else q = q.order("sort", { ascending: true }).order("created_at", { ascending: false });
  q = q.limit(f.limit ?? 200);
  const { data } = await q;
  let rows = ((data ?? []) as unknown as RawCard[]).map(toCard);
  if (f.kind === "offers") rows = rows.filter((p) => p.compare_at_price != null && p.compare_at_price > p.price);
  // In stock first, so shoppers see what they can buy.
  return rows.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

export const getProduct = cache(async (slug: string): Promise<StoreProductFull | null> => {
  const supabase = await db();
  const { data } = await supabase
    .from("products")
    .select(`${CARD_COLS}, description, sku, low_stock_at`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  const raw = data as unknown as RawCard & { description: string | null; sku: string | null; low_stock_at: number };
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
  if (!/^[0-9a-f-]{36}$/i.test(id) && id !== "o1") return null;
  const supabase = await db();
  const { data } = await supabase.rpc("order_receipt", { p_id: id });
  return (data as Receipt | null) ?? null;
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
