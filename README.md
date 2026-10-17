# GAD Home

متجر أدوات منزلية أونلاين + لوحة تحكم، على نفس الدومين. Online store for household goods, with its admin at `/admin`.

- **Stack:** Next.js 16 (App Router) · Neon (Postgres database + Object Storage for photos), own admin login · Cloudflare Workers via OpenNext
- **Design:** Arabic only, right-to-left, blue theme, Noto Naskh Arabic font, big text and buttons, no animations. Built for shoppers who aren't used to apps.

## What's in it

**Store:** home (banners, categories, offers, best sellers, new arrivals, a section per category), all categories, category pages with sub-categories and sorting, search, product page (photos, stock, quantity, add to cart / order now / ask on WhatsApp), cart, one-page checkout (name, phone, governorate, city, address; cash on delivery or InstaPay/wallet), thank-you page with the order number and InstaPay instructions, shipping & returns page. Phone-only bottom bar (Home, Categories, Offers, Cart) and a WhatsApp button.

**Admin (`/admin`):** dashboard (today / this month, new orders, stock alerts), orders (filter by status, search by number/phone/name, change status, mark paid, notes, call/WhatsApp the customer, print), products (photos, price, price before discount, cost, stock, category, best seller / new flags, hide), inventory ("goods arrived" adds pieces, "edit count" after counting, history per product), categories and sub-categories, shipping fee per governorate, settings (store info, logo, top bar text, phone/WhatsApp/InstaPay, free shipping threshold, minimum order, banners, admin emails, password).

## Database

Neon project **gad-home** (`solitary-mud-35472861`, database `neondb`). The app talks to it only from server code through `@neondatabase/serverless` (`src/lib/db`), using the `DATABASE_URL` secret, so the connection string never reaches the browser. SQL history: `db/supabase-history` (original schema, from the Supabase days) and `db/migrations` (changes made on Neon).

- There is no row-level security: security = server-only database access + `assertAdmin()` in every admin server action (and `requireAdmin()` in admin pages).
- Checkout calls `place_order(items, customer, ip)`: it re-prices from the database, checks and takes stock, adds the governorate fee (or free shipping), and saves the order in one transaction. The browser only sends product ids and quantities.
- Stock changes only through `stock_movements` (a trigger updates `products.stock`). Cancelling an order puts its items back; un-cancelling takes them out again. Admin writes that touch stock run in a transaction that sets `app.user_email` so `created_by` is filled.
- Orders keep a snapshot of name, price and cost. `order_receipt(id)` is what the thank-you page shows (order ids are random UUIDs).

## Admin login

Own login (no third-party auth): `admins.password_hash` (bcrypt via pgcrypto), sessions in `admin_sessions` (only a SHA-256 of the cookie token is stored), HttpOnly cookie `gad_admin`, 14 days, 8 wrong tries per 15 minutes per email.

1. An admin adds another admin from **الإعدادات** with a temporary password; the new admin changes it after signing in.
2. An email in the admin list with no password yet can create one at `/admin/login` → **أول مرة؟** using the `ADMIN_SETUP_CODE` secret.
3. Forgot password: another admin removes and re-adds the email with a new password.

## Photos

Neon Object Storage bucket `media` (public read). The admin converts photos to WebP in the browser, a server action (`src/app/admin/upload.ts`) uploads them with the storage credential and the database stores the full public URL. Photos uploaded before the move are bare paths, served from the old Supabase Storage base (`NEXT_PUBLIC_LEGACY_MEDIA_BASE_URL`) until they are copied over.

## Run locally

```bash
npm install
npm run dev                 # http://localhost:3000, admin at /admin
npm run preview             # production build in the Cloudflare runtime
```

## Deploy to Cloudflare

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick `gad-home`.
2. Build command: `npx opennextjs-cloudflare build` · Deploy command: `npx opennextjs-cloudflare deploy`.
3. Add the secrets (Settings → Variables and Secrets, or `wrangler secret put`): `DATABASE_URL`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `ADMIN_SETUP_CODE`. Public values live in `wrangler.jsonc` and `.env.production`.
4. When a custom domain is added, update `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` and `.env.production`.

## Sample data

The new store came with sample content so it doesn't look empty: 36 products with code `DEMO-…`, two banners and category pictures, all using the drawings in `public/placeholders/` (marked «صورة توضيحية»). Admin → المنتجات has a button that deletes the sample products and banners in one go. Category pictures stay until replaced from Admin → الأقسام.

## Ads

Ad links can carry `?utm_source=facebook&utm_campaign=<name>`; the source is saved on the order (Facebook clicks are detected automatically) and shown in the admin.
