// Cliente del panel admin: toda escritura pasa por /api/admin/db (service role en el servidor)
const KEY_STORAGE = 'admin_key_kva';

export const getAdminKey = () => (typeof window === 'undefined' ? '' : sessionStorage.getItem(KEY_STORAGE) || '');
export const setAdminKey = (k: string) => sessionStorage.setItem(KEY_STORAGE, k);
export const clearAdminKey = () => sessionStorage.removeItem(KEY_STORAGE);

type Op = 'insert' | 'update' | 'upsert' | 'delete' | 'select';
interface Opts {
  values?: any;
  match?: Record<string, any>;
  onConflict?: string;
  returning?: boolean;
  single?: boolean;
  order?: { column: string; ascending?: boolean };
}

export async function adminWrite(table: string, op: Op, opts: Opts = {}): Promise<{ data: any; error: { message: string } | null }> {
  try {
    const res = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
      body: JSON.stringify({ table, op, ...opts }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: { message: json.error || `HTTP ${res.status}` } };
    return { data: json.data ?? null, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || 'Error de red' } };
  }
}

/** Sube un archivo a Supabase Storage (bucket site-media) vía URL firmada del servidor. Devuelve la URL pública. */
export async function adminUploadFile(file: File, folder = 'misc'): Promise<{ url: string | null; error: string | null }> {
  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
      body: JSON.stringify({ filename: file.name, folder }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { url: null, error: json.error || `HTTP ${res.status}` };
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.storage.from(json.bucket).uploadToSignedUrl(json.path, json.token, file, { contentType: file.type || undefined });
    if (error) return { url: null, error: error.message };
    return { url: json.publicUrl as string, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message || 'Error de red' };
  }
}

export async function verifyAdminKey(key: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ op: 'verify' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
