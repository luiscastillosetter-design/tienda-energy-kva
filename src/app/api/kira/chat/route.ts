import { NextRequest, NextResponse } from 'next/server';
import { askKira } from '@/lib/kiraAgent';
import { timingSafeEqual } from 'crypto';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin1234.';
  const a = Buffer.from(req.headers.get('x-admin-key') || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const { message, history } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }
    const reply = await askKira(message.slice(0, 2000), Array.isArray(history) ? history : []);
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('Kira chat:', e);
    return NextResponse.json({ error: 'Error procesando la consulta' }, { status: 500 });
  }
}
