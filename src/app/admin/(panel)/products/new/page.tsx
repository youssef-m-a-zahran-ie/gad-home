import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { PageHead } from "@/components/admin/ui";
import { ProductForm } from "../product-form";
import type { CatOption } from "../options";

export const metadata: Metadata = { title: "منتج جديد" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id, name, parent_id").order("sort").order("name");
  return (
    <>
      <Link href="/admin/products" className="text-[17px] font-bold text-blue hover:underline">→ كل المنتجات</Link>
      <div className="mt-3" />
      <PageHead title="إضافة منتج جديد" />
      <ProductForm product={null} images={[]} cats={(data ?? []) as CatOption[]} />
    </>
  );
}
