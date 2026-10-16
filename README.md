# GAD Home

متجر أدوات منزلية أونلاين + لوحة تحكم، على نفس الدومين. Online store for household goods, with its admin at `/admin`.

- **Stack:** Next.js 16 (App Router) · Supabase (database, auth, photos) · Cloudflare Workers via OpenNext
- **Design:** Arabic only, right-to-left, blue theme, Cairo font, big text and buttons, no animations. Built for shoppers who aren't used to apps.

## What's in it

**Store:** home (banners, categories, offers, best sellers, new arrivals, a section per category), all categories, category pages with sub-categories and sorting, search, product page (photos, stock, quantity, add to cart / order now / ask on WhatsApp), cart, one-page checkout (name, phone, governorate, city, address; cash on delivery or InstaPay/wallet), thank-you page with the order number and InstaPay instructions, shipping & returns page. Phone-only bottom bar (Home, Categories, Offers, Cart) and a WhatsApp button.

**Admin (`/admin`):** dashboard (today / this month, new orders, stock alerts), orders (filter by status, search by number/phone/name, change status, mark paid, notes, call/WhatsApp the customer, print), products (photos, price, price before discount, cost, stock, category, best seller / new flags, hide), inventory ("goods arrived" adds pieces, "edit count" after counting, history per product), categories and sub-categories, shipping fee per governorate, settings (store info, logo, top bar text, phone/WhatsApp/InstaPay, free shipping threshold, minimum order, banners, admin emails, password).

## Database

Supabase project **home-store** (`ocsqswnttstxhhmidntj`, Frankfurt). Migrations in `supabase/migrations`, already applied.

- Every table has RLS. Admin = signed-in user whose email is in `public.admins`. Every server action calls `assertAdmin()`.
- Shoppers can read active categories, products (no cost column), photos, banners, governorates and settings. They can't read orders.
- Checkout calls `place_order(items, customer)`: it re-prices from the database, checks and takes stock, adds the governorate fee (or free shipping), and saves the order in one transaction. The browser only sends product ids and quantities.
- Stock changes only through `stock_movements` (a trigger updates `products.stock`). Cancelling an order puts its items back; un-cancelling takes them out again.
- Orders keep a snapshot of name, price and cost.
- `order_receipt(id)` is what the thank-you page shows (order ids are random UUIDs).
- Admin emails are confirmed on sign-up automatically (trigger on `auth.users`), so no confirmation email is needed.

## Admin access

1. Open `/admin/login` → **أول مرة؟ اعمل الحساب** → use an email from the admin list (starts with youzah1221@gmail.com).
2. Add more admins from **الإعدادات → مين يقدر يدخل لوحة التحكم**.

## Run locally

```bash
npm install
npm run dev                 # http://localhost:3000, admin at /admin
GAD_MOCK=1 npm run dev      # sample data, no database needed (for checking layouts)
npm run preview             # production build in the Cloudflare runtime
```

## Deploy to Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick `gad-home`.
2. Build command: `npx opennextjs-cloudflare build` · Deploy command: `npx opennextjs-cloudflare deploy`.
3. In Supabase → **Authentication → URL Configuration**, set the Site URL to the live address and add `https://<domain>/**` to the redirect URLs (needed for "forgot password" emails).
4. When a custom domain is added, update `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` and `.env.production`.

## Ads

Ad links can carry `?utm_source=facebook&utm_campaign=<name>`; the source is saved on the order (Facebook clicks are detected automatically) and shown in the admin.
