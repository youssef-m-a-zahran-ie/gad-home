"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { num } from "@/lib/format";
import { useCart } from "../cart";
import { CartIcon, GridIcon, HomeIcon, TagIcon } from "./icons";

const LINKS = [
  { href: "/", label: "الرئيسية", Icon: HomeIcon },
  { href: "/categories", label: "الأقسام", Icon: GridIcon },
  { href: "/offers", label: "العروض", Icon: TagIcon },
  { href: "/cart", label: "السلة", Icon: CartIcon },
];

/** Phone-only bar with the four places people need most, always in reach of the thumb. */
export function BottomNav() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  if (pathname.startsWith("/checkout")) return null;
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="تنقل سريع"
    >
      <ul className="grid grid-cols-4">
        {LINKS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-[15px] font-bold ${active ? "text-blue" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={26} />
                {label}
                {href === "/cart" && ready && count > 0 && (
                  <span className="absolute top-1.5 left-[calc(50%-26px)] grid min-w-6 place-items-center rounded-full bg-sale px-1 text-[13px] leading-6 font-extrabold text-white">
                    {num(count)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
