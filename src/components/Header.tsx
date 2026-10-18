'use client';

import { useState, useEffect, Suspense, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  SearchIcon,
  ShoppingCart,
  User,
  Menu,
  X,
  Zap,
  BatteryCharging,
  Sun,
  Cable,
  Wrench,
  Shield,
  LayoutGrid,
  ChevronRight,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { siteConfig } from '@/config/site';
import { supabase } from '@/lib/supabase';
import { productService } from '@/services/productService';
import type { Product } from '@/data/products';
import AuthModal from './AuthModal';

const iconMap: Record<string, any> = {
  LayoutGrid,
  Zap,
  BatteryCharging,
  Sun,
  Cable,
  Wrench,
  Shield,
};

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    toggleCart,
    items,
    currency,
    setCurrency,
    bcvRate,
    setBcvRate,
    usdtRate,
    setUsdtRate,
  } = useCartStore();

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Estados para el Buscador en Tiempo Real
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Sincronización en vivo con el Administrador
  const [categories, setCategories] = useState<any[]>(siteConfig.categories);
  const [branding, setBranding] = useState({
    logoWhite: siteConfig.branding.logoWhite,
    logoDark: siteConfig.branding.logoDark,
  });

  const isHomePage = pathname === '/';
  const useLightHeader = isScrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/bcv')
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) setBcvRate(Number(data.rate));
      })
      .catch(() => {});

    fetch('/api/binance')
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) setUsdtRate(Number(data.rate));
      })
      .catch(() => {});
  }, [setBcvRate, setUsdtRate]);

  // Cargar catálogo completo silenciosamente para la búsqueda en tiempo real
  useEffect(() => {
    productService.getProducts().then((data) => {
      setAllProducts(data);
    });
  }, []);

  // Filtrar sugerencias mientras el usuario escribe
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      );
      setSuggestions(filtered.slice(0, 5)); // Mostrar máximo 5 resultados rápidos
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allProducts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchRealtimeData = async () => {
        const { data: brandData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
        if (brandData) {
          localStorage.setItem('kva_branding_db', JSON.stringify(brandData));
          setBranding({ logoWhite: brandData.logo_white, logoDark: brandData.logo_dark });
        } else {
          const localBrand = localStorage.getItem('kva_branding_db');
          if (localBrand) {
            try { 
              const pb = JSON.parse(localBrand); 
              setBranding({ logoWhite: pb.logo_white, logoDark: pb.logo_dark }); 
            } catch (e) {}
          }
        }

        const { data: catData } = await supabase.from('categories').select('*').order('id', { ascending: true });
        if (catData && catData.length > 0) {
          localStorage.setItem('kva_categories_db', JSON.stringify(catData));
          const hasTodos = catData.some((c: any) => c.id === 'Todos');
          if (!hasTodos) {
            setCategories([{ id: 'Todos', name: 'Catálogo Completo', shortName: 'Todos', slug: 'todos', iconName: 'LayoutGrid', image: '' }, ...catData]);
          } else {
            setCategories(catData);
          }
        } else {
          const localCats = localStorage.getItem('kva_categories_db');
          if (localCats) {
            try { setCategories(JSON.parse(localCats)); } catch (e) {}
          }
        }
      };
      fetchRealtimeData();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bk-menu-toggle', { detail: { isOpen: isMenuOpen } })
      );
    }
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setSearchQuery('');
  }, [pathname, searchParams]);

  if (pathname?.startsWith('/admin')) return null;

  const activeRateDisplay = () => {
    if (currency === 'VES') {
      return `Tasa BCV Oficial: Bs. ${bcvRate > 0 ? bcvRate.toFixed(2) : 'Sincronizando...'}`;
    }
    if (currency === 'USDT') {
      return `Tasa Binance P2P: ${usdtRate > 0 ? usdtRate.toFixed(2) : 'Sincronizando...'} Bs/USDT`;
    }
    return `Moneda Base: Dólar (${siteConfig.currencySymbol} USD)${
      bcvRate > 0 ? ` • BCV: Bs. ${bcvRate.toFixed(2)}` : ''
    }`;
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push('/catalogo');
      return;
    }
    router.push(`/catalogo?q=${encodeURIComponent(trimmed)}`);
    setIsMenuOpen(false);
    setIsSearchFocused(false);
  };

  const goToProduct = (id: string) => {
    router.push(`/product/${id}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMenuOpen(false);
  };

  const formatPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${usdPrice.toFixed(2)}`;
  };

  const whatsappClean = String(
    siteConfig.whatsapp?.number || siteConfig.contact.whatsapp || ''
  ).replace(/\D/g, '');

  return (
    <>
      {/* TOPBAR MULTIMONEDA */}
      <div className="w-full bg-[#07090E] border-b border-white/10 px-4 md:px-6 h-[36px] flex items-center z-50 fixed top-0 left-0 right-0">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-200 truncate">
              {activeRateDisplay()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-[11px] font-black tracking-wider flex-shrink-0">
            <span className="hidden md:inline text-slate-500 uppercase mr-1">
              Moneda:
            </span>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setCurrency('VES')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                currency === 'VES'
                  ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VES (BCV)
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setCurrency('USDT')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                currency === 'USDT'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              USDT
            </button>
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <header
        className={`fixed top-[36px] left-0 right-0 z-40 transition-all duration-300 ${
          useLightHeader
            ? 'liquid-glass-light py-2.5 md:py-3'
            : 'bg-gradient-to-b from-[#07090E]/90 via-[#07090E]/60 to-transparent py-4 md:py-6'
        }`}
      >
        <div className="w-full px-4 md:px-6 flex items-center justify-between gap-4 md:gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 flex-shrink-0 group cursor-pointer focus:outline-none"
          >
            <img
              src={
                useLightHeader
                  ? branding.logoDark
                  : branding.logoWhite
              }
              alt={siteConfig.name}
              className="h-10 sm:h-12 md:h-18 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-lg scale-[1.1] md:scale-[1.2] origin-left"
            />
          </Link>

          {/* BUSCADOR DESKTOP CON AUTOCOMPLETADO */}
          <div className="hidden md:flex flex-1 max-w-3xl flex-col relative mx-2 lg:mx-6">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-3 w-full"
            >
              <div className="relative flex-1 h-11 lg:h-12">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Buscar transformadores, luminarias, plantas, conductores..."
                  className={`w-full h-full pl-12 pr-6 text-xs lg:text-sm font-medium rounded-full outline-none transition-all ${
                    useLightHeader
                      ? 'liquid-glass-input-light text-slate-900 placeholder-slate-400'
                      : 'liquid-glass-input text-white placeholder-white/50'
                  }`}
                />
                <SearchIcon
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 z-10 ${
                    useLightHeader ? 'text-slate-400' : 'text-cyan-400'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="h-11 lg:h-12 px-6 lg:px-8 rounded-full liquid-glass-active text-white text-[10px] lg:text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <span>Buscar</span>
              </button>
            </form>

            {/* DESPLEGABLE RESULTADOS TIEMPO REAL (DESKTOP) */}
            {searchQuery.trim().length > 1 && isSearchFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-[120px] mt-2 bg-[#0A0E17]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[100]">
                <div className="p-2">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => goToProduct(p.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <div className="w-10 h-10 bg-white/90 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 p-1">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-0.5">{p.category}</p>
                      </div>
                      <div className="text-sm font-black text-white flex-shrink-0 pl-3">
                        {formatPrice(p.price)}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-white/10 bg-[#05070E] text-[10px] text-slate-400 font-medium text-center uppercase tracking-wider">
                  Presiona Enter para ver todos los resultados
                </div>
              </div>
            )}
          </div>

          {/* ACCIONES DERECHA */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className={`hidden sm:flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-full cursor-pointer ${
                useLightHeader
                  ? 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 border border-slate-300/80 font-bold transition-all'
                  : 'liquid-glass-dark text-white font-bold'
              }`}
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span className="text-xs lg:text-sm uppercase tracking-wider">Cuenta</span>
            </button>

            <button
              type="button"
              onClick={toggleCart}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 lg:py-3 liquid-glass-active text-white rounded-full relative cursor-pointer"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:block text-xs lg:text-sm font-black uppercase tracking-wider">
                Carrito
              </span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-950 text-[10px] lg:text-xs w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`p-2.5 sm:px-4 sm:py-2.5 lg:py-3 rounded-full flex items-center gap-2 cursor-pointer ${
                useLightHeader
                  ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all'
                  : 'liquid-glass-dark text-white'
              }`}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
              <span className="hidden xl:inline text-[11px] lg:text-xs font-black uppercase tracking-wider pr-1">
                Menú
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* VELO DEL MENÚ LATERAL */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[110] transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* DRAWER LATERAL (MÓVIL) */}
      <aside
        className={`fixed top-0 right-0 h-full w-[320px] sm:w-[380px] max-w-[85vw] bg-[#0A0E17]/95 backdrop-blur-2xl border-l border-white/15 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] z-[120] transform transition-transform duration-300 ease-out flex flex-col ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#07090E]">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2.5"
          >
            <img
              src={branding.logoWhite}
              alt={siteConfig.name}
              className="h-10 w-auto object-contain scale-[1.1] origin-left"
            />
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="p-2.5 rounded-full liquid-glass-dark text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8 scrollbar-hide">
          
          {/* BUSCADOR MÓVIL CON AUTOCOMPLETADO */}
          <div className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-1 h-12">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar equipo o potencia..."
                  className="w-full h-full pl-11 pr-4 rounded-full liquid-glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <SearchIcon className="w-4 h-4 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              </div>
              <button
                type="submit"
                className="h-12 px-5 rounded-full liquid-glass-active text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center flex-shrink-0 cursor-pointer"
              >
                <span>Ir</span>
              </button>
            </form>

            {/* DESPLEGABLE RESULTADOS TIEMPO REAL (MÓVIL) */}
            {searchQuery.trim().length > 1 && suggestions.length > 0 && (
              <div className="mt-3 bg-[#04070E] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-1.5">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => goToProduct(p.id)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 bg-white/90 rounded-md overflow-hidden flex-shrink-0 border border-white/20 p-1">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate leading-tight">{p.title}</p>
                        <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mt-0.5">{p.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Departamentos Industriales
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            <div className="flex flex-col space-y-3">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.iconName || 'Zap'] || Zap;
                const href =
                  cat.id === 'Todos'
                    ? '/catalogo'
                    : `/catalogo?category=${encodeURIComponent(cat.id)}`;

                return (
                  <Link
                    key={`drawer-cat-${cat.id}`}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="group flex items-center justify-between px-4 py-3.5 liquid-glass-dark text-slate-200 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconComponent className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors flex-shrink-0" />
                      <span className="text-xs font-bold truncate">
                        {cat.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-300 transition-all flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">
              Secciones de la Tienda
            </span>
            <div className="flex flex-col space-y-3">
              {siteConfig.navigation.map((navItem) => (
                <Link
                  key={`drawer-nav-${navItem.href}`}
                  href={navItem.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 liquid-glass-dark text-xs font-bold text-slate-300 hover:text-white transition-all"
                >
                  <span>{navItem.name}</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400/50" />
                </Link>
              ))}

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAuthOpen(true);
                }}
                className="flex items-center justify-between px-4 py-3.5 liquid-glass-dark text-xs font-bold text-slate-300 hover:text-white transition-all w-full text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" /> Mi Cuenta / Acceso
                </span>
                <ChevronRight className="w-4 h-4 text-cyan-400/50" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#07090E] space-y-4">
          <div className="flex items-start gap-2.5 text-[11px] text-slate-400">
            <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>{siteConfig.location}</span>
          </div>

          <a
            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
              siteConfig.whatsapp.defaultMessage
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 px-4 liquid-glass-active text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" /> Atención por WhatsApp
          </a>
        </div>
      </aside>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-24 w-full bg-transparent" />}>
      <HeaderContent />
    </Suspense>
  );
}