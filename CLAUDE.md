@AGENTS.md

# GAD Home: working notes

Custom e-commerce site + admin for GAD Home (household goods importer, sells across Egypt). Owner talks in Egyptian Arabic.

## Where things live
- **Code:** this repo, `main` deploys to Cloudflare Workers (OpenNext).
- **Live:** https://gad-home.youssef-m-a-zahran.workers.dev · admin at `/admin`.
- **Database:** Neon project `gad-home` (`solitary-mud-35472861`, db `neondb`). Change it with a new file in `db/migrations`, apply it (Neon MCP `run_sql`), then update `src/lib/types.ts` (hand-written row types). Photos: Neon Object Storage bucket `media`. Secrets (`DATABASE_URL`, storage keys, `ADMIN_SETUP_CODE`) are Cloudflare secrets, never committed.

## Rules that matter
- Shoppers are older and not tech-savvy: Arabic only (RTL), big text (18px+ body, 54px buttons), plain Egyptian Arabic copy, no animations or hidden gestures, every action spelled out in words.
- Colors only from the tokens in `src/app/globals.css` (navy, blue, sky…). Font: Noto Naskh Arabic, with Noto Serif for digits and Latin (free stand-in for Greta Arabic, which is paid).
- No RLS: the DB is only reached from server code (`src/lib/db`). Admin = email in `public.admins` with a live row in `admin_sessions`. Every admin server action calls `assertAdmin()`, every admin page `requireAdmin()`.
- Store queries (`src/store/data.ts`) must never select `products.cost`; checkout goes through `place_order`.
- Stock changes only through `stock_movements` (or `set_stock`). Orders snapshot price and cost.
- Store data reads live in `src/store/data.ts` (call `connection()` so pages stay dynamic).
- Test SQL through the Neon MCP connector (`run_sql`). Admin writes that touch stock go through `tx(stmts, email)` so `app.user_email` is set.
