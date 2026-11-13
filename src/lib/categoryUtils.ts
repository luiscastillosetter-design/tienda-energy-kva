/** Normaliza texto: sin acentos, mayúsculas, solo A-Z/0-9 separados por guion bajo. */
export function normalizeCategoryKey(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function slugifyCategory(text: string): string {
  return normalizeCategoryKey(text).toLowerCase().replace(/_/g, '-');
}

/** Primer campo de grupo/departamento/categoría presente en un registro de Valery. */
export function pickValeryCategory(prod: any): string {
  const keys = ['departamento', 'categoria', 'categoría', 'grupo', 'category', 'department', 'group'];
  for (const k of keys) {
    const v = prod?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}
