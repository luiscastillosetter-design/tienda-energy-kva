import { NextResponse } from 'next/server';

export const revalidate = 1800; // Caché ISR de 30 minutos

export async function GET() {
  try {
    // Fuente Primaria: DolarApi Venezuela (BCV Oficial)
    const primaryRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 1800 },
    });

    if (primaryRes.ok) {
      const data = await primaryRes.json();
      if (data?.promedio) {
        return NextResponse.json({
          rate: Number(data.promedio),
          lastUpdate: data.fechaActualizacion || new Date().toISOString(),
          source: 'BCV Oficial',
        });
      }
    }

    // Fuente Secundaria: PyDolarVenezuela
    const fallbackRes = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', {
      next: { revalidate: 1800 },
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const price = fallbackData?.monitors?.usd?.price;
      if (price) {
        return NextResponse.json({
          rate: Number(price),
          lastUpdate: fallbackData?.datetime?.date || new Date().toISOString(),
          source: 'BCV Oficial',
        });
      }
    }

    throw new Error('Sin respuesta de monitores BCV');
  } catch (error) {
    // Respaldo de emergencia para nunca romper el cálculo de tienda
    return NextResponse.json({
      rate: 68.50,
      lastUpdate: new Date().toISOString(),
      fallback: true,
    });
  }
}