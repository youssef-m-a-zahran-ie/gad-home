import type { Metadata } from "next";
import { listProducts } from "@/store/data";
import { Listing, parseSort } from "@/store/components/listing";

export const metadata: Metadata = { title: "وصل حديثاً" };

export default async function NewPage({ searchParams }: PageProps<"/new">) {
  const s = parseSort((await searchParams).sort);
  const sort = s === "default" ? "new" : s;
  // Trending picks first, then everything else by date.
  const [trend, latest] = await Promise.all([listProducts({ kind: "trending", sort }), listProducts({ kind: "new", sort, limit: 60 })]);
  const seen = new Set(trend.map((p) => p.id));
  const products = s === "default" ? [...trend, ...latest.filter((p) => !seen.has(p.id))] : [...trend, ...latest.filter((p) => !seen.has(p.id))].sort((a, b) =>
    sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : b.created_at.localeCompare(a.created_at),
  );
  return <Listing title="وصل حديثاً" crumbs={[{ label: "وصل حديثاً" }]} products={products} sort={s} basePath="/new" />;
}
