-- Home store: initial schema.
-- Every table has RLS on. Admin = signed-in user whose email is in public.admins.
-- Shoppers read visible catalog rows directly; orders go only through place_order().

-- ---------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_admin_email(p_email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.email = lower(trim(p_email)));
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- Store settings (one row)
-- ---------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'متجر الأدوات المنزلية',
  tagline text default 'كل اللي بيتك محتاجه في مكان واحد',
  announcement text default 'الدفع كاش عند الاستلام • شحن لكل محافظات مصر',
  phone text default '',
  whatsapp text default '',
  instapay text default '',
  wallet text default '',
  address text default '',
  facebook text default '',
  instagram text default '',
  tiktok text default '',
  logo_path text,
  free_shipping_over numeric(12,2),
  min_order numeric(12,2) not null default 0,
  delivery_days text default 'من ٢ إلى ٥ أيام عمل',
  return_days int not null default 14,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- Home page banners
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  mobile_image_path text,
  link text,
  title text,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique,
  image_path text,
  sort int not null default 0,
  is_active boolean not null default true,
  show_on_home boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique,
  sku text,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  stock int not null default 0,
  low_stock_at int not null default 3,
  is_active boolean not null default true,
  is_best_seller boolean not null default false,
  is_trending boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(is_active, created_at desc);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort);

-- Stock history: every change to stock is logged here; a trigger keeps products.stock in step.
create table public.stock_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  change int not null,
  reason text not null check (reason in ('manual','order','cancel','restock','correction')),
  order_id uuid,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);
create index stock_movements_product_idx on public.stock_movements(product_id, created_at desc);

create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.products set stock = stock + new.change where id = new.product_id;
  return new;
end;
$$;
create trigger stock_movements_apply after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- Admin sets stock to an exact number: logs the difference.
create or replace function public.set_stock(p_product uuid, p_stock int, p_note text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_current int;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_stock < 0 then raise exception 'المخزون لا يمكن أن يكون أقل من صفر'; end if;
  select stock into v_current from public.products where id = p_product for update;
  if not found then raise exception 'المنتج غير موجود'; end if;
  if p_stock <> v_current then
    insert into public.stock_movements (product_id, change, reason, note, created_by)
    values (p_product, p_stock - v_current, 'manual', p_note, auth.jwt() ->> 'email');
  end if;
  return p_stock;
end;
$$;

-- ---------------------------------------------------------------
-- Shipping: one fee per governorate
-- ---------------------------------------------------------------
create table public.governorates (
  id serial primary key,
  name text not null unique,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  is_active boolean not null default true,
  sort int not null default 0
);

insert into public.governorates (name, fee, sort) values
  ('القاهرة', 60, 1), ('الجيزة', 60, 2), ('القليوبية', 70, 3), ('الإسكندرية', 75, 4),
  ('البحيرة', 80, 5), ('الغربية', 80, 6), ('المنوفية', 80, 7), ('الدقهلية', 80, 8),
  ('الشرقية', 80, 9), ('كفر الشيخ', 85, 10), ('دمياط', 85, 11), ('بورسعيد', 85, 12),
  ('الإسماعيلية', 85, 13), ('السويس', 85, 14), ('الفيوم', 90, 15), ('بني سويف', 90, 16),
  ('المنيا', 95, 17), ('أسيوط', 100, 18), ('سوهاج', 100, 19), ('قنا', 110, 20),
  ('الأقصر', 110, 21), ('أسوان', 120, 22), ('البحر الأحمر', 120, 23), ('مطروح', 120, 24),
  ('الوادي الجديد', 130, 25), ('شمال سيناء', 130, 26), ('جنوب سيناء', 130, 27);

-- ---------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------
create type public.order_status as enum ('new','confirmed','shipped','delivered','cancelled');
create type public.payment_method as enum ('cod','instapay');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int generated always as identity (start with 1001) unique,
  status public.order_status not null default 'new',
  customer_name text not null,
  phone text not null,
  phone2 text,
  governorate_id int references public.governorates(id),
  governorate text not null,
  city text not null,
  address text not null,
  notes text,
  payment_method public.payment_method not null default 'cod',
  paid boolean not null default false,
  subtotal numeric(12,2) not null,
  shipping numeric(12,2) not null,
  total numeric(12,2) not null,
  admin_note text,
  utm_source text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders(created_at desc);
create index orders_status_idx on public.orders(status, created_at desc);
create index orders_phone_idx on public.orders(phone);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  image_path text,
  price numeric(12,2) not null,
  cost numeric(12,2),
  qty int not null check (qty > 0),
  line_total numeric(12,2) not null
);
create index order_items_order_idx on public.order_items(order_id);

-- Cancelling an order puts its items back in stock; un-cancelling takes them out again.
create or replace function public.order_status_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    insert into public.stock_movements (product_id, change, reason, order_id, created_by)
    select i.product_id, i.qty, 'cancel', new.id, auth.jwt() ->> 'email'
    from public.order_items i where i.order_id = new.id and i.product_id is not null;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    insert into public.stock_movements (product_id, change, reason, order_id, created_by)
    select i.product_id, -i.qty, 'order', new.id, auth.jwt() ->> 'email'
    from public.order_items i where i.order_id = new.id and i.product_id is not null;
  end if;
  return new;
end;
$$;
create trigger orders_status_stock after update of status on public.orders
  for each row execute function public.order_status_stock();

-- Checkout. The browser sends product ids and quantities only; prices, stock and
-- shipping are all worked out here, in one transaction.
create or replace function public.place_order(
  p_items jsonb,            -- [{ "id": uuid, "qty": int }]
  p_customer jsonb,         -- { name, phone, phone2, governorate_id, city, address, notes, payment, utm_source, utm_campaign }
  p_ip text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_order_id uuid;
  v_number int;
  v_gov public.governorates%rowtype;
  v_settings public.settings%rowtype;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_name text := trim(coalesce(p_customer->>'name',''));
  v_phone text := regexp_replace(translate(coalesce(p_customer->>'phone',''), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '[^0-9]', '', 'g');
  v_phone2 text := nullif(regexp_replace(translate(coalesce(p_customer->>'phone2',''), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '[^0-9]', '', 'g'), '');
  v_city text := trim(coalesce(p_customer->>'city',''));
  v_address text := trim(coalesce(p_customer->>'address',''));
  v_payment public.payment_method := case when p_customer->>'payment' = 'instapay' then 'instapay'::public.payment_method else 'cod'::public.payment_method end;
  r record;
  v_lines jsonb := '[]'::jsonb;
  v_missing text[] := '{}';
  v_recent int;
begin
  if v_phone ~ '^20' and length(v_phone) = 12 then v_phone := '0' || substr(v_phone, 3); end if;

  if length(v_name) < 2 then raise exception 'اكتب اسمك'; end if;
  if v_phone !~ '^01[0125][0-9]{8}$' then raise exception 'رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01'; end if;
  if length(v_city) < 2 then raise exception 'اكتب المدينة أو المنطقة'; end if;
  if length(v_address) < 5 then raise exception 'اكتب العنوان بالتفصيل'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'السلة فاضية'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'عدد المنتجات كبير'; end if;

  -- Simple flood guard: max 5 orders per phone per hour.
  select count(*) into v_recent from public.orders where phone = v_phone and created_at > now() - interval '1 hour';
  if v_recent >= 5 then raise exception 'تم استلام طلبات كتير من الرقم ده. كلمنا على واتساب'; end if;

  select * into v_gov from public.governorates where id = nullif(p_customer->>'governorate_id','')::int and is_active;
  if not found then raise exception 'اختار المحافظة'; end if;
  select * into v_settings from public.settings where id = 1;

  -- Lock products, check stock, price lines.
  for r in
    select p.id, p.name, p.price, p.cost, p.stock, p.is_active, x.qty,
           (select pi.path from public.product_images pi where pi.product_id = p.id order by pi.sort, pi.created_at limit 1) as image_path
    from (
      select (e->>'id')::uuid as id, sum(greatest(1, least(99, coalesce((e->>'qty')::int, 1))))::int as qty
      from jsonb_array_elements(p_items) e group by 1
    ) x
    join public.products p on p.id = x.id
    order by p.id
    for update of p
  loop
    if not r.is_active then
      v_missing := v_missing || r.name;
    elsif r.stock < r.qty then
      v_missing := v_missing || (r.name || case when r.stock > 0 then ' (المتاح ' || r.stock || ' بس)' else ' (خلص)' end);
    else
      v_lines := v_lines || jsonb_build_object('product_id', r.id, 'name', r.name, 'image_path', r.image_path,
                                               'price', r.price, 'cost', r.cost, 'qty', r.qty);
      v_subtotal := v_subtotal + r.price * r.qty;
    end if;
  end loop;

  if array_length(v_missing, 1) > 0 then
    raise exception 'المنتجات دي مش متاحة بالكمية المطلوبة: %', array_to_string(v_missing, '، ');
  end if;
  if jsonb_array_length(v_lines) = 0 then raise exception 'المنتجات دي مش متاحة دلوقتي'; end if;
  if v_subtotal < v_settings.min_order then
    raise exception 'أقل قيمة للطلب % جنيه', v_settings.min_order;
  end if;

  v_shipping := case when v_settings.free_shipping_over is not null and v_subtotal >= v_settings.free_shipping_over then 0 else v_gov.fee end;

  insert into public.orders (customer_name, phone, phone2, governorate_id, governorate, city, address, notes,
                             payment_method, subtotal, shipping, total, utm_source, utm_campaign)
  values (left(v_name, 120), v_phone, v_phone2, v_gov.id, v_gov.name, left(v_city, 120), left(v_address, 500),
          left(nullif(trim(coalesce(p_customer->>'notes','')), ''), 1000), v_payment,
          v_subtotal, v_shipping, v_subtotal + v_shipping,
          left(nullif(p_customer->>'utm_source',''), 60), left(nullif(p_customer->>'utm_campaign',''), 120))
  returning id, number into v_order_id, v_number;

  insert into public.order_items (order_id, product_id, name, image_path, price, cost, qty, line_total)
  select v_order_id, (l->>'product_id')::uuid, l->>'name', l->>'image_path', (l->>'price')::numeric,
         (l->>'cost')::numeric, (l->>'qty')::int, (l->>'price')::numeric * (l->>'qty')::int
  from jsonb_array_elements(v_lines) l;

  insert into public.stock_movements (product_id, change, reason, order_id)
  select (l->>'product_id')::uuid, -(l->>'qty')::int, 'order', v_order_id
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'number', v_number);
end;
$$;

-- What the thank-you page may show (the order id is an unguessable uuid).
create or replace function public.order_receipt(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'status', o.status, 'name', o.customer_name,
    'phone', o.phone, 'governorate', o.governorate, 'city', o.city, 'address', o.address,
    'payment', o.payment_method, 'subtotal', o.subtotal, 'shipping', o.shipping, 'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'qty', i.qty, 'price', i.price, 'image', i.image_path, 'line_total', i.line_total))
                       from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o where o.id = p_id;
$$;

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.banners enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.stock_movements enable row level security;
alter table public.governorates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$
declare t text;
begin
  foreach t in array array['admins','settings','banners','categories','products','product_images',
                           'stock_movements','governorates','orders','order_items'] loop
    execute format('create policy "admin full access" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

create policy "public read" on public.settings for select to anon, authenticated using (true);
create policy "public read active" on public.banners for select to anon, authenticated using (is_active);
create policy "public read active" on public.categories for select to anon, authenticated using (is_active);
create policy "public read active" on public.products for select to anon, authenticated using (is_active);
create policy "public read" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "public read active" on public.governorates for select to anon, authenticated using (is_active);

-- Shoppers never see cost.
revoke select on public.products from anon;
grant select (id, category_id, name, slug, sku, description, price, compare_at_price, stock, low_stock_at,
              is_active, is_best_seller, is_trending, sort, created_at, updated_at) on public.products to anon;

-- Function permissions
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_email(text) to anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.order_receipt(uuid) to anon, authenticated;
grant execute on function public.set_stock(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------
-- Storage: one public bucket for all images; only admins write.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admins update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy "admins delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

insert into public.admins (email) values ('youzah1221@gmail.com');
