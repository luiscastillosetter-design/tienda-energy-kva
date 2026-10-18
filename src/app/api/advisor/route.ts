import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';

// ALMACÉN EN MEMORIA: BLINDAJE CONTRA DRENADO DE TOKENS (Rate Limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_DAY = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // 1. Identificar IP del cliente
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown-client';

    const now = Date.now();
    const clientUsage = rateLimitMap.get(ip);

    // 2. Comprobar cuota de seguridad (Bloquea ANTES de consumir tokens en MWAPI)
    if (clientUsage) {
      if (now < clientUsage.resetTime) {
        if (clientUsage.count >= MAX_REQUESTS_PER_DAY) {
          return NextResponse.json(
            {
              error: `Límite de seguridad alcanzado (${MAX_REQUESTS_PER_DAY}/5 consultas hoy). Para proyectos a gran escala, contacta directamente a nuestro departamento de ingeniería por WhatsApp.`,
              limitReached: true,
              remaining: 0,
            },
            { status: 429 }
          );
        }
        clientUsage.count += 1;
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + ONE_DAY_MS });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + ONE_DAY_MS });
    }

    const currentCount = rateLimitMap.get(ip)?.count || 1;
    const remaining = Math.max(0, MAX_REQUESTS_PER_DAY - currentCount);

    const body = await req.json();
    const { userPrompt, selectedAppliances } = body;

    if (!userPrompt && (!selectedAppliances || selectedAppliances.length === 0)) {
      return NextResponse.json(
        { error: 'Debes proporcionar una descripción o seleccionar equipos.' },
        { status: 400 }
      );
    }

    // 3. Credenciales MWAPI (Protocolo Anthropic)
    let mwapiBaseUrl = (process.env.MWAPI_BASE_URL || 'https://api.mwapi.dev').replace(/\/$/, '');
    if (!mwapiBaseUrl.endsWith('/v1')) mwapiBaseUrl += '/v1';
    
    const mwapiKey = process.env.MWAPI_API_KEY || '';
    const mwapiModel = process.env.MWAPI_MODEL || 'claude-haiku-4-5-20251001';

    if (!mwapiKey) {
      return NextResponse.json(
        { error: 'Servicio en mantenimiento (Falta API Key de MWAPI).' },
        { status: 500 }
      );
    }

    // 4. Catálogo activo (Extracción en VIVO de Supabase / Base Local)
    const products = await productService.getProducts();
    const catalogSummary = products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      description: p.description,
    }));

    // 5. System Prompt (Ingeniería KVA)
    const systemInstruction = `Eres "KVA Energy Advisor", un ingeniero electricista senior de la empresa ENERGY KVA (Guanare, Portuguesa).
Tu objetivo es dimensionar la demanda eléctrica del cliente y recomendar equipos.

REGLAS MATEMÁTICAS INQUEBRANTABLES:
1. Calcula la suma total de Watts nominales.
2. Si hay motores, aires acondicionados o bombas (cargas inductivas), considera un pico de arranque (inrush) de 2.5x a 3x.
3. Factor de potencia inductivo estándar: FP = 0.85. KVA = (Watts / (1000 * FP)).
4. MARGEN DE SEGURIDAD INDUSTRIAL: Suma OBLIGATORIAMENTE un +20% al total de KVA calculado para proteger bobinados.
5. Recomienda única y exclusivamente equipos de este inventario:
${JSON.stringify(catalogSummary)}

FORMATO DE RESPUESTA:
Debes responder ESTRICTAMENTE en formato JSON válido (sin texto fuera del JSON ni bloques markdown, SOLO el objeto JSON):
{
  "totalWatts": 12000,
  "calculatedKva": 14.1,
  "marginKva": 16.9,
  "safetyMarginPercent": 20,
  "explanation": "Explicación técnica en 2 párrafos cortos sobre el desglose de consumo, picos de arranque y justificación de la capacidad.",
  "recommendedProductIds": ["transformador-25kva"],
  "b2bItems": [
    { "productId": "transformador-25kva", "quantity": 1, "reason": "Transformador principal para suplir la demanda base y picos." }
  ]
}`;

    const userMessage = `Requerimiento: ${userPrompt || 'Ninguno'}. Artefactos seleccionados: ${JSON.stringify(
      selectedAppliances || []
    )}. Calcula la demanda en KVA con 20% de margen.`;

    // 6. Petición nativa protocolo Anthropic (MWAPI /v1/messages)
    const mwapiResponse = await fetch(`${mwapiBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': mwapiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: mwapiModel,
        max_tokens: 800,
        temperature: 0.1,
        system: systemInstruction,
        messages: [
          { role: 'user', content: userMessage }
        ]
      }),
    });

    if (!mwapiResponse.ok) {
      const errText = await mwapiResponse.text();
      console.error('Error MWAPI Status:', mwapiResponse.status);
      console.error('Error MWAPI Body:', errText);
      return NextResponse.json(
        { error: `El proveedor de IA rechazó la conexión. Status: ${mwapiResponse.status}. Revisa tu modelo en .env.local` },
        { status: 502 }
      );
    }

    const data = await mwapiResponse.json();
    const rawContent = data.content?.[0]?.text || '';

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Respuesta en bruto de la IA (No JSON):', rawContent);
      throw new Error('La IA no devolvió un formato válido de lectura.');
    }

    const parsedAdvisorResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: parsedAdvisorResult,
      remainingQueries: remaining,
    });
  } catch (error: any) {
    console.error('Error KVA Advisor Trace:', error);
    return NextResponse.json(
      { error: 'Error procesando la recomendación técnica. Intenta detallar un poco más tu requerimiento.' },
      { status: 500 }
    );
  }
}