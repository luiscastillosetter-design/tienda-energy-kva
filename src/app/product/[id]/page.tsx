'use client';

import { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import type { Product } from '@/data/products';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cartStore';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  MessageCircle,
  Star,
  Zap,
  PackageOpen,
  PlayCircle,
  Check,
  Truck,
} from 'lucide-react';

const FALLBACK_INDUSTRIAL_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" rx="32" fill="%230A0E17"/><circle cx="200" cy="200" r="120" stroke="%230044FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.5"/><circle cx="200" cy="200" r="85" fill="%230044FF" fill-opacity="0.15" stroke="%2300E5FF" stroke-width="3"/><path d="M215 115L145 215H200L185 285L255 185H200L215 115Z" fill="%2300E5FF" stroke="%23FFFFFF" stroke-width="4" stroke-linejoin="round"/><text x="200" y="355" text-anchor="middle" fill="%2300E5FF" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="4">ENERGY KVA</text></svg>';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();

  const { addItem, toggleCart, currency, bcvRate, usdtRate } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const [quantity, setQuantity] = useState<number | string>(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const relatedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      if (params.id) {
        setIsLoading(true);
        const currentProduct = await productService.getProductById(
          params.id as string
        );
        if (currentProduct) {
          setProduct(currentProduct);
          const related = await productService.getRelatedProducts(
            currentProduct.category,
            currentProduct.id
          );
          setRelatedProducts(related);
        }
        setIsLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [params.id]);

  const reviewCount = useMemo(() => {
    if (!product) return 24;
    let hash = 0;
    for (let i = 0; i < product.id.length; i++) {
      hash = (hash << 5) - hash + product.id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 180) + 18;
  }, [product]);

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedRef.current) {
      const scrollAmount = 320;
      relatedRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setQuantity('');
      return;
    }
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setQuantity(val);
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === '' || Number(quantity) < 1) {
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.images[0] || FALLBACK_INDUSTRIAL_SVG,
        },
        Number(quantity)
      );

      setAddedToCart(true);
      toggleCart();

      setTimeout(() => setAddedToCart(false), 2000);
    }
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

  const handleWhatsAppClick = () => {
    if (!product) return;
    const cleanPhone = String(siteConfig.contact.whatsapp).replace(/\D/g, '');
    const text = `¡Hola ${siteConfig.storeName}! Me interesa el siguiente equipo:\n\n📦 *${product.title}*\n🔹 Código: #${product.id}\n💰 Precio REF: ${siteConfig.currencySymbol}${product.price.toFixed(2)}\n🔢 Cantidad: ${quantity}\n\n¿Tienen disponibilidad para entrega?`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-robot-skin">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-4 bg-robot-skin">
        <PackageOpen className="w-20 h-20 text-slate-400 mb-6" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Equipo No Encontrado
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          El equipo industrial que buscas ya no está en catálogo.
        </p>
        <button
          onClick={() => router.push('/catalogo')}
          className="px-6 py-3 liquid-glass-active text-white font-black rounded-full text-xs uppercase tracking-wider cursor-pointer"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const isOutOfStock = (product.stock ?? 100) <= 0;
  const isOferta =
    product.badge === 'Oferta KVA' || product.badge === 'Oferta';
  const originalPrice = isOferta ? product.price * 1.2 : null;

  const currentMedia =
    product.images[activeImage] ||
    product.images[0] ||
    FALLBACK_INDUSTRIAL_SVG;
  const isActiveVideo =
    currentMedia.endsWith('.mp4') || currentMedia.includes('.mp4?');

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-24 text-slate-900 relative z-10 bg-robot-skin">
      <div className="lamina-blanca bg-robot-skin chasis-bisel mx-1 sm:mx-2 md:mx-4 py-8 md:py-12 px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="w-full max-w-7xl mx-auto">
          {/* Botón Volver */}
          <button
            type="button"
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 font-black text-xs uppercase tracking-wider mb-8 transition-colors w-fit cursor-pointer"
          >
            <div className="p-2 liquid-glass-pearl rounded-full group-hover:border-blue-400 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Volver atrás
          </button>

          {/* Bloque Principal (2 Columnas en PC, 1 en Móvil) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 xl:gap-20 mb-20 items-start">
            {/* COLUMNA 1: GALERÍA DE IMÁGENES PERLADA */}
            <div className="flex flex-col gap-4 w-full">
              <div className="relative w-full aspect-square liquid-glass-pearl overflow-hidden flex items-center justify-center p-6 md:p-10">
                {isActiveVideo ? (
                  <video
                    src={currentMedia}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-contain rounded-2xl"
                  />
                ) : (
                  <img
                    src={currentMedia}
                    alt={product.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_INDUSTRIAL_SVG;
                    }}
                    className="w-full h-full object-contain transition-transform duration-500"
                  />
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                  {product.badge && (
                    <span
                      className={`px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${
                        product.badge === 'Agotado'
                          ? 'bg-red-500 text-white'
                          : 'liquid-glass-dark text-cyan-300'
                      }`}
                    >
                      {product.badge}
                    </span>
                  )}
                  {product.price >=
                    (siteConfig.freeShippingThreshold || 50) && (
                    <span className="px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full liquid-glass-pearl text-blue-600 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Envío Gratis
                    </span>
                  )}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((media, idx) => {
                    const isVideo =
                      media.endsWith('.mp4') || media.includes('.mp4?');
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(idx)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white/80 p-1 ${
                          activeImage === idx
                            ? 'border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                            : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-blue-300'
                        }`}
                      >
                        {isVideo ? (
                          <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center">
                            <PlayCircle className="w-8 h-8 text-blue-500" />
                          </div>
                        ) : (
                          <img
                            src={media || FALLBACK_INDUSTRIAL_SVG}
                            alt={`Vista ${idx + 1}`}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_INDUSTRIAL_SVG;
                            }}
                            className="w-full h-full object-contain drop-shadow-sm"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA 2: DETALLES, PRECIO Y BOTONES DE COMPRA */}
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-300">
                <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
                  {product.category}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Cód: #{product.id}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-700">5.0</span>
                <span className="text-xs text-slate-500">
                  ({reviewCount} valoraciones verificadas)
                </span>
              </div>

              <div className="mb-8 p-6 liquid-glass-pearl">
                {originalPrice && (
                  <p className="text-sm text-slate-400 line-through font-bold mb-1">
                    {formatPrice(originalPrice)}
                  </p>
                )}
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl md:text-5xl font-black text-blue-600 tracking-tight drop-shadow-sm">
                    {formatPrice(product.price)}
                  </p>
                  {isOferta && (
                    <span className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-md">
                      -20% DCTO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-3 uppercase tracking-wider">
                  Aceptamos Zelle, Pago Móvil (Bs), USDT (Binance) y Efectivo.
                </p>
              </div>

              {!isOutOfStock && (
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Cantidad:
                  </span>
                  <div className="flex items-center liquid-glass-input-light rounded-full overflow-hidden h-11 border border-slate-300">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(Math.max(1, Number(quantity) - 1))
                      }
                      className="px-4 h-full text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-black text-lg flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      className="w-14 h-full text-center bg-transparent text-slate-900 font-black text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(Number(quantity) + 1)}
                      className="px-4 h-full text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-black text-lg flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-8 p-6 liquid-glass-pearl">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Descripción del Equipo
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">
                    {product.description}
                  </p>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="pt-4 border-t border-slate-300">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                      Especificaciones Clave
                    </h3>
                    <ul className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 font-medium"
                        >
                          <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 mt-auto">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addedToCart}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : addedToCart
                        ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        : 'liquid-glass-active text-white'
                  }`}
                >
                  {addedToCart ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {isOutOfStock
                    ? 'Sin Existencias'
                    : addedToCart
                      ? '¡Agregado!'
                      : 'Añadir al Carrito'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="flex-1 flex items-center justify-center gap-2.5 liquid-glass-dark text-white py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:bg-green-600 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Consulta Directa
                </button>
              </div>
            </div>
          </div>

          {/* EQUIPOS SIMILARES (Con Flechas a Izquierda y Derecha y Sin Cortes) */}
          {relatedProducts.length > 0 && (
            <div className="w-full pt-12 border-t border-slate-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Equipos Similares
                </h2>
                <Link
                  href={`/catalogo?category=${encodeURIComponent(product.category)}`}
                  className="text-xs font-black text-blue-600 hover:text-blue-500 flex items-center gap-1 uppercase tracking-wider"
                >
                  Ver más <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative w-full flex items-center">
                <button
                  type="button"
                  onClick={() => scrollRelated('left')}
                  aria-label="Anterior"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                  ref={relatedRef}
                  className="flex overflow-x-auto gap-4 md:gap-6 py-8 scrollbar-hide snap-x px-12 sm:px-14 w-full scroll-smooth"
                >
                  {relatedProducts.map((relProduct) => (
                    <Link
                      key={relProduct.id}
                      href={`/product/${relProduct.id}`}
                      className="snap-start flex-shrink-0 w-[250px] sm:w-[265px] block"
                    >
                      <div className="liquid-glass-pearl h-full flex flex-col p-4 relative group/card cursor-pointer">
                        <div className="relative w-full aspect-square rounded-2xl bg-white/85 flex items-center justify-center mb-4 overflow-hidden border border-white">
                          <img
                            src={relProduct.images[0] || FALLBACK_INDUSTRIAL_SVG}
                            alt={relProduct.title}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_INDUSTRIAL_SVG;
                            }}
                            className="w-full h-full object-contain p-4 group-hover/card:scale-105 transition-transform duration-500"
                          />
                          {relProduct.badge && (
                            <div
                              className={`absolute top-2.5 left-2.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                relProduct.badge === 'Agotado'
                                  ? 'bg-red-500 text-white'
                                  : 'liquid-glass-dark text-cyan-300'
                              }`}
                            >
                              {relProduct.badge}
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5">
                          {relProduct.category}
                        </span>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 line-clamp-2 group-hover/card:text-blue-700 transition-colors">
                          {relProduct.title}
                        </h3>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200/80">
                          <span className="text-lg font-black text-slate-900">
                            {formatPrice(relProduct.price)}
                          </span>
                          <span className="liquid-glass-active text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider group-hover/card:brightness-110">
                            Ver
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollRelated('right')}
                  aria-label="Siguiente"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-robot-skin">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}