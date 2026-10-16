import type { Metadata } from "next";
import { listProducts } from "@/store/data";
import { Listing, parseSort } from "@/store/components/listing";

export const metadata: Metadata = { title: "الأكثر مبيعاً" };

export default async function BestPage({ searchParams }: PageProps<"/best-sellers">) {
  const sort = parseSort((await searchParams).sort);
  const products = await listProducts({ kind: "best", sort });
  return <Listing title="الأكثر مبيعاً" crumbs={[{ label: "الأكثر مبيعاً" }]} products={products} sort={sort} basePath="/best-sellers" />;
}
