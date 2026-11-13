import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

// Tablas que el panel admin puede modificar y operaciones permitidas en cada una
const ALLOWED: Record<string, Array<'insert' | 'update' | 'upsert' | 'delete'>> = {
  products: ['insert', 'update', 'upsert', 'delete'],
  hero_slides: ['insert', 'update', 'upsert', 'delete'],
  offers: ['insert', 'update', 'upsert', 'delete'],
  product_offers: ['insert', 'update', 'upsert', 'delete'],
  categories: ['insert', 'update', 'upsert', 'delete'],
  store_settings: ['insert', 'update', 'upsert'],
  contact_settings: ['insert', 'update', 'upsert'],
  orders: ['update'], // solo marcar estado de sincronización con Valery
};

function checkAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin1234.';
  const given = req.headers.get('x-admin-key') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { op, table, values, match, onConflict, returning, single } = body || {};

    if (op === 'verify') return NextResponse.json({ ok: true });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });
    }

    if (!ALLOWED[table] || !ALLOWED[table].includes(op)) {
      return NextResponse.json({ error: 'Operación no permitida' }, { status: 403 });
    }

    const db = createClient(url, serviceKey, { auth: { persistSession: false } });
    const hasMatch = match && typeof match === 'object' && Object.keys(match).length > 0;

    let q: any;
    if (op === 'insert') {
      if (!values) return NextResponse.json({ error: 'values requerido' }, { status: 400 });
      q = db.from(table).insert(values);
    } else if (op === 'upsert') {
      if (!values) return NextResponse.json({ error: 'values requerido' }, { status: 400 });
      q = db.from(table).upsert(values, onConflict ? { onConflict } : undefined);
    } else if (op === 'update') {
      if (!values || !hasMatch) return NextResponse.json({ error: 'values y match requeridos' }, { status: 400 });
      q = db.from(table).update(values);
    } else {
      if (!hasMatch) return NextResponse.json({ error: 'match requerido para borrar' }, { status: 400 });
      q = db.from(table).delete();
    }

    if (hasMatch && (op === 'update' || op === 'delete')) {
      for (const [k, v] of Object.entries(match)) q = q.eq(k, v as any);
    }
    if (returning) {
      q = q.select();
      if (single) q = q.single();
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? null });
  } catch (e: any) {
    console.error('Admin DB:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
