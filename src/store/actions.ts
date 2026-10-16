"use server";

import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/server";

export type FreshItem = { id: string; name: string; price: number; stock: number; slug: string; image: string | null; active: boolean };

/** Current name, price and stock for the products in a cart (prices may have changed since they were added). */
export async function freshCart(ids: string[]): Promise<FreshItem[]> {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id) || /^p\d+$/.test(id)).slice(0, 60);
  if (!clean.length) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, price, stock, slug, is_active, product_images(path, sort)")
    .in("id", clean);
  const rows = (data ?? []) as unknown as {
    id: string; name: string; price: number; stock: number; slug: string; is_active: boolean;
    product_images: { path: string; sort: number }[] | null;
  }[];
  return clean.map((id) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return { id, name: "", price: 0, stock: 0, slug: "", image: null, active: false };
    const img = [...(r.product_images ?? [])].sort((a, b) => a.sort - b.sort)[0]?.path ?? null;
    return { id, name: r.name, price: Number(r.price), stock: r.stock, slug: r.slug, image: img, active: r.is_active };
  });
}

export type OrderInput = {
  items: { id: string; qty: number }[];
  name: string;
  phone: string;
  phone2: string;
  governorate_id: string;
  city: string;
  address: string;
  notes: string;
  payment: "cod" | "instapay";
  utm_source?: string;
  utm_campaign?: string;
};

export type OrderResult = { ok: true; id: string; number: number } | { ok: false; message: string };

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const supabase = createPublicClient();
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { data, error } = await supabase.rpc("place_order", {
    p_items: input.items.map((i) => ({ id: i.id, qty: Math.max(1, Math.min(99, Math.round(i.qty))) })),
    p_customer: {
      name: input.name,
      phone: input.phone,
      phone2: input.phone2,
      governorate_id: input.governorate_id,
      city: input.city,
      address: input.address,
      notes: input.notes,
      payment: input.payment,
      utm_source: input.utm_source ?? "",
      utm_campaign: input.utm_campaign ?? "",
    },
    p_ip: ip ?? undefined,
  });
  if (error || !data) {
    // Our own messages are Arabic; anything else gets a general one.
    const msg = error?.message ?? "";
    return { ok: false, message: /[؀-ۿ]/.test(msg) ? msg : "حصلت مشكلة وإحنا بنسجل الطلب. جرب تاني أو كلمنا على واتساب." };
  }
  const res = data as { id: string; number: number };
  return { ok: true, id: res.id, number: res.number };
}
