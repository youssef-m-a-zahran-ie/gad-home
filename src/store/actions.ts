"use server";

import { headers } from "next/headers";
import { one, query } from "@/lib/db";

export type FreshItem = { id: string; name: string; price: number; stock: number; slug: string; image: string | null; active: boolean };

/** Current name, price and stock for the products in a cart (prices may have changed since they were added). */
export async function freshCart(ids: string[]): Promise<FreshItem[]> {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id) || /^p\d+$/.test(id)).slice(0, 60);
  if (!clean.length) return [];
  const rows = await query<{ id: string; name: string; price: number; stock: number; slug: string; is_active: boolean; image: string | null }>(
    `select p.id, p.name, p.price, p.stock, p.slug, p.is_active,
       (select i.path from product_images i where i.product_id = p.id order by i.sort limit 1) as image
     from products p where p.id::text = any($1::text[])`,
    [clean],
  );
  return clean.map((id) => {
    const r = rows.find((x) => x.id === id);
    if (!r) return { id, name: "", price: 0, stock: 0, slug: "", image: null, active: false };
    return { id, name: r.name, price: Number(r.price), stock: r.stock, slug: r.slug, image: r.image, active: r.is_active };
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
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const items = input.items.map((i) => ({ id: i.id, qty: Math.max(1, Math.min(99, Math.round(i.qty))) }));
  const customer = {
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
  };
  try {
    const row = await one<{ r: { id: string; number: number } }>(
      "select place_order($1::jsonb, $2::jsonb, $3) as r",
      [JSON.stringify(items), JSON.stringify(customer), ip],
    );
    if (!row?.r) throw new Error("empty");
    return { ok: true, id: row.r.id, number: row.r.number };
  } catch (e) {
    // Our own messages are Arabic; anything else gets a general one.
    const msg = (e as Error)?.message ?? "";
    return { ok: false, message: /[؀-ۿ]/.test(msg) ? msg : "حصلت مشكلة وإحنا بنسجل الطلب. جرب تاني أو كلمنا على واتساب." };
  }
}
