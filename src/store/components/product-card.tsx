"use client";

import Link from "next/link";
import { discountPct } from "@/lib/format";
import { useCart } from "../cart";
import type { StoreProduct } from "../data";
import { CartIcon } from "./icons";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({ p, eager = false }: { p: StoreProduct; eager?: boolean }) {
  const { add } = useCart();
  const pct = discountPct(p.price, p.compare_at_price);
  const soldOut = p.stock <= 0;
  const href = `/product/${encodeURIComponent(p.slug)}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-white">
      <Link href={href} className="relative block">
        <ProductImage path={p.images[0]} alt={p.name} eager={eager} className="aspect-square w-full" />
        <div className="absolute inset-x-2 top-2 flex flex-wrap justify-between gap-1">
          {pct ? <span className="badge bg-sale text-white">خصم {pct}%</span> : <span />}
          {soldOut ? (
            <span className="badge bg-ink/80 text-white">خلصت الكمية</span>
          ) : p.is_best_seller ? (
            <span className="badge bg-ok text-white">الأكثر مبيعاً</span>
          ) : p.is_trending ? (
            <span className="badge bg-navy text-white">جديد</span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Link href={href} className="line-clamp-2 min-h-[2.75em] text-[17px] leading-snug font-semibold text-ink hover:text-blue sm:text-[18px]">
          {p.name}
        </Link>
        <div className="mt-auto">
          <Price price={p.price} compareAt={p.compare_at_price} />
        </div>
        {soldOut ? (
          <Link href={href} className="btn btn-outline btn-sm w-full">
            التفاصيل
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm w-full gap-1.5 px-2 whitespace-nowrap"
            onClick={() =>
              add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images[0] ?? null, stock: p.stock })
            }
          >
            <CartIcon size={22} className="hidden min-[400px]:block" />
            أضف للسلة
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, eagerFirst = 0 }: { products: StoreProduct[]; eagerFirst?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} eager={i < eagerFirst} />
      ))}
    </div>
  );
}
