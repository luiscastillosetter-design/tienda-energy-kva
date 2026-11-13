import { NextRequest, NextResponse } from 'next/server';
import { askKira } from '@/lib/kiraAgent';

export const maxDuration = 60;

async function sendTelegram(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }),
  }).catch((e) => console.error('Telegram send error:', e));
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update?.message || update?.edited_message;
    const text: string | undefined = msg?.text;
    if (!msg || !text) return NextResponse.json({ ok: true });

    const allowed = (process.env.TELEGRAM_ADMIN_IDS || '8918808470')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const chatId = String(msg.chat?.id ?? '');
    const fromId = String(msg.from?.id ?? '');
    if (!allowed.includes(chatId) && !allowed.includes(fromId)) {
      await sendTelegram(chatId, 'No autorizado.');
      return NextResponse.json({ ok: true });
    }

    if (text.trim() === '/start') {
      await sendTelegram(chatId, 'Hola, soy Kira, asistente gerencial de Energy KVA. Pregúntame por ventas, pedidos pendientes, inventario u ofertas.');
      return NextResponse.json({ ok: true });
    }

    const reply = await askKira(text.slice(0, 2000));
    await sendTelegram(chatId, reply);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Telegram Kira:', e);
    return NextResponse.json({ ok: true }); // evita reintentos infinitos de Telegram
  }
}
