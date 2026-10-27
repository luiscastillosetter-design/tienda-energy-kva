import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SYNC_SECRET = process.env.VALERY_SYNC_TOKEN || 'kva-valery-secret-2026';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { products } = await req.json();
    
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Formato inválido. Se espera un array de productos.' }, { status: 400 });
    }

    // Extraemos los productos actuales para NO sobreescribir las fotos o descripciones editadas en Admin
    const { data: existingData } = await supabase.from('products').select('valery_code, images, description, features');
    const existingMap = new Map((existingData || []).map(p => [p.valery_code, p]));

    const upsertPayload = products.map((prod: any) => {
      const exist = existingMap.get(prod.valeryCode);
      return {
        id: prod.valeryCode, // Usamos el código de Valery como ID maestro
        valery_code: prod.valeryCode,
        title: prod.title,
        price: Number(prod.price),
        stock: Number(prod.stock),
        category: prod.category || 'TRANSFORMADORES',
        images: exist?.images || [], // Preserva la foto si ya existe
        description: exist?.description || '', // Preserva descripción
        features: exist?.features || [],
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase.from('products').upsert(upsertPayload, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true, synced_count: products.length });
  } catch (error: any) {
    console.error('Error Valery Sync:', error);
    return NextResponse.json({ error: 'Error sincronizando inventario' }, { status: 500 });
  }
}