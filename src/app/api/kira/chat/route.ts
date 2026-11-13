import { NextRequest, NextResponse } from 'next/server';
import { askKira } from '@/lib/kiraAgent';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
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
