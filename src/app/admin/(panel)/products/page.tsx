import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { egp, num } from "@/lib/format";
import type { CategoryRow, ProductRow } from "@/lib/supabase/database.types";
import { Empty, PageHead } from "@/components/admin/ui";
import { ProductImage } from "@/store/components/product-image";
import { categoryOptions } from "./options";

export const metadata: Metadata = { title: "المنتجات" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";

  let query = supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, stock, low_stock_at, is_active, is_best_seller, is_trending, category_id, product_images(path, sort)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (q) {
    const t = q.replace(/[%_,()*]/g, " ");
    query = query.or(`name.ilike.%${t}%,sku.ilike.%${t}%`);
  }
  if (cat === "none") query = query.is("category_id", null);
  else if (cat) query = query.eq("category_id", cat);

  const [{ data }, { data: catsData }] = await Promise.all([query, supabase.from("categories").select("id, name, parent_id").order("sort").order("name")]);
  const cats = (catsData ?? []) as Pick<CategoryRow, "id" | "name" | "parent_id">[];
  const products = (data ?? []) as unknown as (ProductRow & { product_images: { path: string; sort: number }[] })[];

  return (
    <>
      <PageHead
        title="المنتجات"
        sub={`${num(products.length)} منتج`}
        actions={<Link href="/admin/products/new" className="btn btn-primary">+ أضف منتج</Link>}
      />
      {sp.deleted && <p className="mb-4 rounded-xl bg-ok-bg px-4 py-3 text-[18px] font-bold text-ok">المنتج اتمسح.</p>}
      <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_260px_auto]" action="/admin/products">
        <input name="q" defaultValue={q} className="input" placeholder="ابحث باسم المنتج أو الكود" />
        <select name="cat" defaultValue={cat} className="input">
          <option value="">كل الأقسام</option>
          {categoryOptions(cats).map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
          <option value="none">بدون قسم</option>
        </select>
        <button className="btn btn-navy">بحث</button>
      </form>

      {products.length === 0 ? (
        <Empty text={q || cat ? "مفيش منتجات بالبحث ده." : "لسه مفيش منتجات."} href="/admin/products/new" cta="+ أضف أول منتج" />
      ) : (
        <ul className="grid gap-3">
          {products.map((p) => {
            const img = [...p.product_images].sort((a, b) => a.sort - b.sort)[0]?.path;
            const catName = cats.find((c) => c.id === p.category_id)?.name;
            return (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="card flex items-center gap-3 p-3 hover:border-blue sm:gap-4">
                  <ProductImage path={img} alt="" className="size-20 shrink-0 rounded-xl border border-line p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] leading-snug font-bold">{p.name}</p>
                    <p className="text-[16px] text-muted">{catName ?? "بدون قسم"}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!p.is_active && <span className="badge bg-[#6b7280] text-white">مخفي</span>}
                      {p.is_best_seller && <span className="badge bg-ok-bg text-ok">الأكثر مبيعاً</span>}
                      {p.is_trending && <span className="badge bg-sky text-navy">جديد</span>}
                      {!img && <span className="badge bg-warn-bg text-warn">من غير صور</span>}
                    </div>
                  </div>
                  <div className="grid shrink-0 justify-items-end gap-1 text-end">
                    <span className="text-[19px] font-extrabold">{egp(p.price)}</span>
                    <span className={`badge ${p.stock <= 0 ? "bg-[#fdecec] text-sale" : p.stock <= p.low_stock_at ? "bg-warn-bg text-warn" : "bg-soft text-ink"}`}>
                      {p.stock <= 0 ? "خلص" : `${num(p.stock)} قطعة`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
