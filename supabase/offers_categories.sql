-- Ejecutar una vez en el SQL Editor de Supabase (Ofertas por producto + Departamentos dinámicos)

-- 1) Ofertas de equipos del inventario
create table if not exists public.product_offers (
  id bigserial primary key,
  product_id text not null,
  promo_price numeric(12,2) not null,
  discount_percent numeric(5,2),
  label text not null default 'OFERTA',
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table public.product_offers enable row level security;
create policy "offers lectura publica" on public.product_offers for select using (true);
create policy "offers escritura admin" on public.product_offers for all using (true) with check (true);

-- 2) Departamentos (la tabla puede existir ya; se crea solo si falta)
create table if not exists public.categories (
  id text primary key,
  name text not null,
  "shortName" text,
  slug text,
  "iconName" text default 'Zap',
  image text default ''
);
alter table public.categories enable row level security;
do $$ begin
  create policy "categories lectura publica" on public.categories for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "categories escritura admin" on public.categories for all using (true) with check (true);
exception when duplicate_object then null; end $$;

insert into public.categories (id, name, "shortName", slug, "iconName", image) values
  ('TRANSFORMADORES','Transformadores y Alta Tensión','Transformadores','transformadores','Zap','/categories/smarthome.png'),
  ('RESPALDO','Respaldo y Anti-Apagones','Respaldo','respaldo','BatteryCharging','/categories/gadgets.png'),
  ('ILUMINACION','Iluminación Industrial y Solar','Iluminación','iluminacion','Sun','/categories/sonido.png'),
  ('CONDUCTORES','Conductores y Puesta a Tierra','Conductores','conductores','Cable','/categories/phone.png'),
  ('HERRAMIENTAS','Herramientas de Tendido','Herramientas','herramientas','Wrench','/categories/gadgets.png'),
  ('PROTECCION','Protección y Maniobra','Protección','proteccion','Shield','/categories/gaming.png')
on conflict (id) do nothing;

-- 3) Marca de categoría editada a mano (Valery no la pisa)
alter table public.products add column if not exists category_manual boolean not null default false;
