import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { discountPct, egp, waLink } from "@/lib/format";
import { mediaUrl } from "@/lib/supabase/env";
import { getCategories, getProduct, getSettings, listProducts } from "@/store/data";
import { Gallery } from "@/store/components/gallery";
import { Price } from "@/store/components/price";
import { ProductBuy } from "@/store/components/product-buy";
import { ProductGrid } from "@/store/components/product-card";
import { Breadcrumbs, Section } from "@/store/components/section";
import { TrustBadges } from "@/store/components/trust-badges";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = await getProduct(decodeURIComponent((await params).slug));
  if (!p) return { title: "منتج غير موجود" };
  const img = mediaUrl(p.images[0]);
  return {
    title: p.name,
    description: (p.description ?? `${p.name} بسعر ${egp(p.price)}`).slice(0, 160),
    openGraph: { title: p.name, images: img ? [img] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const p = await getProduct(decodeURIComponent((await params).slug));
  if (!p) notFound();
  const [settings, cats] = await Promise.all([getSettings(), getCategories()]);
  const cat = cats.find((c) => c.id === p.category_id);
  const parent = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const related = cat ? await listProducts({ categoryIds: [cat.id], excludeId: p.id, limit: 8 }) : [];
  const pct = discountPct(p.price, p.compare_at_price);
  const wa = waLink(settings.whatsapp, `السلام عليكم، عايز أسأل عن: ${p.name}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "الرئيسية" },
          ...(parent ? [{ href: `/category/${encodeURIComponent(parent.slug)}`, label: parent.name }] : []),
          ...(cat ? [{ href: `/category/${encodeURIComponent(cat.slug)}`, label: cat.name }] : []),
          { label: p.name },
        ]}
      />
      <div className="container-page grid gap-6 py-5 md:grid-cols-2 md:gap-10">
        <div className="relative">
          <Gallery images={p.images} name={p.name} />
          {pct && <span className="badge absolute top-3 right-3 bg-sale px-3 text-[17px] text-white">خصم {pct}%</span>}
        </div>
        <div className="grid content-start gap-5">
          <h1 className="text-[26px] sm:text-[32px]">{p.name}</h1>
          <div className="grid gap-1">
            <Price price={p.price} compareAt={p.compare_at_price} size="lg" />
            {pct && p.compare_at_price && (
              <p className="text-[18px] font-bold text-sale">هتوفّر {egp(p.compare_at_price - p.price)}</p>
            )}
          </div>
          <ProductBuy p={p} waHref={wa} />
          <TrustBadges deliveryDays={settings.delivery_days} returnDays={settings.return_days} compact />
        </div>
      </div>

      {p.description && (
        <section className="container-page py-4">
          <div className="card p-5 sm:p-7">
            <h2 className="mb-3 text-[24px]">تفاصيل المنتج</h2>
            <div className="text-[19px] leading-loose whitespace-pre-line text-ink">{p.description}</div>
            {p.sku && <p className="mt-3 text-[16px] text-muted">كود المنتج: {p.sku}</p>}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <Section title="منتجات شبهه" href={cat ? `/category/${encodeURIComponent(cat.slug)}` : undefined} tone="soft">
          <ProductGrid products={related.slice(0, 8)} />
        </Section>
      )}
    </>
  );
}
