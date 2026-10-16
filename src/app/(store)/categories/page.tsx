import type { Metadata } from "next";
import { getCategories, topCategories } from "@/store/data";
import { CategoryTiles } from "@/store/components/category-tiles";
import { Breadcrumbs, EmptyState } from "@/store/components/section";

export const metadata: Metadata = { title: "كل الأقسام" };

export default async function CategoriesPage() {
  const cats = await getCategories();
  const tops = topCategories(cats);
  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "كل الأقسام" }]} />
      <div className="container-page grid gap-8 py-5">
        <h1 className="text-[28px] sm:text-[34px]">كل الأقسام</h1>
        {tops.length ? <CategoryTiles cats={tops} /> : <EmptyState title="الأقسام هتنزل قريب" />}
        {tops
          .filter((t) => cats.some((c) => c.parent_id === t.id))
          .map((t) => (
            <section key={t.id} className="grid gap-4">
              <h2 className="text-[24px]">{t.name}</h2>
              <CategoryTiles cats={cats.filter((c) => c.parent_id === t.id)} />
            </section>
          ))}
      </div>
    </>
  );
}
