import { supabase } from '@/lib/supabase';
import {
  products as fallbackLocalProducts,
  FALLBACK_INDUSTRIAL_SVG,
  type Product,
} from '@/data/products';

const formatProduct = (item: any): Product => {
  const stockQty = Number(item.stock ?? 100);
  let parsedImages: string[] = [];

  if (Array.isArray(item.images)) {
    parsedImages = item.images.filter(Boolean);
  } else if (typeof item.images === 'string' && item.images.trim() !== '') {
    try {
      const jsonParsed = JSON.parse(item.images);
      if (Array.isArray(jsonParsed)) parsedImages = jsonParsed.filter(Boolean);
    } catch {
      parsedImages = [item.images];
    }
  }

  // Si la imagen es una ruta vieja inexistente (/products/...) o está vacía, usar el emblema fondo negro #0A0E17
  parsedImages = parsedImages.map((img) =>
    img.startsWith('/products/') ? FALLBACK_INDUSTRIAL_SVG : img
  );

  if (parsedImages.length === 0) {
    parsedImages = [FALLBACK_INDUSTRIAL_SVG];
  }

  return {
    id: String(item.id),
    title: String(item.title || ''),
    price: Number(item.price) || 0,
    category: String(item.category || 'TRANSFORMADORES'),
    stock: stockQty,
    badge:
      item.badge ||
      (stockQty <= 0
        ? 'Agotado'
        : Number(item.price) >= 50
          ? 'Envío Gratis'
          : 'Oferta KVA'),
    images: parsedImages,
    description:
      item.description ||
      `${item.title}. Equipo de grado industrial con garantía oficial ENERGY KVA.`,
    features:
      Array.isArray(item.features) && item.features.length > 0
        ? item.features
        : ['Garantía directa de tienda', 'Despacho a nivel nacional'],
  };
};

const getDeletedIds = (): string[] => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kva_deleted_product_ids');
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return [];
};

const mergeWithBaseCatalog = (remoteList: any[]): Product[] => {
  const deletedIds = new Set(getDeletedIds());
  const map = new Map<string, Product>();

  // 1. Poner primero los productos que vienen de Supabase / Admin
  for (const item of remoteList) {
    const formatted = formatProduct(item);
    if (!deletedIds.has(formatted.id)) {
      map.set(formatted.id, formatted);
    }
  }

  // 2. Garantizar que los 8 productos industriales de muestra estén siempre presentes (salvo que hayan sido borrados explícitamente)
  for (const baseProd of fallbackLocalProducts) {
    if (!deletedIds.has(baseProd.id) && !map.has(baseProd.id)) {
      map.set(baseProd.id, formatProduct(baseProd));
    }
  }

  return Array.from(map.values());
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const existingIds = new Set(data.map((d: any) => String(d.id)));
        const deletedIds = new Set(getDeletedIds());

        // Detectar cuáles de los 8 productos base aún no están en Supabase para sembrarlos automáticamente
        const missingBaseProducts = fallbackLocalProducts.filter(
          (bp) => !existingIds.has(bp.id) && !deletedIds.has(bp.id)
        );

        if (missingBaseProducts.length > 0) {
          supabase
            .from('products')
            .upsert(missingBaseProducts, { onConflict: 'id' })
            .then(() => {});
        }

        const merged = mergeWithBaseCatalog(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kva_products_db', JSON.stringify(merged));
        }
        return merged;
      }

      // Si Supabase no responde, usar caché local fusionada con los 8 productos base
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('kva_products_db');
        if (localRaw) {
          return mergeWithBaseCatalog(JSON.parse(localRaw));
        }
      }

      return fallbackLocalProducts.map(formatProduct);
    } catch (err) {
      return fallbackLocalProducts.map(formatProduct);
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const allProducts = await this.getProducts();
      return allProducts.find((p) => String(p.id) === String(id));
    } catch (err) {
      return fallbackLocalProducts
        .map(formatProduct)
        .find((p) => String(p.id) === String(id));
    }
  },

  async getRelatedProducts(
    category: string,
    currentProductId: string
  ): Promise<Product[]> {
    try {
      const allProducts = await this.getProducts();
      return allProducts
        .filter(
          (p) =>
            p.category.toUpperCase() === category.toUpperCase() &&
            String(p.id) !== String(currentProductId)
        )
        .slice(0, 10);
    } catch (err) {
      return fallbackLocalProducts
        .map(formatProduct)
        .filter(
          (p) =>
            p.category.toUpperCase() === category.toUpperCase() &&
            String(p.id) !== String(currentProductId)
        )
        .slice(0, 10);
    }
  },
};