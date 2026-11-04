-- ====================================================================
-- MEGALUJOS CÚCUTA (Tuning y Accesorios)
-- Esquema Completo de Base de Datos y Seguridad (Supabase + Vercel)
-- ====================================================================
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase (https://app.supabase.com)
-- 2. Entra en "SQL Editor" en el menú lateral izquierdo
-- 3. Pega todo este contenido y presiona "RUN"
-- 4. En Supabase -> "Authentication" -> "MFA", activa "App Authenticator (TOTP)"
-- ====================================================================

-- 1. ROLES Y USUARIOS
create type public.app_role as enum ('admin', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "Users read own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- Función para verificar si un usuario tiene un rol específico
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- Función de seguridad que comprueba si el usuario es administrador
-- Y TIENE EL SEGUNDO PASO DE AUTENTICACIÓN (AAL2 / TOTP) ACTIVO
create or replace function public.is_verified_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and public.has_role(auth.uid(), 'admin')
$$;

-- Función para consultar si ya existe al menos un administrador registrado
create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;

grant execute on function public.admin_exists() to anon, authenticated;
grant execute on function public.is_verified_admin() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Trigger: SOLO los dos correos autorizados de la tienda pueden ser Administradores.
-- Cualquier otro correo que intente registrarse queda sin rol: el panel le muestra
-- "Acceso restringido" y la base de datos le niega toda escritura (RLS).
create or replace function public.assign_admin_by_allowlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null
     and lower(new.email) in ('jose13.jm446@gmail.com', 'luisduran-1210@outlook.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_admin on auth.users;
create trigger on_auth_user_created_assign_admin
after insert on auth.users for each row execute function public.assign_admin_by_allowlist();


-- 2. TABLA DE PRODUCTOS
create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  ref text not null default '',
  name text not null,
  price integer not null default 0,
  old_price integer,
  category text not null,
  image_key text,
  image_url text,
  sort_order integer not null default 0,
  colors jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "Cualquiera puede ver productos"
  on public.products for select to anon, authenticated using (true);

create policy "Solo admin verificado crea productos"
  on public.products for insert to authenticated
  with check (public.is_verified_admin());

create policy "Solo admin verificado edita productos"
  on public.products for update to authenticated
  using (public.is_verified_admin())
  with check (public.is_verified_admin());

create policy "Solo admin verificado elimina productos"
  on public.products for delete to authenticated
  using (public.is_verified_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();


-- 3. ALMACENAMIENTO DE IMÁGENES (STORAGE BUCKET)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Lectura pública de fotos de productos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Solo admin verificado sube fotos de productos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_verified_admin());

create policy "Solo admin verificado actualiza fotos de productos"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_verified_admin());

create policy "Solo admin verificado elimina fotos de productos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_verified_admin());


-- 4. PRODUCTOS INICIALES DE MEGALUJOS CÚCUTA
insert into public.products (id, ref, name, price, old_price, category, image_key, sort_order, colors) values
('esp-1', 'ESP-101', 'Espejos Tipo Tomok Aluminio CNC', 85000, 110000, 'espejos', 'tienda', 1, '[{"name":"Negro","hex":"#18181b"},{"name":"Rojo","hex":"#ef4444"},{"name":"Azul","hex":"#3b82f6"},{"name":"Dorado","hex":"#eab308"}]'::jsonb),
('esp-2', 'ESP-102', 'Espejos Alerón Deportivos Stealth', 135000, null, 'espejos', 'tienda', 2, '[{"name":"Negro Mate","hex":"#18181b"},{"name":"Fibra Carbono","hex":"#27272a"}]'::jsonb),
('led-1', 'LED-201', 'Exploradoras Dual LED 60W Alta/Baja', 145000, 185000, 'luces-led', 'tienda', 3, '[{"name":"Blanco Frío","hex":"#f8fafc"},{"name":"Ámbar Rompeniebla","hex":"#f59e0b"}]'::jsonb),
('sld-1', 'SLD-301', 'Sliders de Protección Anticaída CNC', 120000, null, 'sliders', 'tienda', 4, '[{"name":"Negro","hex":"#18181b"},{"name":"Rojo","hex":"#ef4444"},{"name":"Azul","hex":"#3b82f6"},{"name":"Tornasol","hex":"linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)"}]'::jsonb),
('man-1', 'MAN-401', 'Manubrio Deportivo Protaper Con Clamp', 110000, null, 'manubrios', 'tienda', 5, '[{"name":"Negro","hex":"#18181b"},{"name":"Rojo","hex":"#ef4444"},{"name":"Azul","hex":"#3b82f6"},{"name":"Dorado","hex":"#eab308"}]'::jsonb),
('tor-1', 'TOR-501', 'Kit Tornillería de Lujo en Aluminio x30', 45000, 60000, 'lujos', 'tienda', 6, '[{"name":"Tornasol / Rainbow","hex":"linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)"},{"name":"Dorado","hex":"#eab308"},{"name":"Azul","hex":"#3b82f6"},{"name":"Rojo","hex":"#ef4444"}]'::jsonb),
('c1', 'CS-1001', 'Casco Thunder R integral negro/rojo brillo', 759000, null, 'cascos', 'cascos', 7, '[{"name":"Negro / Rojo","hex":"#ef4444"},{"name":"Negro Mate","hex":"#18181b"}]'::jsonb),
('c2', 'CS-1002', 'Casco Track SV gris mate fluor', 559000, null, 'cascos', 'casco2', 8, '[{"name":"Gris Flúor","hex":"#84cc16"}]'::jsonb)
on conflict (id) do nothing;


-- 5. PORTADA / BANNERS (config del diseño, compartida entre dispositivos)
create table if not exists public.site_config (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select on public.site_config to anon, authenticated;
grant insert, update on public.site_config to authenticated;
alter table public.site_config enable row level security;

create policy "Lectura publica de portada y banners"
  on public.site_config for select to anon, authenticated using (true);

create policy "Solo admin verificado crea portada y banners"
  on public.site_config for insert to authenticated
  with check (public.is_verified_admin());

create policy "Solo admin verificado edita portada y banners"
  on public.site_config for update to authenticated
  using (public.is_verified_admin()) with check (public.is_verified_admin());


-- 6. CATEGORÍAS DE LA TIENDA (compartidas entre dispositivos)
create table if not exists public.categories (
  id text primary key,
  name text not null,
  image_url text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
alter table public.categories enable row level security;

create policy "Lectura publica de categorias"
  on public.categories for select to anon, authenticated using (true);

create policy "Solo admin verificado crea categorias"
  on public.categories for insert to authenticated
  with check (public.is_verified_admin());

create policy "Solo admin verificado edita categorias"
  on public.categories for update to authenticated
  using (public.is_verified_admin()) with check (public.is_verified_admin());

create policy "Solo admin verificado elimina categorias"
  on public.categories for delete to authenticated
  using (public.is_verified_admin());

insert into public.categories (id, name, sort_order) values
  ('espejos', 'Espejos', 1),
  ('luces-led', 'Luces LED y Exploradoras', 2),
  ('sliders-defensas', 'Sliders y Defensas', 3),
  ('manubrios-maniguetas', 'Manubrios y Maniguetas', 4),
  ('tapizados-cojines', 'Tapizados y Forros para Cojín', 5),
  ('tornillerias-posapies', 'Tornillerías y Posapiés', 6),
  ('cascos', 'Cascos y Protección', 7),
  ('maletas', 'Maletas y Baúles', 8)
on conflict (id) do nothing;
