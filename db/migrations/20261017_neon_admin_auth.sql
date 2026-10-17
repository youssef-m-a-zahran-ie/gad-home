-- Applied to Neon project gad-home (neondb) when GAD Home moved off Supabase.
-- The rest of the schema (tables, triggers, place_order, order_receipt, set_stock) was ported from db/supabase-history.
-- Supabase Auth is gone: admins sign in with a password stored here, and sessions live in admin_sessions.
-- is_admin() reads the app.user_email setting, set by the app inside transactions that change stock.
create extension if not exists pgcrypto;
alter table public.admins add column if not exists password_hash text;
create table if not exists public.admin_sessions (
  token_hash text primary key,
  email text not null references public.admins(email) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists admin_sessions_email_idx on public.admin_sessions(email);
create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  ip text,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on public.login_attempts(email, created_at desc);
