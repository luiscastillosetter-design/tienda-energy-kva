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
    description: 'Equipa tu tendido eléctrico, finca o urbanismo con equipos certificados bajo normas de Corpoelec.',
    desktopImg: '/ofertas/oferta-transformadores.jpg',
    mobileImg: '/ofertas/oferta-transformadores-mobile.jpg',
    btnLink: '/catalogo?category=TRANSFORMADORES',
    tag: 'Garantía Oficial KVA',
  },
  {
    id: 2,
    title: 'PLANTAS ELÉCTRICAS Y RESPALDO',
    description: 'Soluciones continuas e insonorizadas en diésel y estaciones portátiles LiFePO4 para cero apagones.',
    desktopImg: '/ofertas/oferta-plantas.jpg',
    mobileImg: '/ofertas/oferta-plantas-mobile.jpg',
    btnLink: '/catalogo?category=RESPALDO',
    tag: 'Alta Eficiencia',
  },
  {
    id: 3,
    title: 'ENVÍO NACIONAL GRATUITO',
    description: 'Despacho protegido a toda Venezuela en compras industriales superiores a $50.',
    desktopImg: '/ofertas/oferta-envios.jpg',
    mobileImg: '/ofertas/oferta-envios-mobile.jpg',
    btnLink: '/catalogo',
    tag: 'Beneficio Corporativo',
  },
];

export function OffersCarousel() {
  const autoplayOptions = { delay: 6500, stopOnInteraction: false };
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay(autoplayOptions)]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [offers, setOffers] = useState<any[]>(defaultOffers);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Leer primero de la base de datos sincronizada de kva
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
      <div ref={emblaRef} className="overflow-hidden rounded-3xl liquid-glass-dark shadow-[0_0_40px_rgba(0,68,255,0.15)] relative">
        <div className="flex">
          {offers.map((offer) => {
            const desktopImage = offer.desktopImg || offer.bgImageDesktop || '';
            const mobileImage = offer.mobileImg || offer.bgImageMobile || desktopImage;

            return (
              <div
                key={offer.id}
                className="flex-[0_0_100%] min-w-0 relative h-[420px] sm:h-[460px] md:h-[500px] lg:h-[540px] w-full flex items-center"
              >
                {/* Imagen para PC */}
                <div
                  className="hidden md:block absolute inset-0 bg-cover bg-center z-0 opacity-80 mix-blend-screen"
                  style={{ backgroundImage: `url('${desktopImage}')` }}
                />

                {/* Imagen para Móvil */}
                <div
                  className="block md:hidden absolute inset-0 bg-cover bg-center z-0 opacity-80 mix-blend-screen"
                  style={{ backgroundImage: `url('${mobileImage}')` }}
                />

                {/* Capa de protección para legibilidad (Fondo Oscuro sobre imagen) */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#05070E]/95 via-[#05070E]/70 to-transparent z-10" />

                <Link href={offer.btnLink || '/catalogo'} className="absolute inset-0 z-20 cursor-pointer" />

                {/* Contenido Textual */}
                <div className="relative z-30 w-full max-w-2xl px-6 sm:px-10 md:px-16 lg:px-20 flex flex-col items-start text-left pointer-events-none">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-dark text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {offer.tag || 'Promoción Industrial'}
                  </span>

                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
                    {offer.title}
                  </h2>

                  <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium leading-relaxed mb-8 max-w-lg drop-shadow-md">
                    {offer.description}
                  </p>

                  <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full liquid-glass-active text-white font-black text-[10px] sm:text-xs uppercase tracking-wider pointer-events-auto cursor-pointer shadow-[0_0_20px_rgba(0,68,255,0.4)]">
                    <span>Ver Equipos</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Paginación */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 flex items-center gap-2.5 z-30 pointer-events-auto">
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        index === selectedIndex
                          ? 'bg-blue-500 w-8 shadow-[0_0_10px_rgba(0,68,255,0.8)]'
                          : 'bg-white/30 hover:bg-white/50 w-2'
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