import Link from "next/link";
import type { ReactNode } from "react";
import { num } from "@/lib/format";
import type { ProductFilter, StoreProduct } from "../data";
import { ProductGrid } from "./product-card";
import { Breadcrumbs, EmptyState } from "./section";

export type SortKey = NonNullable<ProductFilter["sort"]>;

export function parseSort(v: string | string[] | undefined): SortKey {
  return v === "new" || v === "price-asc" || v === "price-desc" ? v : "default";
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "المميز" },
  { key: "new", label: "الأحدث" },
  { key: "price-asc", label: "الأرخص" },
  { key: "price-desc", label: "الأغلى" },
];

export function Listing({
  title,
  crumbs,
  products,
  sort,
  basePath,
  extraQuery = {},
  above,
  emptyTitle = "مفيش منتجات هنا دلوقتي",
  emptyText = "منتجات جديدة بتنزل باستمرار، ارجع شوف قريب.",
}: {
  title: string;
  crumbs: { href?: string; label: string }[];
  products: StoreProduct[];
  sort: SortKey;
  basePath: string;
  extraQuery?: Record<string, string>;
  above?: ReactNode;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const link = (key: SortKey) => {
    const q = new URLSearchParams(extraQuery);
    if (key !== "default") q.set("sort", key);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, ...crumbs]} />
      <div className="container-page grid gap-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] sm:text-[34px]">{title}</h1>
            <p className="text-[17px] text-muted">{num(products.length)} منتج</p>
          </div>
        </div>
        {above}
        {products.length > 1 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="ترتيب المنتجات">
            <span className="text-[17px] font-bold text-muted">رتّب حسب:</span>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={link(s.key)}
                scroll={false}
                className={`inline-flex min-h-[44px] items-center rounded-xl border-2 px-4 text-[17px] font-bold ${
                  s.key === sort ? "border-blue bg-blue text-white" : "border-line text-navy hover:border-blue"
                }`}
                aria-current={s.key === sort ? "true" : undefined}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}
        {products.length ? (
          <ProductGrid products={products} eagerFirst={4} />
        ) : (
          <EmptyState
            title={emptyTitle}
            text={emptyText}
            action={
              <Link href="/" className="btn btn-primary">
                ارجع للرئيسية
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
