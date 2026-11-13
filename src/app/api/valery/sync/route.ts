import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = getSupabaseAdmin();
import { normalizeCategoryKey, slugifyCategory, pickValeryCategory } from '@/lib/categoryUtils';

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

    // Extraemos los productos actuales para NO sobreescribir fotos, descripciones ni categorías editadas en Admin
    let hasManualFlag = true;
    let { data: existingData, error: exErr } = await supabase
      .from('products')
      .select('valery_code, images, description, features, category, category_manual');
    if (exErr) {
      // La columna category_manual aún no existe (falta ejecutar supabase/offers_categories.sql)
      hasManualFlag = false;
      const fb = await supabase.from('products').select('valery_code, images, description, features, category');
      existingData = fb.data as any;
    }
    const existingMap = new Map((existingData || []).map((p: any) => [p.valery_code, p]));

    // Departamentos existentes (por id y por nombre normalizado)
    const { data: catRows } = await supabase.from('categories').select('id, name');
    const catByKey = new Map<string, string>();
    (catRows || []).forEach((c: any) => {
      catByKey.set(normalizeCategoryKey(c.id), c.id);
      catByKey.set(normalizeCategoryKey(c.name), c.id);
    });
    const newCategories = new Map<string, any>();

    const resolveCategory = (raw: string): string => {
      const key = normalizeCategoryKey(raw);
      if (!key) return '';
      const found = catByKey.get(key);
      if (found) return found;
      newCategories.set(key, {
        id: key,
        name: raw,
        shortName: raw.length > 18 ? raw.slice(0, 18) : raw,
        slug: slugifyCategory(raw),
        iconName: 'Zap',
        image: '',
      });
      catByKey.set(key, key);
      return key;
    };

    const upsertPayload = products.map((prod: any) => {
      const exist: any = existingMap.get(prod.valeryCode);
      const valeryCat = resolveCategory(pickValeryCategory(prod));

      // Prioridad: edición manual en Admin > categoría de Valery > la ya guardada > valor enviado > por defecto
      const category = exist?.category_manual
        ? exist.category
        : valeryCat || exist?.category || prod.category || 'TRANSFORMADORES';

      const row: any = {
        id: prod.valeryCode, // Usamos el código de Valery como ID maestro
        valery_code: prod.valeryCode,
        title: prod.title,
        price: Number(prod.price),
        stock: Number(prod.stock),
        category,
        images: exist?.images || [], // Preserva la foto si ya existe
        description: exist?.description || '', // Preserva descripción
        features: exist?.features || [],
        updated_at: new Date().toISOString()
      };
      if (hasManualFlag) row.category_manual = exist?.category_manual ?? false;
      return row;
    });

    if (newCategories.size > 0) {
      const { error: catErr } = await supabase
        .from('categories')
        .upsert(Array.from(newCategories.values()), { onConflict: 'id', ignoreDuplicates: true });
      if (catErr) console.error('Error creando categorías desde Valery:', catErr);
    }

    const { error } = await supabase.from('products').upsert(upsertPayload, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      synced_count: products.length,
      categories_created: newCategories.size,
    });
  } catch (error: any) {
    console.error('Error Valery Sync:', error);
    return NextResponse.json({ error: 'Error sincronizando inventario' }, { status: 500 });
  }
}
