import { NextResponse } from 'next/server';

export const revalidate = 300; // Caché ISR de 5 minutos para P2P USDT

export async function GET() {
  try {
    // Fuente Primaria: DolarApi Venezuela (Paralelo / Binance P2P en Bs)
    const primaryRes = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo', {
      next: { revalidate: 300 },
    });

    if (primaryRes.ok) {
      const data = await primaryRes.json();
      if (data?.promedio) {
        return NextResponse.json({
          rate: Number(data.promedio),
          lastUpdate: data.fechaActualizacion || new Date().toISOString(),
          source: 'Binance USDT',
        });
      }
    }

    // Fuente Secundaria: PyDolarVenezuela Binance
    const fallbackRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=binance', {
      next: { revalidate: 300 },
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const price = fallbackData?.monitors?.binance?.price;
      if (price) {
        return NextResponse.json({
          rate: Number(price),
          lastUpdate: fallbackData?.datetime?.date || new Date().toISOString(),
          source: 'Binance USDT',
        });
      }
    }

    throw new Error('Sin respuesta de monitores Binance');
  } catch (error) {
    return NextResponse.json({
      rate: 79.80,
      lastUpdate: new Date().toISOString(),
      fallback: true,
    });
  }
}