@AGENTS.md

# GAD Home: working notes

Custom e-commerce site + admin for GAD Home (household goods importer, sells across Egypt). Owner talks in Egyptian Arabic.

## Where things live
- **Code:** this repo, `main` deploys to Cloudflare Workers (OpenNext).
- **Live:** https://gad-home.youssef-m-a-zahran.workers.dev · admin at `/admin`.
- **Database:** Supabase project `home-store` (`ocsqswnttstxhhmidntj`, Frankfurt). Change it with a new file in `supabase/migrations`, apply it, then update `src/lib/supabase/database.types.ts` (hand-compacted types).

## Rules that matter
- Shoppers are older and not tech-savvy: Arabic only (RTL), big text (18px+ body, 54px buttons), plain Egyptian Arabic copy, no animations or hidden gestures, every action spelled out in words.
- Colors only from the tokens in `src/app/globals.css` (navy, blue, sky…). Font: Cairo.
- Every table has RLS; admin = email in `public.admins`. Every server action calls `assertAdmin()`.
- Shoppers never see `products.cost` (column grant) and never read orders; checkout goes through `place_order`.
- Stock changes only through `stock_movements` (or `set_stock`). Orders snapshot price and cost.
- Store data reads live in `src/store/data.ts` (call `connection()` so pages stay dynamic).
- The sandbox can't reach Supabase over HTTP: test SQL through the Supabase connector, and check layouts with `GAD_MOCK=1` (sample data in `src/lib/supabase/mock.ts`).
