import { supabase } from '@/lib/supabase';
import { products as fallbackLocalProducts, type Product } from '@/data/products';

const FALLBACK_INDUSTRIAL_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" rx="32" fill="%230A0E17"/><circle cx="200" cy="200" r="120" stroke="%230044FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.5"/><circle cx="200" cy="200" r="85" fill="%230044FF" fill-opacity="0.15" stroke="%2300E5FF" stroke-width="3"/><path d="M215 115L145 215H200L185 285L255 185H200L215 115Z" fill="%2300E5FF" stroke="%23FFFFFF" stroke-width="4" stroke-linejoin="round"/><text x="200" y="355" text-anchor="middle" fill="%2300E5FF" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="4">ENERGY KVA</text></svg>';

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

  // Si no hay imagen válida provista por el admin o la DB, se inyecta directamente el emblema KVA
  if (parsedImages.length === 0) {
    parsedImages = [FALLBACK_INDUSTRIAL_SVG];
  }

  return {
    id: String(item.id),
    title: String(item.title || ''),
    price: Number(item.price) || 0,
    category: String(item.category || 'General'),
    stock: stockQty,
    badge: stockQty <= 0 ? 'Agotado' : (Number(item.price) >= 50 ? 'Envío Gratis' : 'Oferta KVA'),
    images: parsedImages,
    description: item.description || `${item.title}. Equipo de grado industrial con garantía oficial ENERGY KVA.`,
    features: Array.isArray(item.features) && item.features.length > 0 
      ? item.features 
      : ['Garantía directa de tienda', 'Despacho a nivel nacional'],
  };
};

const getLocalData = (key: string) => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  }
  return null;
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      // 1. Prioridad Máxima: Leer base de datos local en vivo (Para que los cambios del /admin se vean instantáneos)
      const localDB = getLocalData('kva_products_db');
      if (localDB && Array.isArray(localDB) && localDB.length > 0) {
        return localDB.map(formatProduct);
      }

      // 2. Prioridad Secundaria: Intentar Supabase
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        if (typeof window !== 'undefined') localStorage.setItem('kva_products_db', JSON.stringify(data));
        return data.map(formatProduct);
      }

      // 3. Fallback: Base de datos industrial mockeada
      return fallbackLocalProducts.map(formatProduct);
    } catch (err) {
      return fallbackLocalProducts.map(formatProduct);
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const allProducts = await this.getProducts();
      return allProducts.find(p => String(p.id) === String(id));
    } catch (err) {
      return fallbackLocalProducts.map(formatProduct).find(p => String(p.id) === String(id));
    }
  },

  async getRelatedProducts(category: string, currentProductId: string): Promise<Product[]> {
    try {
      const allProducts = await this.getProducts();
      return allProducts.filter(p => p.category.toUpperCase() === category.toUpperCase() && String(p.id) !== String(currentProductId)).slice(0, 10);
    } catch (err) {
      return fallbackLocalProducts.map(formatProduct).filter(p => p.category.toUpperCase() === category.toUpperCase() && String(p.id) !== String(currentProductId)).slice(0, 10);
    }
  }
};