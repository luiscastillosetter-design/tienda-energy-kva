-- Ejecutar una vez en el SQL Editor de Supabase (tracking de sincronización de órdenes con Valery)
alter table public.orders add column if not exists valery_doc_number text;
alter table public.orders add column if not exists valery_synced_at timestamptz;
