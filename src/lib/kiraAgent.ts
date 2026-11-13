import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const db = getSupabaseAdmin();

export interface KiraMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---------- Utilidades ----------
const VE_OFFSET_MS = -4 * 60 * 60 * 1000; // Venezuela UTC-4

function startOfTodayVE(): string {
  const ve = new Date(Date.now() + VE_OFFSET_MS);
  ve.setUTCHours(0, 0, 0, 0);
  return new Date(ve.getTime() - VE_OFFSET_MS).toISOString();
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

const money = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

async function salesSince(iso: string) {
  const { data, error } = await db
    .from('orders')
    .select('total_usd,total_ves,status')
    .gte('created_at', iso);
  if (error) throw error;
  const rows = data || [];
  return {
    pedidos: rows.length,
    total_usd: money(rows.reduce((a: number, o: any) => a + Number(o.total_usd || 0), 0)),
    total_bs: money(rows.reduce((a: number, o: any) => a + Number(o.total_ves || 0), 0)),
  };
}

async function findProduct(query: string): Promise<{ product?: any; candidates?: any[]; error?: string }> {
  const q = String(query || '').trim();
  if (!q) return { error: 'Falta el código Valery (SKU) o nombre del equipo.' };
  const exact = await db.from('products').select('id,valery_code,title,price,stock').ilike('valery_code', q).limit(2);
  if (exact.data && exact.data.length === 1) return { product: exact.data[0] };
  const safe = q.replace(/[%,()]/g, ' ');
  const { data } = await db
    .from('products')
    .select('id,valery_code,title,price,stock')
    .or(`valery_code.ilike.%${safe}%,title.ilike.%${safe}%`)
    .limit(6);
  if (!data || data.length === 0) return { error: `No encontré ningún equipo que coincida con "${q}".` };
  if (data.length === 1) return { product: data[0] };
  return { candidates: data.map((p: any) => ({ valery_code: p.valery_code, title: p.title, price: p.price, stock: p.stock })) };
}

// ---------- Herramientas (consultas y acciones reales) ----------
type ToolFn = (args: any) => Promise<any>;

const tools: Record<string, ToolFn> = {
  async ventas_resumen() {
    const [hoy, semana] = await Promise.all([salesSince(startOfTodayVE()), salesSince(daysAgoISO(7))]);
    return { hoy, ultimos_7_dias: semana };
  },

  async ordenes_pendientes_valery() {
    const { data, error } = await db
      .from('orders')
      .select('display_id,client_name,total_usd,payment_method,created_at')
      .eq('status', 'PENDIENTE_VALERY')
      .order('created_at', { ascending: true })
      .limit(30);
    if (error) throw error;
    return { cantidad: (data || []).length, ordenes: data };
  },

  async inventario_resumen() {
    const { data, error } = await db.from('products').select('price,stock');
    if (error) throw error;
    const rows = data || [];
    return {
      equipos: rows.length,
      unidades_totales: rows.reduce((a: number, p: any) => a + Number(p.stock || 0), 0),
      valor_inventario_usd: money(rows.reduce((a: number, p: any) => a + Number(p.price || 0) * Number(p.stock || 0), 0)),
      agotados: rows.filter((p: any) => Number(p.stock) <= 0).length,
    };
  },

  async stock_bajo() {
    const { data, error } = await db
      .from('products')
      .select('valery_code,title,stock,price')
      .lte('stock', 3)
      .order('stock', { ascending: true })
      .limit(40);
    if (error) throw error;
    return { cantidad: (data || []).length, productos: data };
  },

  async ofertas_activas() {
    const { data, error } = await db.from('product_offers').select('*').eq('active', true);
    if (error) throw error;
    const ids = (data || []).map((o: any) => o.product_id);
    const { data: prods } = ids.length
      ? await db.from('products').select('id,valery_code,title,price').in('id', ids)
      : { data: [] as any[] };
    const map = new Map((prods || []).map((p: any) => [p.id, p]));
    return {
      cantidad: (data || []).length,
      ofertas: (data || []).map((o: any) => ({
        oferta_id: o.id,
        valery_code: map.get(o.product_id)?.valery_code,
        equipo: map.get(o.product_id)?.title,
        precio_normal: map.get(o.product_id)?.price,
        precio_oferta: o.promo_price,
        descuento_pct: o.discount_percent,
        etiqueta: o.label,
      })),
    };
  },

  // Acciones
  async crear_o_activar_oferta(a: { producto: string; precio_oferta?: number; descuento_porcentaje?: number; etiqueta?: string; activa?: boolean }) {
    const f = await findProduct(a.producto);
    if (f.error || f.candidates) return f;
    const p = f.product;
    const price = Number(p.price);
    let promo = Number(a.precio_oferta);
    if (!(promo > 0) && Number(a.descuento_porcentaje) > 0) promo = price * (1 - Number(a.descuento_porcentaje) / 100);
    promo = money(promo);
    const active = a.activa !== false;

    const { data: existing } = await db.from('product_offers').select('*').eq('product_id', p.id).order('id', { ascending: false }).limit(1);
    if (!(promo > 0)) {
      // Sin precio nuevo: solo activar/desactivar la oferta existente
      if (!existing || existing.length === 0) return { error: 'Ese equipo no tiene oferta; indica precio_oferta o descuento_porcentaje.' };
      const { error } = await db.from('product_offers').update({ active }).eq('id', existing[0].id);
      if (error) return { error: error.message };
      return { ok: true, equipo: p.title, oferta_activa: active };
    }
    if (promo >= price) return { error: `El precio de oferta ($${promo}) debe ser menor al precio actual ($${price}).` };
    const percent = Math.round((1 - promo / price) * 10000) / 100;
    const row = { promo_price: promo, discount_percent: percent, active, ...(a.etiqueta ? { label: a.etiqueta } : {}) };
    if (existing && existing.length > 0) {
      const { error } = await db.from('product_offers').update(row).eq('id', existing[0].id);
      if (error) return { error: error.message };
    } else {
      const { error } = await db.from('product_offers').insert({ product_id: p.id, label: a.etiqueta || 'OFERTA', ...row });
      if (error) return { error: error.message };
    }
    return { ok: true, equipo: p.title, precio_normal: price, precio_oferta: promo, descuento_pct: percent, oferta_activa: active };
  },

  async activar_desactivar_oferta(a: { producto: string; activa: boolean }) {
    const f = await findProduct(a.producto);
    if (f.error || f.candidates) return f;
    const { data } = await db.from('product_offers').select('id').eq('product_id', f.product.id);
    if (!data || data.length === 0) return { error: `"${f.product.title}" no tiene ofertas creadas.` };
    const { error } = await db.from('product_offers').update({ active: !!a.activa }).eq('product_id', f.product.id);
    if (error) return { error: error.message };
    return { ok: true, equipo: f.product.title, oferta_activa: !!a.activa };
  },

  async ajustar_producto(a: { producto: string; stock?: number; precio?: number }) {
    const f = await findProduct(a.producto);
    if (f.error || f.candidates) return f;
    const patch: any = {};
    if (a.stock !== undefined && a.stock !== null) patch.stock = Math.max(0, Math.floor(Number(a.stock)));
    if (a.precio !== undefined && a.precio !== null) {
      if (!(Number(a.precio) > 0)) return { error: 'Precio inválido.' };
      patch.price = money(Number(a.precio));
    }
    if (Object.keys(patch).length === 0) return { error: 'Indica stock y/o precio a cambiar.' };
    patch.updated_at = new Date().toISOString();
    const { error } = await db.from('products').update(patch).eq('id', f.product.id);
    if (error) return { error: error.message };
    return {
      ok: true,
      equipo: f.product.title,
      antes: { stock: f.product.stock, precio: f.product.price },
      ahora: { stock: patch.stock ?? f.product.stock, precio: patch.price ?? f.product.price },
      nota: 'El próximo sync de Valery puede volver a sobrescribir stock/precio.',
    };
  },

  async actualizar_contacto(a: { telefono?: string; whatsapp?: string; email?: string; direccion?: string }) {
    const patch: any = {};
    if (a.telefono) patch.phone_display = String(a.telefono).trim();
    if (a.whatsapp) patch.whatsapp = String(a.whatsapp).replace(/\D/g, '');
    if (a.email) patch.email = String(a.email).trim();
    if (a.direccion) patch.address = String(a.direccion).trim();
    if (Object.keys(patch).length === 0) return { error: 'No indicaste ningún dato de contacto a cambiar.' };
    const { data: cur } = await db.from('contact_settings').select('*').eq('id', 1).maybeSingle();
    const { error } = await db
      .from('contact_settings')
      .upsert({ ...(cur || {}), ...patch, id: 1, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) return { error: error.message };
    return { ok: true, actualizado: Object.keys(patch) };
  },
};

const S = (description: string) => ({ type: 'string', description });
const N = (description: string) => ({ type: 'number', description });
const tool = (name: string, description: string, properties: any = {}, required: string[] = []) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});

const toolDefs = [
  tool('ventas_resumen', 'Ventas de hoy y de los últimos 7 días: cantidad de pedidos, total USD y Bs.'),
  tool('ordenes_pendientes_valery', 'Órdenes web pendientes por sincronizar con Valery.'),
  tool('inventario_resumen', 'Resumen del inventario sincronizado desde Valery.'),
  tool('stock_bajo', 'Productos con stock bajo (stock <= 3).'),
  tool('ofertas_activas', 'Ofertas activas en la web.'),
  tool(
    'crear_o_activar_oferta',
    'Crea o actualiza una oferta de un equipo (busca por SKU Valery o nombre). Da precio_oferta o descuento_porcentaje.',
    { producto: S('SKU Valery o nombre'), precio_oferta: N('Precio promo USD'), descuento_porcentaje: N('% descuento'), etiqueta: S('Etiqueta, ej. OFERTA RELÁMPAGO'), activa: { type: 'boolean' } },
    ['producto']
  ),
  tool('activar_desactivar_oferta', 'Activa o desactiva la oferta existente de un equipo.', { producto: S('SKU Valery o nombre'), activa: { type: 'boolean' } }, ['producto', 'activa']),
  tool('ajustar_producto', 'Ajusta stock y/o precio web de un equipo.', { producto: S('SKU Valery o nombre'), stock: N('Nuevo stock'), precio: N('Nuevo precio USD') }, ['producto']),
  tool('actualizar_contacto', 'Actualiza datos de contacto de la web.', { telefono: S('Teléfono visible'), whatsapp: S('WhatsApp con código de país'), email: S('Correo'), direccion: S('Dirección') }),
];

const SYSTEM = `Eres KIRA, la asistente gerencial de ENERGY KVA (Guanare, Portuguesa, Venezuela). Hablas con María (la dueña) y su equipo.
Responde SIEMPRE en español, breve y directo, con cifras claras ($ y Bs.).
Usa las herramientas para consultar datos reales; NUNCA inventes cifras. Ejecuta acciones (ofertas, stock, precio, contacto) solo cuando te las pidan explícitamente.
Si un producto es ambiguo, muestra las opciones y pide el código Valery exacto. Confirma al final qué cambiaste.`;

// ---------- Proveedores LLM ----------
async function runLoop(url: string, apiKey: string, model: string, history: any[], timeoutMs: number): Promise<string> {
  const messages: any[] = [{ role: 'system', content: SYSTEM }, ...history];
  for (let i = 0; i < 5; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let json: any;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, tools: toolDefs, tool_choice: 'auto', temperature: 0.2 }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
    } finally {
      clearTimeout(t);
    }
    const msg = json?.choices?.[0]?.message;
    if (!msg) throw new Error('Respuesta vacía del proveedor');
    const calls = msg.tool_calls;
    if (!calls || calls.length === 0) return String(msg.content || '').trim() || 'Listo.';
    messages.push(msg);
    for (const c of calls) {
      let result: any;
      try {
        const fn = tools[c.function?.name];
        if (!fn) throw new Error('Herramienta desconocida');
        result = await fn(JSON.parse(c.function.arguments || '{}'));
      } catch (e: any) {
        result = { error: e?.message || 'Error ejecutando herramienta' };
      }
      messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
    }
  }
  return 'No pude completar la solicitud. Intenta de nuevo con más detalle.';
}

/** Procesa un mensaje de Kira (OmniRoute primero, Groq como respaldo). */
export async function askKira(message: string, history: KiraMessage[] = []): Promise<string> {
  const msgs = [...history.slice(-8).map((m) => ({ role: m.role, content: String(m.content) })), { role: 'user', content: message }];

  if (process.env.OMNIROUTE_BASE_URL) {
    try {
      return await runLoop(
        `${process.env.OMNIROUTE_BASE_URL.replace(/\/$/, '')}/chat/completions`,
        process.env.OMNIROUTE_API_KEY || 'sk-local',
        process.env.OMNIROUTE_MODEL || 'auto/best-free',
        msgs,
        20000
      );
    } catch (e: any) {
      console.error('Kira: OmniRoute falló:', e?.message);
    }
  }
  if (process.env.GROQ_API_KEY) {
    try {
      return await runLoop(
        'https://api.groq.com/openai/v1/chat/completions',
        process.env.GROQ_API_KEY,
        process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        msgs,
        25000
      );
    } catch (e: any) {
      console.error('Kira: Groq falló:', e?.message);
    }
  }
  return 'Kira no pudo conectarse a los proveedores de IA en este momento. Intenta de nuevo en unos minutos.';
}
