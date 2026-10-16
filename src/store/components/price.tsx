import { discountPct, egp } from "@/lib/format";

export function Price({ price, compareAt, size = "md" }: { price: number; compareAt: number | null; size?: "md" | "lg" }) {
  const pct = discountPct(price, compareAt);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={`font-extrabold text-navy ${size === "lg" ? "text-[32px]" : "text-[22px]"}`}>{egp(price)}</span>
      {pct && compareAt && (
        <span className={`text-muted line-through ${size === "lg" ? "text-xl" : "text-base"}`}>{egp(compareAt)}</span>
      )}
    </div>
  );
}
