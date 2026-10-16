import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { dateTime } from "@/lib/format";
import type { ProductRow, StockMovementRow } from "@/lib/supabase/database.types";
import { PageHead } from "@/components/admin/ui";
import { DeleteProduct, ProductForm } from "../product-form";
import type { CatOption } from "../options";

export const metadata: Metadata = { title: "تعديل منتج" };

const REASON: Record<string, string> = { manual: "تعديل يدوي", order: "طلب", cancel: "إلغاء طلب", restock: "بضاعة جديدة", correction: "تصحيح" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const created = (await searchParams).created;
  const { supabase } = await requireAdmin();
  const [{ data: p }, { data: imgs }, { data: cats }, { data: moves }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("path, sort").eq("product_id", id).order("sort"),
    supabase.from("categories").select("id, name, parent_id").order("sort").order("name"),
    supabase.from("stock_movements").select("*").eq("product_id", id).order("created_at", { ascending: false }).limit(15),
  ]);
  if (!p) notFound();
  const product = p as ProductRow;
  return (
    <>
      <Link href="/admin/products" className="text-[17px] font-bold text-blue hover:underline">→ كل المنتجات</Link>
      <div className="mt-3" />
      <PageHead
        title={product.name}
        actions={
          <Link href={`/product/${encodeURIComponent(product.slug)}`} target="_blank" className="btn btn-outline btn-sm">
            شوفه في الموقع ↗
          </Link>
        }
      />
      {created && <p className="mb-4 rounded-xl bg-ok-bg px-4 py-3 text-[18px] font-bold text-ok">المنتج اتضاف ✓</p>}
      <ProductForm product={product} images={(imgs ?? []).map((i) => i.path)} cats={(cats ?? []) as CatOption[]} />

      {(moves ?? []).length > 0 && (
        <section className="card mt-6 p-4 sm:p-5">
          <h2 className="mb-3 text-[22px]">آخر حركات المخزون</h2>
          <ul className="grid gap-2 text-[17px]">
            {(moves as StockMovementRow[]).map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span>
                  <b className={m.change > 0 ? "text-ok" : "text-sale"} dir="ltr">{m.change > 0 ? `+${m.change}` : m.change}</b> — {REASON[m.reason] ?? m.reason}
                  {m.note ? ` (${m.note})` : ""}
                </span>
                <span className="text-muted">{dateTime(m.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <DeleteProduct id={product.id} />
      </div>
    </>
  );
}
