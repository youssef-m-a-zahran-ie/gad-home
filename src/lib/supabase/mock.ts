// Local preview only: GAD_MOCK=1 swaps Supabase for fixed sample data so pages can be
// rendered where the database isn't reachable. Filters are applied loosely (eq / in / ilike);
// writes do nothing. Never enabled in production.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const MOCK = process.env.GAD_MOCK === "1";

type Row = Record<string, unknown>;

const now = new Date().toISOString();
const cats: Row[] = [
  { id: "c1", parent_id: null, name: "رفايع المطبخ", slug: "kitchen-tools", image_path: "/placeholders/c-kitchen-tools.webp", sort: 1, is_active: true, show_on_home: true },
  { id: "c2", parent_id: null, name: "الصواني", slug: "trays", image_path: "/placeholders/c-trays.webp", sort: 2, is_active: true, show_on_home: true },
  { id: "c3", parent_id: null, name: "أدوات التنظيف والغسيل", slug: "cleaning", image_path: "/placeholders/c-cleaning.webp", sort: 3, is_active: true, show_on_home: true },
  { id: "c4", parent_id: null, name: "أدوات المائدة", slug: "tableware", image_path: "/placeholders/c-tableware.webp", sort: 4, is_active: true, show_on_home: true },
  { id: "c5", parent_id: "c2", name: "صواني ستانلس", slug: "steel-trays", image_path: null, sort: 1, is_active: true, show_on_home: false },
  { id: "c6", parent_id: "c2", name: "صواني بلاستيك", slug: "plastic-trays", image_path: null, sort: 2, is_active: true, show_on_home: false },
];
const names = [
  ["مقشرة خضار ستانلس", 45, 60, 40],
  ["طقم سباتولا سيليكون ٥ قطع بألوان مختلفة", 185, 230, 2],
  ["مضرب بيض يدوي", 55, null, 30],
  ["صينية فرن ستانلس مستطيلة ٤٠ سم", 320, 390, 15],
  ["صينية تقديم بلاستيك", 75, null, 0],
  ["مساحة أرضيات دوارة بالجردل", 450, 550, 10],
  ["طقم علب حفظ طعام زجاج ٣ قطع", 390, 450, 20],
  ["طقم كاسات تركي ٦ قطع", 280, null, 12],
] as const;
const products: Row[] = names.map(([name, price, cmp, stock], i) => ({
  id: `p${i + 1}`,
  category_id: cats[i % 4].id,
  name,
  slug: `product-${i + 1}`,
  sku: `DEMO-${i + 1}`,
  description: "منتج عملي وخامة ممتازة.\nسهل التنظيف ومناسب للاستخدام اليومي.",
  price,
  compare_at_price: cmp,
  cost: Math.round(Number(price) * 0.6),
  stock,
  low_stock_at: 3,
  is_active: true,
  is_best_seller: i % 2 === 0,
  is_trending: i % 3 === 0,
  sort: 0,
  created_at: now,
  updated_at: now,
  product_images: [1, 2].map((k) => ({ path: `/placeholders/p-${cats[i % 4].slug}-${((i + k) % 3) + 1}.webp`, sort: k })),
  categories: { name: cats[i % 4].name, slug: cats[i % 4].slug },
}));
const govs: Row[] = [
  { id: 1, name: "القاهرة", fee: 60, is_active: true, sort: 1 },
  { id: 2, name: "الجيزة", fee: 60, is_active: true, sort: 2 },
  { id: 3, name: "الإسكندرية", fee: 75, is_active: true, sort: 3 },
];
const items: Row[] = [
  { id: "i1", order_id: "o1", product_id: "p1", name: "مقشرة خضار ستانلس", image_path: null, price: 45, cost: 25, qty: 2, line_total: 90 },
  { id: "i2", order_id: "o1", product_id: "p6", name: "مساحة أرضيات دوارة بالجردل", image_path: null, price: 450, cost: 300, qty: 1, line_total: 450 },
];
const orders: Row[] = [
  {
    id: "o1", number: 1002, status: "new", customer_name: "أم أحمد", phone: "01012345678", phone2: null,
    governorate_id: 1, governorate: "القاهرة", city: "مدينة نصر", address: "١٢ شارع عباس العقاد، الدور ٣",
    notes: "الاتصال بعد العصر", payment_method: "cod", paid: false, subtotal: 540, shipping: 60, total: 600,
    admin_note: null, utm_source: "facebook", utm_campaign: null, created_at: now, updated_at: now, order_items: items,
  },
  {
    id: "o2", number: 1001, status: "shipped", customer_name: "محمد علي", phone: "01112223334", phone2: "01223334445",
    governorate_id: 3, governorate: "الإسكندرية", city: "سموحة", address: "شارع النصر عمارة ٤",
    notes: null, payment_method: "instapay", paid: true, subtotal: 320, shipping: 75, total: 395,
    admin_note: "اتشحن مع بوسطة", utm_source: null, utm_campaign: null, created_at: now, updated_at: now, order_items: items.slice(0, 1),
  },
];
const settings: Row = {
  id: 1, store_name: "GAD Home", tagline: "كل اللي بيتك محتاجه في مكان واحد",
  announcement: "الدفع كاش عند الاستلام • شحن لكل محافظات مصر", phone: "01001296513", whatsapp: "01001296513",
  instapay: "01001296513", wallet: "01001296513", address: "", facebook: "", instagram: "", tiktok: "", logo_path: null,
  free_shipping_over: 1500, min_order: 0, delivery_days: "من ٢ إلى ٥ أيام عمل", return_days: 14, updated_at: now,
};

const tables: Record<string, Row[]> = {
  categories: cats,
  products,
  product_images: [],
  governorates: govs,
  orders,
  order_items: items,
  settings: [settings],
  banners: ["offers", "shipping"].map((k, i) => ({
    id: `b${i}`, image_path: `/placeholders/banner-${k}.webp`, mobile_image_path: `/placeholders/banner-${k}-m.webp`,
    link: "/offers", title: null, sort: i, is_active: true, created_at: now,
  })),
  admins: [{ email: "admin@example.com", created_at: now }],
  stock_movements: [
    { id: 1, product_id: "p1", change: -2, reason: "order", order_id: "o1", note: null, created_by: null, created_at: now, products: { name: "مقشرة خضار ستانلس" } },
  ],
};

function builder(table: string) {
  let rows = [...(tables[table] ?? [])];
  let one: "single" | "maybe" | null = null;
  let head = false;
  const api: Record<string, unknown> = {};
  const self = () => api;
  const chain = (fn?: (r: Row[]) => Row[]) => () => {
    if (fn) rows = fn(rows);
    return api;
  };
  Object.assign(api, {
    select: (_c?: string, opts?: { head?: boolean }) => {
      if (opts?.head) head = true;
      return api;
    },
    eq: (col: string, v: unknown) => chain((r) => r.filter((x) => !(col in x) || x[col] === v))(),
    in: (col: string, v: unknown[]) => chain((r) => r.filter((x) => !(col in x) || v.includes(x[col])))(),
    ilike: chain(),
    like: chain(),
    neq: chain(),
    is: chain(),
    or: chain(),
    not: chain(),
    gt: chain(),
    gte: chain(),
    lt: chain(),
    lte: chain(),
    filter: chain(),
    order: chain(),
    limit: (n: number) => chain((r) => r.slice(0, n))(),
    range: (a: number, b: number) => chain((r) => r.slice(a, b + 1))(),
    insert: self,
    update: self,
    upsert: self,
    delete: self,
    single: () => ((one = "single"), api),
    maybeSingle: () => ((one = "maybe"), api),
    then: (resolve: (v: unknown) => unknown) => {
      const data = head ? null : one ? (rows[0] ?? null) : rows;
      return Promise.resolve({ data, error: null, count: rows.length }).then(resolve);
    },
  });
  return api;
}

export function createMockClient(): SupabaseClient<Database> {
  const client = {
    from: (t: string) => builder(t),
    rpc: (fn: string) => {
      const data =
        fn === "order_receipt"
          ? { ...orders[0], name: orders[0].customer_name, payment: "instapay", items: items.map((i) => ({ ...i, image: null })) }
          : fn === "place_order"
            ? { id: "o1", number: 1002 }
            : true;
      return Promise.resolve({ data, error: null });
    },
    auth: {
      getUser: async () => ({ data: { user: { email: "admin@example.com" } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    storage: { from: () => ({ remove: async () => ({ error: null }) }) },
  };
  return client as unknown as SupabaseClient<Database>;
}
