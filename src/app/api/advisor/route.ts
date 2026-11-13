import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Rate limiting en memoria (protege cuota de IA)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_DAY = 5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const POWER_FACTOR = 0.85;
const SAFETY_MARGIN = 0.2;

const APPLIANCE_WATTS: Record<string, number> = {
  'Aire Acond. 12.000 BTU': 1200,
  'Aire Acond. 24.000 BTU': 2400,
  'Bomba de Agua 1 HP': 750,
  'Bomba de Agua 2 HP': 1500,
  'Cava Cuarto / Refrigeración': 2800,
  'Nevera / Congelador Comercial': 600,
  'Iluminación (10 Reflectores)': 1000,
  'Servidor / Laptops / Oficina': 800,
  'Máquina de Soldar 200A': 4500,
};

interface InventoryItem {
  id: string;
  valeryCode: string;
  title: string;
  category: string;
  price: number;
  stock: number;
}

async function getInventory(): Promise<InventoryItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return [];
  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('products')
    .select('id, valery_code, title, category, price, stock')
    .gt('stock', 0)
    .order('title', { ascending: true })
    .limit(300);
  if (error || !Array.isArray(data)) return [];
  return data.map((p: any) => ({
    id: String(p.id),
    valeryCode: String(p.valery_code || p.id),
    title: String(p.title || ''),
    category: String(p.category || ''),
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
  }));
}

/** Estimación determinística de Watts (equipos predefinidos + lectura simple del texto libre). */
function estimateWatts(userPrompt: string, selected: string[]): number {
  let watts = 0;
  for (const name of selected) watts += APPLIANCE_WATTS[name] || 0;

  const text = (userPrompt || '').toLowerCase();
  const qty = (m: RegExpMatchArray | null) => (m ? Number(m[1]) : 1);
  const patterns: [RegExp, (n: number, v: number) => number][] = [
    [/(\d+(?:[.,]\d+)?)\s*kw\b/g, (n, v) => v * 1000 * n],
    [/(\d+(?:[.,]\d+)?)\s*kva\b/g, (n, v) => v * 1000 * POWER_FACTOR * n],
    [/(\d+(?:[.,]\d+)?)\s*hp\b/g, (n, v) => v * 746 * n],
    [/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*btu\b/g, (n, v) => (v / 12000) * 1200 * n],
    [/(\d+(?:[.,]\d+)?)\s*w(?:atts?)?\b/g, (n, v) => v * n],
  ];
  for (const [re, fn] of patterns) {
    for (const m of text.matchAll(re)) {
      const raw = m[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
      const value = Number(raw);
      if (!isFinite(value) || value <= 0) continue;
      const before = text.slice(Math.max(0, (m.index || 0) - 12), m.index || 0);
      const n = qty(before.match(/(\d+)\s*(?:x|de|bombas?|aires?|equipos?)?\s*$/));
      watts += fn(n > 0 && n < 100 ? n : 1, value);
    }
  }
  if (watts === 0 && text.trim()) {
    const reflectores = text.match(/(\d+)\s*reflectores?/);
    if (reflectores) watts += Number(reflectores[1]) * 100;
  }
  return Math.round(watts);
}

function kvaFromTitle(title: string): number | null {
  const m = title.match(/(\d+(?:[.,]\d+)?)\s*kva/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}

function computeKva(totalWatts: number) {
  const calculatedKva = totalWatts / (1000 * POWER_FACTOR);
  const marginKva = calculatedKva * (1 + SAFETY_MARGIN);
  return {
    calculatedKva: Math.round(calculatedKva * 100) / 100,
    marginKva: Math.round(marginKva * 100) / 100,
  };
}

function localFallback(userPrompt: string, selected: string[], inventory: InventoryItem[]) {
  const totalWatts = estimateWatts(userPrompt, selected);
  const { calculatedKva, marginKva } = computeKva(totalWatts);

  const candidates = inventory
    .map((p) => ({ p, kva: kvaFromTitle(p.title) }))
    .filter((c): c is { p: InventoryItem; kva: number } => c.kva !== null && c.kva >= marginKva)
    .sort((a, b) => a.kva - b.kva);
  const best = candidates[0];

  return {
    totalWatts,
    calculatedKva,
    marginKva,
    safetyMarginPercent: 20,
    explanation:
      `Cálculo local determinístico: ${totalWatts.toLocaleString('es-VE')} W ÷ (1000 × FP ${POWER_FACTOR}) = ${calculatedKva} KVA. ` +
      `Con 20% de reserva (normativa Corpoelec) la capacidad mínima recomendada es ${marginKva} KVA.` +
      (totalWatts === 0
        ? ' No pudimos interpretar cargas en la descripción; selecciona equipos o indica potencias (W, HP, BTU).'
        : '') +
      (best ? '' : ' No hay un equipo en inventario que cubra esta capacidad; consulta con un asesor.'),
    items: best
      ? [{ productId: best.p.id, quantity: 1, reason: `Equipo en stock de ${best.kva} KVA que cubre los ${marginKva} KVA requeridos.` }]
      : [],
  };
}

async function callProvider(
  url: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  timeoutMs?: number
): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : { signal: AbortSignal.timeout(20000) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Respuesta sin JSON');
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown-client';
    const now = Date.now();
    const usage = rateLimitMap.get(ip);
    if (usage && now < usage.resetTime) {
      if (usage.count >= MAX_REQUESTS_PER_DAY) {
        return NextResponse.json(
          {
            error: `Límite de seguridad alcanzado (${MAX_REQUESTS_PER_DAY}/${MAX_REQUESTS_PER_DAY} consultas hoy). Para proyectos a gran escala, contacta a nuestro departamento de ingeniería por WhatsApp.`,
            limitReached: true,
            remaining: 0,
          },
          { status: 429 }
        );
      }
      usage.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + ONE_DAY_MS });
    }
    const remaining = Math.max(0, MAX_REQUESTS_PER_DAY - (rateLimitMap.get(ip)?.count || 1));

    const { userPrompt = '', selectedAppliances = [] } = await req.json();
    const selected: string[] = Array.isArray(selectedAppliances) ? selectedAppliances.map(String) : [];
    if (!String(userPrompt).trim() && selected.length === 0) {
      return NextResponse.json({ error: 'Debes proporcionar una descripción o seleccionar equipos.' }, { status: 400 });
    }

    // Inventario real en vivo desde Supabase
    const inventory = await getInventory();
    const byId = new Map(inventory.map((p) => [p.id, p]));
    const catalog = inventory.map((p) => ({
      id: p.id,
      valery_code: p.valeryCode,
      nombre: p.title,
      categoria: p.category,
      precio_usd: p.price,
      stock: p.stock,
    }));

    const system = `Eres "KVA Energy Advisor", ingeniero electricista senior de ENERGY KVA (Guanare, Portuguesa, Venezuela).
Dimensiona la demanda eléctrica del cliente y recomienda equipos.

REGLAS DE CÁLCULO:
1. Suma los Watts nominales totales (equipos seleccionados + los descritos en texto).
2. Motores, bombas y aires acondicionados son cargas inductivas: considera pico de arranque de 2.5x a 3x al elegir capacidad.
3. KVA = Watts / (1000 * 0.85)  (factor de potencia FP = 0.85).
4. Aplica OBLIGATORIAMENTE un margen de seguridad de +20% al KVA calculado (normativa Corpoelec): marginKva = calculatedKva * 1.2.
5. Recomienda ÚNICA y EXCLUSIVAMENTE equipos del inventario siguiente (usa el campo "id" tal cual). NO inventes modelos, códigos ni precios. Si nada del inventario sirve, devuelve "items": [] y explícalo.
INVENTARIO (JSON): ${JSON.stringify(catalog)}

Responde SOLO con un objeto JSON válido, sin markdown:
{"totalWatts":number,"calculatedKva":number,"marginKva":number,"safetyMarginPercent":20,"explanation":"2 párrafos cortos en español","items":[{"productId":"id del inventario","quantity":number,"reason":"por qué"}]}`;

    const userMsg = `Requerimiento: ${userPrompt || 'Ninguno'}. Equipos seleccionados (con Watts): ${JSON.stringify(
      selected.map((n) => ({ equipo: n, watts: APPLIANCE_WATTS[n] ?? null }))
    )}. Calcula la demanda en KVA con FP 0.85 y 20% de margen.`;

    let parsed: any = null;
    let provider: 'omniroute' | 'groq' | 'local' = 'local';

    // Prioridad 1: OmniRoute
    if (process.env.OMNIROUTE_BASE_URL) {
      try {
        parsed = await callProvider(
          `${process.env.OMNIROUTE_BASE_URL.replace(/\/$/, '')}/chat/completions`,
          process.env.OMNIROUTE_API_KEY || 'sk-local',
          process.env.OMNIROUTE_MODEL || 'auto/best-free',
          system,
          userMsg,
          12000
        );
        provider = 'omniroute';
      } catch (e: any) {
        console.error('KVA Advisor: OmniRoute falló:', e?.message);
      }
    }

    // Prioridad 2: Groq
    if (!parsed && process.env.GROQ_API_KEY) {
      try {
        parsed = await callProvider(
          'https://api.groq.com/openai/v1/chat/completions',
          process.env.GROQ_API_KEY,
          process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          system,
          userMsg
        );
        provider = 'groq';
      } catch (e: any) {
        console.error('KVA Advisor: Groq falló:', e?.message);
      }
    }

    // Prioridad 3: cálculo local
    if (!parsed) {
      parsed = localFallback(String(userPrompt), selected, inventory);
      provider = 'local';
    }

    // Normalización: KVA siempre coherente con la regla FP 0.85 + 20%
    const totalWatts = Math.round(Number(parsed.totalWatts) || 0);
    const kva = totalWatts > 0 ? computeKva(totalWatts) : {
      calculatedKva: Number(parsed.calculatedKva) || 0,
      marginKva: Number(parsed.marginKva) || 0,
    };

    // Solo equipos reales del inventario, enriquecidos con datos de Supabase
    const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed.b2bItems) ? parsed.b2bItems : [];
    const items = rawItems
      .map((it) => {
        const p = byId.get(String(it.productId));
        if (!p) return null;
        return {
          productId: p.id,
          valeryCode: p.valeryCode,
          title: p.title,
          category: p.category,
          price: p.price,
          stock: p.stock,
          quantity: Math.max(1, Math.min(Number(it.quantity) || 1, p.stock)),
          reason: String(it.reason || ''),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      provider,
      data: {
        totalWatts,
        calculatedKva: kva.calculatedKva,
        marginKva: kva.marginKva,
        safetyMarginPercent: 20,
        explanation: String(parsed.explanation || ''),
        items,
      },
      remainingQueries: remaining,
    });
  } catch (error) {
    console.error('Error KVA Advisor:', error);
    return NextResponse.json(
      { error: 'Error procesando la recomendación técnica. Intenta detallar un poco más tu requerimiento.' },
      { status: 500 }
    );
  }
}
