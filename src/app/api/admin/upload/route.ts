import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

const BUCKET = 'site-media';
const ALLOWED_EXT = ['mp4', 'webm', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

function checkAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin1234.';
  const given = req.headers.get('x-admin-key') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Devuelve una URL firmada de subida (service role): el archivo viaja directo del navegador a Storage,
// así no se topa con el límite de tamaño de las funciones serverless.
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });
    }
    const { filename, folder } = await req.json();
    const ext = String(filename || '').split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: `Formato no permitido (.${ext}). Usa: ${ALLOWED_EXT.join(', ')}` }, { status: 400 });
    }
    const safeFolder = String(folder || 'misc').replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'misc';
    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const db = getSupabaseAdmin();
    const { data: buckets } = await db.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      const { error: bErr } = await db.storage.createBucket(BUCKET, { public: true });
      if (bErr && !/already exists/i.test(bErr.message)) {
        return NextResponse.json({ error: `No se pudo crear el bucket: ${bErr.message}` }, { status: 500 });
      }
    }

    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message || 'No se pudo firmar la subida' }, { status: 400 });

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ bucket: BUCKET, path, token: data.token, publicUrl: pub.publicUrl });
  } catch (e: any) {
    console.error('Admin upload:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
