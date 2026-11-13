import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SYNC_SECRET = process.env.VALERY_SYNC_TOKEN || 'kva-valery-secret-2026';

const unauthorized = (req: NextRequest) =>
  req.headers.get('authorization') !== `Bearer ${SYNC_SECRET}`;

// GET: órdenes pendientes para que el conector local de Valery las inyecte en caja
export async function GET(req: NextRequest) {
  if (unauthorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'PENDIENTE_VALERY')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const orders = (data || []).map((o: any) => ({
      id: o.id,
      display_id: o.display_id,
      created_at: o.created_at,
      status: o.status,
      customer: { name: o.client_name, dni: o.client_dni, phone: o.client_phone },
      payment: { method: o.payment_method, reference: o.payment_reference },
      exchange_rate: o.exchange_rate,
      total_usd: Number(o.total_usd),
      total_ves: o.total_ves != null ? Number(o.total_ves) : null,
      items: (Array.isArray(o.items) ? o.items : []).map((i: any) => ({
        valery_code: i.valeryCode || i.valery_code || i.id,
        name: i.title || i.name,
        quantity: Number(i.quantity),
        unit_price_usd: Number(i.price),
      })),
    }));
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (e: any) {
    console.error('Valery orders GET:', e);
    return NextResponse.json({ error: 'Error consultando órdenes' }, { status: 500 });
  }
}

// POST: { order_id, valery_doc_number } -> marca SINCRONIZADO_VALERY
export async function POST(req: NextRequest) {
  if (unauthorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { order_id, valery_doc_number } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id requerido' }, { status: 400 });

    const full = {
      status: 'SINCRONIZADO_VALERY',
      valery_doc_number: valery_doc_number ? String(valery_doc_number) : null,
      valery_synced_at: new Date().toISOString(),
    };
    let { error } = await supabase.from('orders').update(full).eq('id', order_id);
    if (error) {
      // Columnas de tracking aún no creadas (supabase/valery_orders_sync.sql): solo estado
      const fb = await supabase.from('orders').update({ status: 'SINCRONIZADO_VALERY' }).eq('id', order_id);
      if (fb.error) throw fb.error;
    }
    return NextResponse.json({ success: true, order_id });
  } catch (e: any) {
    console.error('Valery orders POST:', e);
    return NextResponse.json({ error: 'Error actualizando orden' }, { status: 500 });
  }
}
