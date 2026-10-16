import type { Metadata } from "next";
import { listProducts } from "@/store/data";
import { Listing, parseSort } from "@/store/components/listing";
import { SearchBox } from "@/store/components/search-box";

export const metadata: Metadata = { title: "البحث", robots: { index: false } };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const sort = parseSort(sp.sort);
  const products = q ? await listProducts({ q, sort }) : [];
  return (
    <Listing
      title={q ? `نتايج البحث عن: ${q}` : "ابحث عن منتج"}
      crumbs={[{ label: "البحث" }]}
      products={products}
      sort={sort}
      basePath="/search"
      extraQuery={q ? { q } : {}}
      above={<SearchBox defaultValue={q} className="max-w-2xl" />}
      emptyTitle={q ? "مالقيناش حاجة بالاسم ده" : "اكتب اسم المنتج اللي بتدور عليه"}
      emptyText={q ? "جرب كلمة تانية أو أقصر، أو تصفح الأقسام." : undefined}
    />
  );
}

