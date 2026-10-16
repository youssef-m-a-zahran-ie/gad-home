import Link from "next/link";
import type { ReactNode } from "react";
import { waLink } from "@/lib/format";
import { CartProvider } from "../cart";
import { getCategories, getSettings, topCategories } from "../data";
import { AddedToast } from "./added-toast";
import { BottomNav } from "./bottom-nav";
import { CartButton } from "./cart-button";
import { PhoneIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { SearchBox } from "./search-box";
import { UtmCapture } from "./utm-capture";
import { WhatsAppFloat } from "./whatsapp-float";

export async function StoreShell({ children }: { children: ReactNode }) {
  const [settings, cats] = await Promise.all([getSettings(), getCategories()]);
  const tops = topCategories(cats);
  const wa = waLink(settings.whatsapp, `السلام عليكم، عندي سؤال عن منتج في ${settings.store_name}`);

  return (
    <CartProvider>
      <UtmCapture />
      <a href="#content" className="sr-only z-[80] rounded-xl bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:right-3">
        تخطى للمحتوى
      </a>

      {settings.announcement && (
        <div className="bg-navy px-4 py-2 text-center text-[16px] font-bold text-white sm:text-[17px]">{settings.announcement}</div>
      )}

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="container-page flex items-center gap-2 py-2.5 sm:gap-4">
          <MobileMenu tops={tops} all={cats} />
          <Logo name={settings.store_name} logoPath={settings.logo_path} />
          <div className="hidden flex-1 md:block">
            <SearchBox className="mx-auto max-w-2xl" />
          </div>
          <div className="ms-auto flex items-center gap-2 md:ms-0">
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="hidden items-center gap-2 rounded-2xl px-3 py-2 font-bold text-navy hover:bg-sky xl:inline-flex" dir="ltr">
                <PhoneIcon size={22} />
                {settings.phone}
              </a>
            )}
            <CartButton />
          </div>
        </div>
        <div className="container-page pb-2.5 md:hidden">
          <SearchBox />
        </div>
        <nav aria-label="الأقسام" className="hidden border-t border-line lg:block">
          <ul className="container-page flex flex-wrap items-center gap-x-1 py-1">
            <li>
              <Link href="/offers" className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-[18px] font-extrabold text-sale hover:bg-sky">
                العروض
              </Link>
            </li>
            <li>
              <Link href="/best-sellers" className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-[18px] font-bold text-navy hover:bg-sky">
                الأكثر مبيعاً
              </Link>
            </li>
            <li>
              <Link href="/new" className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-[18px] font-bold text-navy hover:bg-sky">
                وصل حديثاً
              </Link>
            </li>
            {tops.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${encodeURIComponent(c.slug)}`} className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-[18px] font-bold text-ink hover:bg-sky hover:text-navy">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="content" className="min-h-[60vh] pb-24 lg:pb-0">
        {children}
      </main>

      <footer className="no-print mt-12 bg-navy pb-24 text-white lg:pb-0">
        <div className="container-page grid gap-8 py-10 md:grid-cols-3">
          <div className="grid content-start gap-3">
            <Logo name={settings.store_name} logoPath={settings.logo_path} light />
            {settings.tagline && <p className="text-[17px] text-white/85">{settings.tagline}</p>}
            {settings.address && <p className="text-[16px] text-white/75">{settings.address}</p>}
          </div>
          <div>
            <p className="mb-3 text-[20px] font-extrabold">روابط مهمة</p>
            <ul className="grid gap-2 text-[17px]">
              <li><Link href="/categories" className="hover:underline">كل الأقسام</Link></li>
              <li><Link href="/offers" className="hover:underline">العروض والخصومات</Link></li>
              <li><Link href="/policies" className="hover:underline">الشحن والاستبدال والاسترجاع</Link></li>
              <li><Link href="/cart" className="hover:underline">سلة المشتريات</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[20px] font-extrabold">كلمنا</p>
            <div className="grid gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp btn-sm justify-start">
                  <WhatsAppIcon size={24} /> واتساب
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="btn btn-sm justify-start bg-white/10 text-white hover:bg-white/20">
                  <PhoneIcon size={22} /> <span dir="ltr">{settings.phone}</span>
                </a>
              )}
              <div className="flex flex-wrap gap-3 text-[16px] text-white/85">
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener" className="underline">فيسبوك</a>}
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener" className="underline">إنستجرام</a>}
                {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener" className="underline">تيك توك</a>}
              </div>
            </div>
          </div>
        </div>
        <p className="border-t border-white/15 py-4 text-center text-[15px] text-white/70">
          © {new Date().getFullYear()} {settings.store_name}. كل الحقوق محفوظة.
        </p>
      </footer>

      <WhatsAppFloat href={wa} />
      <BottomNav />
      <AddedToast />
    </CartProvider>
  );
}
