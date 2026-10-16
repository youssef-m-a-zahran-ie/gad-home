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

      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="container-page flex items-center gap-2 py-3 sm:gap-4 lg:py-4">
          <MobileMenu tops={tops} all={cats} />
          <Logo name={settings.store_name} logoPath={settings.logo_path} />
          <div className="hidden flex-1 md:block">
            <SearchBox className="mx-auto max-w-[620px]" />
          </div>
          <div className="ms-auto flex items-center gap-1 md:ms-0">
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="hidden min-h-[52px] items-center gap-2 rounded-full px-3 font-bold text-ink hover:bg-soft xl:inline-flex">
                <PhoneIcon size={24} />
                <span dir="ltr">{settings.phone}</span>
              </a>
            )}
            <CartButton />
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <SearchBox />
        </div>
        <nav aria-label="الأقسام" className="hidden lg:block">
          <ul className="container-page flex flex-wrap items-center gap-x-6 pb-2">
            <li>
              <Link href="/offers" className="inline-flex min-h-[48px] items-center text-[18px] font-extrabold text-sale hover:underline hover:underline-offset-8">
                العروض
              </Link>
            </li>
            {tops.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${encodeURIComponent(c.slug)}`} className="inline-flex min-h-[48px] items-center text-[18px] font-bold text-ink hover:text-blue">
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

      <footer className="no-print mt-12 bg-navy-2 pb-24 text-white lg:pb-0">
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
              <div className="flex flex-wrap gap-2 text-[17px] font-bold">
                {[
                  { href: settings.facebook, label: "فيسبوك" },
                  { href: settings.instagram, label: "إنستجرام" },
                  { href: settings.tiktok, label: "تيك توك" },
                ]
                  .filter((s) => s.href)
                  .map((s) => (
                    <a key={s.label} href={s.href!} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center rounded-full border-2 border-white/40 px-4 hover:bg-white/10">
                      {s.label}
                    </a>
                  ))}
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
