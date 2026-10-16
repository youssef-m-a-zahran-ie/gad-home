import Link from "next/link";
import { getBanners, getCategories, getSettings, listProducts, topCategories, withDescendants } from "@/store/data";
import { BannerSlider } from "@/store/components/banner-slider";
import { CategoryPromo, CategoryStrip } from "@/store/components/category-tiles";
import { ProductCard, ProductGrid } from "@/store/components/product-card";
import { Section } from "@/store/components/section";
import { TrustBadges } from "@/store/components/trust-badges";
import type { Category, StoreProduct } from "@/store/data";

/** Four on phones (two rows), eight on bigger screens. */
function HomeGrid({ products }: { products: StoreProduct[] }) {
  return (
    <div className="[&>div>*:nth-child(n+5)]:hidden md:[&>div>*:nth-child(n+5)]:block">
      <ProductGrid products={products.slice(0, 8)} />
    </div>
  );
}

/** The category's picture card first, then its products: three more on phones, seven on bigger screens. */
function CategoryShelf({ c, products }: { c: Category; products: StoreProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 [&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+5)]:block">
      <CategoryPromo c={c} />
      {products.slice(0, 7).map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
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
    homeCats.map(async (c) => ({ c, products: await listProducts({ categoryIds: withDescendants(cats, c.id), limit: 7 }) })),
  );

  return (
    <div className="-mb-12 bg-soft pb-4">
      <div className="container-page py-5 sm:py-6">
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

      {tops.length > 0 && (
        <nav aria-label="الأقسام" className="bg-white py-5 sm:py-6">
          <div className="container-page">
            <h2 className="sr-only">الأقسام</h2>
            <CategoryStrip cats={tops.slice(0, 16)} />
          </div>
        </nav>
      )}

      {offers.length > 0 && (
        <Section title="العروض والخصومات" href="/offers" tone="soft">
          <HomeGrid products={offers} />
        </Section>
      )}

      {best.length > 0 && (
        <Section title="الأكثر مبيعاً" href="/best-sellers" tone="soft">
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
        .map(({ c, products }) => (
          <Section key={c.id} title={`تسوق ${c.name}`} href={`/category/${encodeURIComponent(c.slug)}`} tone="soft">
            <CategoryShelf c={c} products={products} />
          </Section>
        ))}

      <Section title={`ليه تشتري من ${settings.store_name}؟`} tone="soft">
        <TrustBadges variant="cards" deliveryDays={settings.delivery_days} returnDays={settings.return_days} />
      </Section>
    </div>
  );
}
