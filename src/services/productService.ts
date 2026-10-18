import { supabase } from '@/lib/supabase';
import { products as fallbackLocalProducts, type Product } from '@/data/products';

const ICONS = {
  energia: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4z"/></svg>',
  herramientas: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  default: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>'
};

const getCategoryFallbackIcon = (category: string) => {
  const cat = (category || '').toUpperCase();
  if (cat.includes('TRANSFORMADORES') || cat.includes('RESPALDO') || cat.includes('PROTECCION') || cat.includes('ILUMINACION')) return ICONS.energia;
  if (cat.includes('HERRAMIENTAS') || cat.includes('CONDUCTORES')) return ICONS.herramientas;
  return ICONS.default;
};

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

  if (parsedImages.length === 0) {
    parsedImages = [getCategoryFallbackIcon(item.category)];
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
    paymentMethods: ['Pago Móvil', 'Zelle', 'Binance Pay', 'Transferencia'],
  };
};

// Helper para leer caché local rápida
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

      // 3. Fallback: Base de datos industrial mockeada de products.ts
      return fallbackLocalProducts;
    } catch (err) {
      return fallbackLocalProducts;
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const allProducts = await this.getProducts();
      return allProducts.find(p => String(p.id) === String(id));
    } catch (err) {
      return fallbackLocalProducts.find(p => String(p.id) === String(id));
    }
  },

  async getRelatedProducts(category: string, currentProductId: string): Promise<Product[]> {
    try {
      const allProducts = await this.getProducts();
      return allProducts.filter(p => p.category.toUpperCase() === category.toUpperCase() && String(p.id) !== String(currentProductId)).slice(0, 10);
    } catch (err) {
      return fallbackLocalProducts.filter(p => p.category.toUpperCase() === category.toUpperCase() && String(p.id) !== String(currentProductId)).slice(0, 10);
    }
  }
};