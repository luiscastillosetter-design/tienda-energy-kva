-- Datos de contacto editables desde /admin (ejecutar una vez en el SQL Editor de Supabase)
create table if not exists public.contact_settings (
  id int primary key default 1,
  phone_display text not null default '0414-0909873',
  whatsapp text not null default '584140909873',
  email text not null default 'contacto@energykva.com',
  address text not null default 'Guanare, Edo. Portuguesa - Carrera 11 entre calles 18 y 19',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into public.contact_settings (id) values (1) on conflict (id) do nothing;
alter table public.contact_settings enable row level security;
create policy "contact lectura publica" on public.contact_settings for select using (true);
-- El admin actual usa la clave anon (mismo patron que store_settings); permite escritura:
create policy "contact escritura admin" on public.contact_settings for all using (true) with check (true);
