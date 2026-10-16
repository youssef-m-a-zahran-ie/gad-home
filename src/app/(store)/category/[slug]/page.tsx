import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { childrenOf, getCategories, listProducts, withDescendants } from "@/store/data";
import { SubCategoryChips } from "@/store/components/category-tiles";
import { Listing, parseSort } from "@/store/components/listing";

async function find(slugParam: string) {
  const slug = decodeURIComponent(slugParam);
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === slug);
  return { cats, cat };
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { cat } = await find((await params).slug);
  return { title: cat?.name ?? "قسم" };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { cats, cat } = await find((await params).slug);
  if (!cat) notFound();
  const sort = parseSort((await searchParams).sort);
  const parent = cat.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const kids = childrenOf(cats, cat.id);
  // On a sub-category, keep its siblings in view so switching is one tap.
  const chips = kids.length ? kids : parent ? childrenOf(cats, parent.id) : [];
  const products = await listProducts({ categoryIds: withDescendants(cats, cat.id), sort });

  return (
    <Listing
      title={cat.name}
      crumbs={[
        { href: "/categories", label: "الأقسام" },
        ...(parent ? [{ href: `/category/${encodeURIComponent(parent.slug)}`, label: parent.name }] : []),
        { label: cat.name },
      ]}
      products={products}
      sort={sort}
      basePath={`/category/${encodeURIComponent(cat.slug)}`}
      above={<SubCategoryChips cats={chips} activeSlug={cat.slug} />}
    />
  );
}
