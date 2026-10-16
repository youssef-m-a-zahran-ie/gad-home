import Link from "next/link";
import { getBanners, getCategories, getSettings, listProducts, topCategories, withDescendants } from "@/store/data";
import { BannerSlider } from "@/store/components/banner-slider";
import { CategoryTiles } from "@/store/components/category-tiles";
import { ProductGrid } from "@/store/components/product-card";
import { Section } from "@/store/components/section";
import { TrustBadges } from "@/store/components/trust-badges";
import type { StoreProduct } from "@/store/data";

/** Four on phones (two rows), eight on bigger screens. */
function HomeGrid({ products }: { products: StoreProduct[] }) {
  return (
    <div className="[&>div>*:nth-child(n+5)]:hidden md:[&>div>*:nth-child(n+5)]:block">
      <ProductGrid products={products.slice(0, 8)} />
    </div>
  );
}

export default async function HomePage() {
  const [settings, banners, cats, offers, best, fresh] = await Promise.all([
    getSettings(),
    getBanners(),
    getCategories(),
    listProducts({ kind: "offers", limit: 24 }),
    listProducts({ kind: "best", limit: 8 }),
    listProducts({ kind: "new", limit: 8 }),
  ]);
  const tops = topCategories(cats);
  const homeCats = tops.filter((c) => c.show_on_home).slice(0, 6);
  const perCat = await Promise.all(
    homeCats.map(async (c) => ({ c, products: await listProducts({ categoryIds: withDescendants(cats, c.id), limit: 8 }) })),
  );

  return (
    <>
      <div className="container-page pt-4">
        {banners.length > 0 ? (
          <BannerSlider banners={banners} />
        ) : (
          <div className="grid gap-4 rounded-3xl bg-gradient-to-l from-navy to-blue px-6 py-10 text-white sm:px-10 sm:py-14">
            <h1 className="text-[32px] text-white sm:text-[44px]">{settings.store_name}</h1>
            <p className="max-w-xl text-[20px] text-white/90 sm:text-[22px]">
              {settings.tagline || "كل اللي بيتك محتاجه في مكان واحد"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/offers" className="btn bg-white text-navy hover:bg-sky">
                شوف العروض
              </Link>
              <Link href="/categories" className="btn border-2 border-white/70 text-white hover:bg-white/10">
                كل الأقسام
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="container-page pt-6">
        <TrustBadges deliveryDays={settings.delivery_days} returnDays={settings.return_days} />
      </div>

      {tops.length > 0 && (
        <Section title="تسوق حسب الأقسام" href="/categories">
          <CategoryTiles cats={tops.slice(0, 12)} />
        </Section>
      )}

      {offers.length > 0 && (
        <Section title="العروض والخصومات" href="/offers" tone="soft">
          <HomeGrid products={offers} />
        </Section>
      )}

      {best.length > 0 && (
        <Section title="الأكثر مبيعاً" href="/best-sellers">
          <HomeGrid products={best} />
        </Section>
      )}

      {fresh.length > 0 && (
        <Section title="وصل حديثاً" href="/new" tone="soft">
          <HomeGrid products={fresh} />
        </Section>
      )}

      {perCat
        .filter((x) => x.products.length > 0)
        .map(({ c, products }, i) => (
          <Section key={c.id} title={c.name} href={`/category/${encodeURIComponent(c.slug)}`} tone={i % 2 ? "soft" : "white"}>
            <HomeGrid products={products} />
          </Section>
        ))}
    </>
  );
}
