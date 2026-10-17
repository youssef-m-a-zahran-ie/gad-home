-- Admin sign-up needs no confirmation email: only emails on the admin list can be
-- confirmed this way, and the login page only offers sign-up for those emails.
create or replace function public.autoconfirm_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.admins a where a.email = lower(new.email)) then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  end if;
  return new;
end;
$$;
revoke execute on function public.autoconfirm_admin() from public, anon, authenticated;

create trigger autoconfirm_admin before insert on auth.users
  for each row execute function public.autoconfirm_admin();
