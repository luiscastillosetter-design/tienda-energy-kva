import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = getSupabaseAdmin();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      clientName, clientDni, clientPhone, 
      paymentMethod, paymentReference, receiptBase64, 
      totalUsd, totalVes, exchangeRate, items 
    } = body;

    if (!clientDni || !items || items.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Generar correlativo único (Ej: ORD-49281)
    const displayId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          display_id: displayId,
          client_name: clientName,
          client_dni: clientDni,
          client_phone: clientPhone,
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          receipt_url: receiptBase64 || null, // Aquí guardamos la captura en texto largo (Base64) temporalmente
          total_usd: totalUsd,
          total_ves: totalVes,
          exchange_rate: exchangeRate,
          items: items,
          status: 'PENDIENTE_VALERY'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Descuento automático de stock (sin bajar de 0) para evitar sobreventas
    for (const it of items) {
      try {
        const qty = Math.max(0, Math.floor(Number(it.quantity) || 0));
        const pid = it.id;
        if (!pid || qty <= 0) continue;
        const { data: prod } = await supabase.from('products').select('stock').eq('id', pid).maybeSingle();
        if (!prod) continue;
        const newStock = Math.max(0, Number(prod.stock || 0) - qty);
        await supabase.from('products').update({ stock: newStock }).eq('id', pid);
      } catch (e) {
        console.error('Error descontando stock de', it?.id, e);
      }
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Error al procesar orden:', error);
    return NextResponse.json({ error: 'Error interno guardando la orden' }, { status: 500 });
  }
}