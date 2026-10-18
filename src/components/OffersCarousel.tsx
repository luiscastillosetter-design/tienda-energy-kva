'use client';

import { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const defaultOffers = [
  {
    id: 1,
    title: 'TRANSFORMADORES DE DISTRIBUCIÓN',
    description:
      'Equipa tu tendido eléctrico, finca o urbanismo con equipos certificados bajo normas de Corpoelec.',
    desktopImg: '/ofertas/oferta-transformadores.jpg',
    mobileImg: '/ofertas/oferta-transformadores-mobile.jpg',
    btnLink: '/catalogo?category=TRANSFORMADORES',
    tag: 'Garantía Oficial KVA',
  },
  {
    id: 2,
    title: 'PLANTAS ELÉCTRICAS Y RESPALDO',
    description:
      'Soluciones continuas e insonorizadas en diésel y estaciones portátiles LiFePO4 para cero apagones.',
    desktopImg: '/ofertas/oferta-plantas.jpg',
    mobileImg: '/ofertas/oferta-plantas-mobile.jpg',
    btnLink: '/catalogo?category=RESPALDO',
    tag: 'Alta Eficiencia',
  },
  {
    id: 3,
    title: 'ENVÍO NACIONAL GRATUITO',
    description:
      'Despacho protegido a toda Venezuela en compras industriales superiores a $50.',
    desktopImg: '/ofertas/oferta-envios.jpg',
    mobileImg: '/ofertas/oferta-envios-mobile.jpg',
    btnLink: '/catalogo',
    tag: 'Beneficio Corporativo',
  },
];

export function OffersCarousel() {
  const autoplayOptions = { delay: 6500, stopOnInteraction: false };
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay(autoplayOptions)]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [offers, setOffers] = useState<any[]>(defaultOffers);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kva_offers_db');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOffers(parsed);
          }
        } catch (error) {
          console.error('Error al cargar ofertas:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    const onInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect();
    };

    emblaApi.on('init', onInit);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('init', onInit);
      emblaApi.off('reInit', onInit);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, offers]);

  const scrollTo = (index: number) => emblaApi?.scrollTo(index);

  return (
    <div className="w-full scroll-mt-28" id="ofertas">
      {/* Contenedor Rectangular con esquinas apenas redondeadas (rounded-xl) y borde de cristal */}
      <div
        ref={emblaRef}
        className="overflow-hidden rounded-xl border border-white/25 bg-[#060A14] shadow-[0_18px_40px_-10px_rgba(2,6,23,0.7),0_0_25px_rgba(0,180,255,0.2)] relative"
      >
        <div className="flex">
          {offers.map((offer) => {
            const desktopImage =
              offer.desktopImg || offer.bgImageDesktop || '';
            const mobileImage =
              offer.mobileImg || offer.bgImageMobile || desktopImage;

            return (
              <div
                key={offer.id}
                className="flex-[0_0_100%] min-w-0 relative min-h-[380px] sm:min-h-[430px] md:h-[480px] w-full flex items-center py-10 pb-16 sm:py-12"
              >
                {/* Fondo técnico industrial si aún no existe la imagen local */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(0,140,255,0.28),transparent_60%),linear-gradient(135deg,#050811_0%,#0A1428_55%,#04070E_100%)] z-0" />

                {/* Imagen para PC */}
                {desktopImage && (
                  <div
                    className="hidden md:block absolute inset-0 bg-cover bg-center z-0 opacity-65"
                    style={{ backgroundImage: `url('${desktopImage}')` }}
                  />
                )}

                {/* Imagen para Móvil */}
                {mobileImage && (
                  <div
                    className="block md:hidden absolute inset-0 bg-cover bg-center z-0 opacity-55"
                    style={{ backgroundImage: `url('${mobileImage}')` }}
                  />
                )}

                {/* Velo de contraste para lectura limpia */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#04070F]/95 via-[#04070F]/75 to-transparent z-10" />

                <Link
                  href={offer.btnLink || '/catalogo'}
                  className="absolute inset-0 z-20 cursor-pointer"
                />

                {/* Contenido Textual sin solapamientos en móvil */}
                <div className="relative z-30 w-full max-w-2xl px-5 sm:px-10 md:px-14 lg:px-16 flex flex-col items-start text-left pointer-events-none">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg liquid-glass-dark text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{offer.tag || 'Promoción Industrial'}</span>
                  </span>

                  <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight tracking-tight drop-shadow-lg">
                    {offer.title}
                  </h2>

                  <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-6 sm:mb-8 max-w-lg drop-shadow-md">
                    {offer.description}
                  </p>

                  <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl liquid-glass-active text-white font-black text-[11px] sm:text-xs uppercase tracking-wider pointer-events-auto cursor-pointer">
                    <span>Ver Equipos</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Paginación separada del contenido en móvil */}
                <div className="absolute bottom-4 left-5 sm:left-10 md:left-14 flex items-center gap-2.5 z-30 pointer-events-auto">
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => scrollTo(index)}
                      className={`h-2 rounded-sm transition-all duration-300 cursor-pointer ${
                        index === selectedIndex
                          ? 'bg-cyan-400 w-8 shadow-[0_0_10px_rgba(0,229,255,0.9)]'
                          : 'bg-white/30 hover:bg-white/50 w-2.5'
                      }`}
                      aria-label={`Ir a banner ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}