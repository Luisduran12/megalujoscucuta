-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Admin with completed two-step verification
create or replace function public.is_verified_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and public.has_role(auth.uid(), 'admin')
$$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to anon, authenticated;
grant execute on function public.is_verified_admin() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- First account ever created becomes the administrator
create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(424242);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created_assign_admin
after insert on auth.users for each row execute function public.assign_first_admin();

-- Products
create table public.products (
  id text primary key default gen_random_uuid()::text,
  ref text not null default '',
  name text not null,
  price integer not null default 0,
  old_price integer,
  category text not null,
  image_key text,
  image_url text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone can view products" on public.products for select to anon, authenticated using (true);
create policy "Verified admin inserts products" on public.products for insert to authenticated with check (public.is_verified_admin());
create policy "Verified admin updates products" on public.products for update to authenticated using (public.is_verified_admin()) with check (public.is_verified_admin());
create policy "Verified admin deletes products" on public.products for delete to authenticated using (public.is_verified_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

insert into public.products (id, ref, name, price, old_price, category, image_key, sort_order) values
('c1','CS-1001','Casco Thunder R integral negro/rojo brillo',759000,null,'cascos','cascos',1),
('c2','CS-1002','Casco Track SV gris mate fluor',559000,null,'cascos','casco2',2),
('c3','CS-1003','Casco Thunder R integral negro mate',759000,null,'cascos','cascos',3),
('c4','CS-1004','Casco Kombat urbano gris/amarillo',689000,null,'cascos','casco2',4),
('c5','CS-1005','Casco Rapid doble visor negro/rojo',499000,null,'cascos','cascos',5),
('j1','CH-2001','Chaqueta Rally Pro negro',899000,null,'chaquetas','indumentaria',6),
('j2','CH-2002','Chaqueta Rally Pro beige/negro',899000,null,'chaquetas','chaqueta2',7),
('j3','CH-2003','Chaqueta X-Duro impermeable verde militar',1150000,null,'chaquetas','chaqueta2',8),
('j4','CH-2004','Chaqueta X-Dry ventilada negro',720000,null,'chaquetas','indumentaria',9),
('j5','CH-2005','Chaqueta Touring invierno gris',980000,null,'chaquetas','indumentaria',10),
('p1','PA-3001','Pantalón MX Linear negro/rojo',420000,null,'pantalones','pantalon',11),
('p2','PA-3002','Pantalón X-Duro baggy impermeable negro',690000,null,'pantalones','pantalon',12),
('p3','PA-3003','Pantalón Atacama touring',610000,null,'pantalones','pantalon',13),
('p4','PA-3004','Pantalón MX Track rojo/negro',450000,null,'pantalones','pantalon',14),
('m1','MA-4001','Baúl S350 trasero 35 L',389000,null,'maletas','maletas',15),
('m2','MA-4002','Baúl Monolock 45 L con stop',529000,null,'maletas','maletas',16),
('m3','MA-4003','Bolsa sobre tanque magnética',265000,null,'bolsas','bolsas',17),
('m4','MA-4004','Bolsa tanklock expandible 20 L',349000,null,'bolsas','bolsas',18),
('l1','LI-5001','Kit limpieza moto Nano Tech',159000,null,'limpieza','limpieza',19),
('i1','IN-6001','Intercomunicador RiderSync B01',329000,null,'intercomunicadores','intercom',20),
('g1','GU-7001','Guantes Racing cuero negro/rojo',249000,null,'guantes','guantes',21),
('o1','OU-9001','Chaqueta X-Way negro',399000,799000,'chaquetas','indumentaria',22),
('o2','OU-9002','Casco Jarama cargo mate',359000,619000,'cascos','casco2',23),
('o3','OU-9003','Casco Braker Crazy negro/rojo',389000,699000,'cascos','cascos',24),
('o4','OU-9004','Guantes Touring invierno',119000,239000,'guantes','guantes',25),
('o5','OU-9005','Chaqueta Touring invierno beige',469000,939000,'chaquetas','chaqueta2',26);

-- Storage policies for product images (bucket created separately)
create policy "Public read product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "Verified admin uploads product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_verified_admin());
create policy "Verified admin updates product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_verified_admin());
create policy "Verified admin deletes product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_verified_admin());
