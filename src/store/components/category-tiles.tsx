import Link from "next/link";
import { mediaUrl } from "@/lib/supabase/env";
import type { Category } from "../data";
import { BoxIcon } from "./icons";

export function CategoryTiles({ cats }: { cats: Category[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {cats.map((c) => {
        const src = mediaUrl(c.image_path);
        return (
          <li key={c.id}>
            <Link
              href={`/category/${encodeURIComponent(c.slug)}`}
              className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-white p-3 text-center hover:border-blue hover:bg-sky"
            >
              <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-sky">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <BoxIcon size={48} strokeWidth={1.4} className="text-navy/50" />
                )}
              </span>
              <span className="text-[18px] leading-snug font-extrabold text-navy">{c.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Home page categories use simple photo cards that stay clear at phone size. */
export function CategoryStrip({ cats }: { cats: Category[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-y-3 sm:gap-y-4">
      {cats.map((c) => {
        const src = mediaUrl(c.image_path);
        return (
          <li key={c.id} className="w-1/3 px-1 sm:w-1/4 md:w-1/6 lg:w-[12.5%]">
            <Link
              href={`/category/${encodeURIComponent(c.slug)}`}
              className="flex h-full flex-col gap-2 rounded-xl border border-line bg-white p-2 text-center transition-colors hover:border-blue hover:bg-soft"
            >
              <span className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg bg-sky">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <BoxIcon size={36} strokeWidth={1.5} className="text-navy/50" />
                )}
              </span>
              <span className="text-[16px] leading-snug font-bold text-ink sm:text-[17px]">{c.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Tall picture card that opens a category; sits first in that category's row of products. */
export function CategoryPromo({ c }: { c: Category }) {
  const src = mediaUrl(c.image_path);
  return (
    <Link
      href={`/category/${encodeURIComponent(c.slug)}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-navy text-center text-white hover:bg-navy-2"
    >
      <span className="grid justify-items-center gap-3 px-3 pt-5 pb-4">
        <span className="text-[20px] leading-snug font-extrabold sm:text-[26px]">
          {c.name}
          <br />
          في مكان واحد
        </span>
        <span className="rounded-full bg-white px-4 py-1.5 text-[17px] font-bold text-navy">اشتري دلوقتي</span>
      </span>
      <span className="mt-auto grid aspect-[4/3] place-items-center overflow-hidden bg-navy-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <BoxIcon size={56} strokeWidth={1.4} className="text-white/50" />
        )}
      </span>
    </Link>
  );
}

/** Row of sub-category buttons on a category page. */
export function SubCategoryChips({ cats, activeSlug }: { cats: Category[]; activeSlug?: string }) {
  if (!cats.length) return null;
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {cats.map((c) => (
        <li key={c.id} className="shrink-0">
          <Link
            href={`/category/${encodeURIComponent(c.slug)}`}
            className={`inline-flex min-h-[48px] items-center rounded-full border-2 px-5 text-[17px] font-bold ${
              c.slug === activeSlug ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-blue"
            }`}
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
