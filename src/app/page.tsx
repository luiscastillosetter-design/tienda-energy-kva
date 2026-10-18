'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ShoppingCart, MessageCircle } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { CategoryDock } from '@/components/CategoryDock';
import { OffersCarousel } from '@/components/OffersCarousel';
import { productService } from '@/services/productService';
import type { Product } from '@/data/products';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cartStore';

// El diagrama industrial fondo oscuro (#0A0E17) que te gusta como backup
const FALLBACK_INDUSTRIAL_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" rx="32" fill="%230A0E17"/><circle cx="200" cy="200" r="120" stroke="%230044FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.5"/><circle cx="200" cy="200" r="85" fill="%230044FF" fill-opacity="0.15" stroke="%2300E5FF" stroke-width="3"/><path d="M215 115L145 215H200L185 285L255 185H200L215 115Z" fill="%2300E5FF" stroke="%23FFFFFF" stroke-width="4" stroke-linejoin="round"/><text x="200" y="355" text-anchor="middle" fill="%2300E5FF" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="4">ENERGY KVA</text></svg>';

const ProductCarousel = ({
  title,
  products,
  categoryId,
  formatPrice,
  handleAddToCart,
}: {
  title: string;
  products: Product[];
  categoryId: string;
  formatPrice: (p: number) => string;
  handleAddToCart: (p: Product) => void;
}) => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const generateWaLink = (product: Product) => {
    const cleanPhone = String(siteConfig.contact.whatsapp).replace(/\D/g, '');
    const text = `Hola ENERGY KVA. Deseo consultar disponibilidad del equipo:\n\n📦 *${product.title}*\n🔹 Código: #${product.id}\n\nQuedo atento.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="w-full px-2 sm:px-6 md:px-12 lg:px-16 xl:px-20 py-6 md:py-8">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f1115] tracking-tight uppercase drop-shadow-sm">
          {title}
        </h2>
        <Link
          href={
            categoryId === 'Todos'
              ? '/catalogo'
              : `/catalogo?category=${encodeURIComponent(categoryId)}`
          }
          className="text-[10px] sm:text-xs font-black text-blue-600 flex items-center gap-1 hover:text-blue-500 transition-colors uppercase tracking-wider"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative w-full flex items-center">
        {/* Flecha Izquierda Fija */}
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-md active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Pista del Carrusel (Márgenes corregidos para móvil) */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 sm:gap-5 py-6 scrollbar-hide snap-x px-8 sm:px-10 w-full scroll-smooth"
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className="snap-start flex-shrink-0 w-[240px] sm:w-[260px] md:w-[280px]"
            >
              <div
                className="liquid-glass-pearl h-full flex flex-col p-4 relative group/card cursor-pointer"
                onClick={() => router.push(`/product/${prod.id}`)}
              >
                {/* Contenedor de Imagen (Ahora con esquinas apenas redondeadas rounded-xl en lugar de 2xl o full) */}
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
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider liquid-glass-dark text-cyan-300">
                      {prod.badge}
                    </span>
                  )}
                </div>

                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                  {prod.category}
                </span>

                <h3 className="text-xs sm:text-sm font-bold text-[#0f1115] line-clamp-2 mb-2 leading-snug group-hover/card:text-blue-700 transition-colors">
                  {prod.title}
                </h3>

                <div className="mt-auto mb-4">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-[#0f1115] truncate tracking-tight">
                    {formatPrice(prod.price)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(prod);
                    }}
                    className="flex-1 liquid-glass-active text-white text-[10px] font-black py-2.5 rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider hover:brightness-110 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Añadir
                  </button>
                  <a
                    href={generateWaLink(prod)}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 flex-shrink-0 liquid-glass-dark text-slate-200 hover:text-emerald-400 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    title="Consultar por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flecha Derecha Fija */}
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Siguiente"
          className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-md active:scale-95"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </section>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { currency, bcvRate, usdtRate, addItem, toggleCart } = useCartStore();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    const loadProducts = async () => {
      const all = await productService.getProducts();
      setFeaturedProducts(all.slice(0, 8));
      setCatalogProducts([...all].reverse().slice(0, 8));
    };
    loadProducts();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'Todos') {
      router.push('/catalogo');
    } else {
      router.push(`/catalogo?category=${encodeURIComponent(categoryId)}`);
    }
  };

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

  return (
    <main className="min-h-screen bg-transparent pb-20 overflow-hidden">
      {/* 1. HERO A PANTALLA COMPLETA */}
      <HeroCarousel />

      {/* 2. LÁMINA CON PIEL DE ROBOT Y BISEL HUECO NEÓN */}
      <div className="lamina-blanca bg-robot-skin chasis-bisel -mt-16 sm:-mt-24 md:-mt-32 pt-6 sm:pt-8 pb-14 mx-0 sm:mx-2 md:mx-4">
        
        {/* DOCK DE CATEGORÍAS ADENTRO DE LA LÁMINA BLANCA */}
        <div className="w-full px-2 sm:px-6 md:px-12 lg:px-16 xl:px-20 mb-2">
          <CategoryDock
            onSelect={handleCategorySelect}
            selectedCategory={selectedCategory}
          />
        </div>

        {/* PRIMER CARRUSEL */}
        

<ProductCarousel
          title="Equipos Destacados"
          categoryId="Todos"
          products={featuredProducts}
          formatPrice={formatPrice}
          handleAddToCart={handleAddToCart}
        />

        {/* CARRUSEL DE OFERTAS (Menos redondeado y alineado en móvil) */}
        <div className="w-full px-2 sm:px-6 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-6">
          <OffersCarousel />
        </div>

        {/* SEGUNDO CARRUSEL */}
        

<ProductCarousel
          title="Novedades Industriales"
          categoryId="Todos"
          products={catalogProducts}
          formatPrice={formatPrice}
          handleAddToCart={handleAddToCart}
        />
      </div>
    </main>
  );
}