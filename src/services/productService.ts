import { supabase } from '@/lib/supabase';
import {
  FALLBACK_INDUSTRIAL_SVG,
  type Product,
} from '@/data/products';

export const formatProduct = (item: any): Product => {
  const stockQty = Number(item.stock ?? 0);
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

  parsedImages = parsedImages.map((img) =>
    img.startsWith('/products/') ? FALLBACK_INDUSTRIAL_SVG : img
  );

  if (parsedImages.length === 0) {
    parsedImages = [FALLBACK_INDUSTRIAL_SVG];
  }

  return {
    id: String(item.id),
    valeryCode: String(item.valery_code || item.id),
    title: String(item.title || ''),
    price: Number(item.price) || 0,
    category: String(item.category || 'TRANSFORMADORES'),
    stock: stockQty,
    badge:
      stockQty <= 0
        ? 'Agotado'
        : item.badge ||
          (Number(item.price) >= 50 ? 'Envío Gratis' : 'Disponible'),
    images: parsedImages,
    description:
      item.description ||
      `${item.title}. Equipo de grado industrial con garantía oficial ENERGY KVA C.A.`,
    features:
      Array.isArray(item.features) && item.features.length > 0
        ? item.features
        : ['Garantía directa de tienda', 'Despacho a nivel nacional'],
    updatedAt: item.updated_at || undefined,
  };
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('title', { ascending: true });

      if (!error && Array.isArray(data)) {
        const formatted = data.map(formatProduct);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('kva_products_db', JSON.stringify(formatted));
          } catch {}
        }
        return formatted;
      }

      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('kva_products_db');
        if (localRaw) {
          return JSON.parse(localRaw).map(formatProduct);
        }
      }

      return [];
    } catch {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('kva_products_db');
        if (localRaw) {
          try {
            return JSON.parse(localRaw).map(formatProduct);
          } catch {}
        }
      }
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const decodedId = decodeURIComponent(id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', decodedId)
        .maybeSingle();

      if (!error && data) {
        return formatProduct(data);
      }

      const allProducts = await this.getProducts();
      return allProducts.find(
        (p) => String(p.id).toLowerCase() === String(decodedId).toLowerCase()
      );
    } catch {
      return undefined;
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
    } catch {
      return [];
    }
  },
};