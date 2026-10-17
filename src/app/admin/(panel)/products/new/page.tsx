import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { query } from "@/lib/db";
import { PageHead } from "@/components/admin/ui";
import { ProductForm } from "../product-form";
import type { CatOption } from "../options";

export const metadata: Metadata = { title: "منتج جديد" };

export default async function NewProductPage() {
  await requireAdmin();
  const data = await query<CatOption>("select id, name, parent_id from categories order by sort, name");
  return (
    <>
      <Link href="/admin/products" className="text-[17px] font-bold text-blue hover:underline">→ كل المنتجات</Link>
      <div className="mt-3" />
      <PageHead title="إضافة منتج جديد" />
      <ProductForm product={null} images={[]} cats={data} />
    </>
  );
}
