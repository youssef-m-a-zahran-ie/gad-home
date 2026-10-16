"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Category } from "../data";
import { ChevronLeft, MenuIcon, XIcon } from "./icons";

export function MobileMenu({ tops, all }: { tops: Category[]; all: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigating
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[52px] items-center gap-1 rounded-2xl px-2 font-bold text-navy hover:bg-sky lg:hidden"
        aria-label="القائمة والأقسام"
      >
        <MenuIcon size={30} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="الأقسام">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="إغلاق" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[22px] font-extrabold text-navy">الأقسام</p>
              <button type="button" onClick={() => setOpen(false)} className="grid size-12 place-items-center rounded-xl bg-sky text-navy" aria-label="إغلاق">
                <XIcon size={26} />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto py-2">
              {[
                { href: "/offers", name: "العروض والخصومات", hot: true },
                { href: "/best-sellers", name: "الأكثر مبيعاً" },
                { href: "/new", name: "وصل حديثاً" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`flex min-h-[56px] items-center justify-between px-5 text-[19px] font-bold ${l.hot ? "text-sale" : "text-navy"}`}>
                    {l.name}
                    <ChevronLeft size={22} />
                  </Link>
                </li>
              ))}
              <li className="my-2 border-t border-line" />
              {tops.map((c) => {
                const kids = all.filter((k) => k.parent_id === c.id);
                return (
                  <li key={c.id}>
                    <Link href={`/category/${encodeURIComponent(c.slug)}`} className="flex min-h-[56px] items-center justify-between px-5 text-[19px] font-bold text-ink">
                      {c.name}
                      <ChevronLeft size={22} />
                    </Link>
                    {kids.length > 0 && (
                      <ul className="mb-1 border-r-4 border-sky-2 me-5 ms-5">
                        {kids.map((k) => (
                          <li key={k.id}>
                            <Link href={`/category/${encodeURIComponent(k.slug)}`} className="flex min-h-[48px] items-center px-4 text-[17px] text-muted">
                              {k.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
