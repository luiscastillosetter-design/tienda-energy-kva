'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { productService } from '@/services/productService';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/data/products';
import { Zap, ShoppingCart, MessageCircle, SearchX, Ban } from 'lucide-react';
import { CategoryDock } from '@/components/CategoryDock';

const FALLBACK_INDUSTRIAL_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" rx="32" fill="%230A0E17"/><circle cx="200" cy="200" r="120" stroke="%230044FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.5"/><circle cx="200" cy="200" r="85" fill="%230044FF" fill-opacity="0.15" stroke="%2300E5FF" stroke-width="3"/><path d="M215 115L145 215H200L185 285L255 185H200L215 115Z" fill="%2300E5FF" stroke="%23FFFFFF" stroke-width="4" stroke-linejoin="round"/><text x="200" y="355" text-anchor="middle" fill="%2300E5FF" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="4">ENERGY KVA</text></svg>';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { addItem, toggleCart, currency, bcvRate, usdtRate } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchQ = searchParams.get('q') || searchParams.get('search') || '';
    setCurrentQuery(searchQ);

    if (products.length > 0) {
      let filtered = [...products];

      if (searchQ) {
        const lowerQ = searchQ.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(lowerQ) ||
            p.id.toLowerCase().includes(lowerQ) ||
            p.category.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ)
        );
      }

      if (!categoryParam || categoryParam.toUpperCase() === 'TODOS') {
        setActiveCategory('Todos');
      } else {
        setActiveCategory(categoryParam);
        filtered = filtered.filter(
          (p) => p.category.toUpperCase() === categoryParam.toUpperCase()
        );
      }

      setFilteredProducts(filtered);
    }
  }, [searchParams, products]);

  const handleCategoryClick = (categoryId: string) => {
    const query = currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : '';
    if (categoryId === 'Todos') {
      router.push(`/catalogo${query ? `?${query.substring(1)}` : ''}`);
    } else {
      router.push(
        `/catalogo?category=${encodeURIComponent(categoryId)}${query}`
      );
    }
  };

  const clearFilters = () => router.push('/catalogo');

  const handleAddToCart = (product: Product) => {
    addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0] || FALLBACK_INDUSTRIAL_SVG,
      },
      1
    );
    toggleCart();
  };

  const formatPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (currency === 'USDT') {
      return `${usdPrice.toFixed(2)} USDT`;
    }
    return `${siteConfig.currencySymbol}${usdPrice.toFixed(2)}`;
  };

  const generateWaLink = (product: Product) => {
    const cleanPhone = String(siteConfig.contact.whatsapp).replace(/\D/g, '');
    const text = `Hola ENERGY KVA. Deseo consultar disponibilidad del equipo:\n\n📦 *${product.title}*\n🔹 Código: #${product.id}\n💰 Ref: $${product.price.toFixed(2)}\n\nQuedo atento.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full min-h-screen pb-24 pt-32 sm:pt-36 md:pt-44 text-slate-900 relative z-10 bg-robot-skin">
      <div className="lamina-blanca bg-robot-skin chasis-bisel mx-1 sm:mx-2 md:mx-4 py-6 sm:py-8 md:py-10">
        <div className="w-full px-3 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 mb-6">
          <div className="relative overflow-hidden rounded-xl border border-white/25 bg-[radial-gradient(120%_100%_at_85%_20%,rgba(0,180,255,0.25)_0%,rgba(5,10,24,0.96)_70%),linear-gradient(180deg,#0A1224_0%,#050811_100%)] p-5 sm:p-8 md:p-10 shadow-[0_16px_35px_-10px_rgba(2,6,23,0.65)]">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg liquid-glass-active text-white text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>Inventario Oficial en Vivo</span>
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {currentQuery ? (
                    <>Resultados para <span className="text-cyan-400">"{currentQuery}"</span></>
                  ) : (
                    <>Catálogo <span className="text-cyan-400">Industrial</span></>
                  )}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-2.5 max-w-2xl font-medium leading-relaxed">
                  {siteConfig.description}
                </p>
              </div>
              {currentQuery && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl liquid-glass-dark text-white hover:text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors flex-shrink-0 w-fit cursor-pointer"
                >
                  <span>Limpiar Búsqueda</span>
                  <SearchX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full px-2 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 mb-4">
          <CategoryDock onSelect={handleCategoryClick} selectedCategory={activeCategory} />
        </div>

        <div className="w-full px-3 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28">
          <div className="flex items-center justify-between mb-6 border-b border-slate-300/80 pb-3">
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              Mostrando <span className="font-black text-blue-600">{filteredProducts.length}</span> equipos disponibles
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-widest">
                Sincronizando inventario...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 liquid-glass-pearl text-center px-4 w-full max-w-3xl mx-auto">
              <SearchX className="w-14 h-14 text-blue-500 mb-4" />
              <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2">
                No se encontraron equipos en esta selección
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mb-6">
                Prueba buscar con otros términos o visualiza el catálogo completo.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-7 py-3.5 liquid-glass-active text-white font-black text-xs uppercase tracking-wider rounded-full cursor-pointer"
              >
                <span>Ver Todo el Catálogo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
              {filteredProducts.map((prod) => {
                const isOutOfStock = (prod.stock ?? 0) <= 0 || prod.badge === 'Agotado';
                
                return (
                  <div
                    key={prod.id}
                    className="liquid-glass-pearl flex flex-col p-4 relative group/card cursor-pointer"
                    onClick={() => router.push(`/product/${prod.id}`)}
                  >
                    <div className="relative w-full aspect-square rounded-xl bg-white flex items-center justify-center mb-4 overflow-hidden border border-slate-100 shadow-sm">
                      <img
                        src={prod.images[0] || FALLBACK_INDUSTRIAL_SVG}
                        alt={prod.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_INDUSTRIAL_SVG;
                        }}
                        className="w-full h-full object-contain p-4 group-hover/card:scale-105 transition-transform duration-300"
                      />
                      {prod.badge && (
                        <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${isOutOfStock ? 'bg-red-500 text-white' : 'liquid-glass-dark text-cyan-300'}`}>
                          <span>{prod.badge}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-1">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                        {prod.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover/card:text-blue-700 transition-colors">
                        {prod.title}
                      </h3>
                      <div className="mt-auto mb-4">
                        <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                          {formatPrice(prod.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/80">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if(!isOutOfStock) handleAddToCart(prod);
                        }}
                        className={`flex-1 text-[10px] sm:text-[11px] font-black py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider transition-all ${isOutOfStock ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'liquid-glass-active text-white cursor-pointer'}`}
                      >
                        {isOutOfStock ? (
                          <><Ban className="w-3.5 h-3.5" /> Agotado</>
                        ) : (
                          <><ShoppingCart className="w-3.5 h-3.5" /> Añadir</>
                        )}
                      </button>
                      <a
                        href={generateWaLink(prod)}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 liquid-glass-dark text-slate-200 hover:text-emerald-400 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen pt-32 bg-robot-skin">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}