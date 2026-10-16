"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { num } from "@/lib/format";
import { useCart } from "../cart";
import type { StoreProductFull } from "../data";
import { CartIcon, CheckIcon, WhatsAppIcon } from "./icons";
import { QtyStepper } from "./qty-stepper";

export function ProductBuy({ p, waHref }: { p: StoreProductFull; waHref: string | null }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = p.stock <= 0;
  const item = { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, stock: p.stock };

  return (
    <div className="grid gap-4">
      {soldOut ? (
        <p className="rounded-2xl bg-warn-bg px-4 py-3 text-[19px] font-bold text-warn">الكمية خلصت دلوقتي. كلمنا على واتساب ونبلغك أول ما ييجي.</p>
      ) : p.stock <= p.low_stock_at ? (
        <p className="text-[18px] font-bold text-warn">باقي {num(p.stock)} قطع بس</p>
      ) : (
        <p className="flex items-center gap-1 text-[18px] font-bold text-ok">
          <CheckIcon size={22} /> متوفر
        </p>
      )}

      {!soldOut && (
        <>
          <div className="flex items-center gap-4">
            <span className="text-[19px] font-bold">الكمية:</span>
            <QtyStepper value={qty} max={p.stock} onChange={(n) => setQty(Math.max(1, Math.min(p.stock, n)))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn btn-primary w-full text-[21px]" onClick={() => add(item, qty)}>
              <CartIcon size={26} /> أضف للسلة
            </button>
            <button
              type="button"
              className="btn btn-navy w-full text-[21px]"
              onClick={() => {
                add(item, qty);
                router.push("/checkout");
              }}
            >
              اطلب دلوقتي
            </button>
          </div>
        </>
      )}

      {waHref && (
        <a href={waHref} target="_blank" rel="noopener" className="btn btn-whatsapp w-full">
          <WhatsAppIcon size={26} /> {soldOut ? "اسأل عن المنتج على واتساب" : "عندك سؤال؟ كلمنا واتساب"}
        </a>
      )}
    </div>
  );
}
