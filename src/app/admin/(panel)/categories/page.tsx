import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import type { CategoryRow } from "@/lib/supabase/database.types";
import { Empty, PageHead } from "@/components/admin/ui";
import { CategoryForm, CategoryRowItem } from "./category-form";

export const metadata: Metadata = { title: "الأقسام" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, parent_id, image_path, sort, is_active, show_on_home").order("sort").order("name"),
    supabase.from("products").select("category_id").limit(5000),
  ]);
  const cats = (data ?? []) as Pick<CategoryRow, "id" | "name" | "slug" | "parent_id" | "image_path" | "sort" | "is_active" | "show_on_home">[];
  const tops = cats.filter((c) => !c.parent_id);
  const counts = new Map<string, number>();
  for (const p of prods ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  return (
    <>
      <PageHead title="الأقسام" sub="الأقسام الرئيسية بتظهر في القائمة فوق، والأقسام الفرعية بتظهر جوه القسم الكبير." />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <div>
          {cats.length === 0 ? (
            <Empty text="لسه مفيش أقسام. ضيف أول قسم." />
          ) : (
            <ul className="grid gap-3">
              {tops.map((t) => (
                <li key={t.id} className="grid gap-2">
                  <ul className="grid gap-2">
                    <CategoryRowItem cat={t} tops={tops} count={counts.get(t.id) ?? 0} />
                    {cats.filter((c) => c.parent_id === t.id).map((c) => (
                      <CategoryRowItem key={c.id} cat={c} tops={tops} count={counts.get(c.id) ?? 0} child />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
        <section className="card grid gap-4 p-4 sm:p-5 lg:sticky lg:top-6">
          <h2 className="text-[22px]">قسم جديد</h2>
          <CategoryForm cat={null} tops={tops} />
        </section>
      </div>
    </>
  );
}
