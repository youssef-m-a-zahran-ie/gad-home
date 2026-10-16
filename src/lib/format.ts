const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** 1250 → "1,250 جنيه" */
export function egp(n: number | string | null | undefined) {
  return `${nf.format(Number(n ?? 0))} جنيه`;
}

export function num(n: number | string | null | undefined) {
  return nf.format(Number(n ?? 0));
}

/** Percent saved, rounded; null when there's no real discount. */
export function discountPct(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const dtf = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});
export function dateTime(iso: string) {
  return dtf.format(new Date(iso));
}

const df = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
export function dateOnly(iso: string) {
  return df.format(new Date(iso));
}

/** Egyptian mobile → international digits for wa.me links. */
export function waNumber(phone: string | null | undefined) {
  const d = (phone ?? "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.startsWith("20")) return d;
  if (d.startsWith("0")) return `2${d}`;
  return `20${d}`;
}

export function waLink(phone: string | null | undefined, text?: string) {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Arabic-friendly URL name from a product or category name. */
export function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80) || "item";
}
