import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Error al procesar orden:', error);
    return NextResponse.json({ error: 'Error interno guardando la orden' }, { status: 500 });
  }
}