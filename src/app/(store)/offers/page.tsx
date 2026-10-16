import type { Metadata } from "next";
import { listProducts } from "@/store/data";
import { Listing, parseSort } from "@/store/components/listing";

export const metadata: Metadata = { title: "العروض والخصومات" };

export default async function OffersPage({ searchParams }: PageProps<"/offers">) {
  const sort = parseSort((await searchParams).sort);
  const products = await listProducts({ kind: "offers", sort });
  return <Listing title="العروض والخصومات" crumbs={[{ label: "العروض" }]} products={products} sort={sort} basePath="/offers" emptyTitle="مفيش عروض دلوقتي" />;
}
