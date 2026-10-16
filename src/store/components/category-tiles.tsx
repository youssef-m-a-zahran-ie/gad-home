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
