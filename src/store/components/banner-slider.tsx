"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/supabase/env";
import type { BannerRow } from "@/lib/supabase/database.types";
import { ChevronLeft, ChevronRight } from "./icons";

/** Banners side by side; the shopper moves them with the arrows or a swipe. No autoplay. */
export function BannerSlider({ banners }: { banners: BannerRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function go(i: number) {
    const el = ref.current;
    if (!el) return;
    const n = (i + banners.length) % banners.length;
    el.scrollTo({ left: -n * el.clientWidth, behavior: "smooth" });
    setIndex(n);
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
        }}
      >
        {banners.map((b, i) => {
          const desk = mediaUrl(b.image_path)!;
          const mob = mediaUrl(b.mobile_image_path) ?? desk;
          const img = (
            <picture>
              <source media="(min-width: 768px)" srcSet={desk} />
              { }
              <img src={mob} alt={b.title ?? ""} loading={i === 0 ? "eager" : "lazy"} className="block h-auto w-full" />
            </picture>
          );
          return (
            <div key={b.id} className="w-full shrink-0 snap-center">
              {b.link ? <Link href={b.link}>{img}</Link> : img}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow" aria-label="السابق">
            <ChevronRight size={28} />
          </button>
          <button type="button" onClick={() => go(index + 1)} className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow" aria-label="التالي">
            <ChevronLeft size={28} />
          </button>
          <div className="mt-3 flex justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                className={`h-3 rounded-full ${i === index ? "w-8 bg-navy" : "w-3 bg-sky-2"}`}
                aria-label={`صورة ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
