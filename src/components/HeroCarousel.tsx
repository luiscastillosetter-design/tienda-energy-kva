'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { useContact } from '@/lib/contactSettings';
import { supabase } from '@/lib/supabase';
import { isVideoUrl } from '@/lib/mediaUtils';
import { ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

interface Slide {
  id: string | number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  media: string;
  mobileMedia: string;
}

// Respaldo: el hero estático original (si no hay slides activos o aún no existe el SQL)
const FALLBACK_SLIDE: Slide = {
  id: 'default',
  title: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '',
  media: siteConfig.branding.videoDesktop,
  mobileMedia: siteConfig.branding.videoMobile,
};

const SLIDE_MS = 8000;

function Media({ src, className }: { src: string; className: string }) {
  if (!src) return null;
  if (isVideoUrl(src)) {
    return <video key={src} autoPlay loop muted playsInline className={className} src={src} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />;
}

export function HeroCarousel() {
  const contact = useContact();
  const [slides, setSlides] = useState<Slide[]>([FALLBACK_SLIDE]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      let res: any = await supabase.from('hero_slides').select('*').order('sort_order', { ascending: true });
      if (res.error) res = await supabase.from('hero_slides').select('*').order('id', { ascending: true });
      const rows = (res.data || []).filter((r: any) => r.is_active !== false && (r.media_url || r.mobile_media_url));
      if (!active || rows.length === 0) return;
      setSlides(
        rows.map((r: any) => ({
          id: r.id,
          title: r.title || '',
          subtitle: r.subtitle || '',
          buttonText: r.button_text || '',
          buttonLink: r.button_link || '',
          media: r.media_url || r.mobile_media_url || '',
          mobileMedia: r.mobile_media_url || '',
        }))
      );
      setCurrent(0);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  const whatsappClean = String(contact.whatsapp || '').replace(/\D/g, '');
  const slide = slides[Math.min(current, slides.length - 1)];
  const isCustom = slide.id !== 'default';

  return (
    <div className="relative w-full min-h-[82vh] sm:min-h-[88vh] md:h-[96vh] flex flex-col justify-start overflow-hidden bg-[#050811] pt-[184px] sm:pt-[216px] md:pt-[288px] lg:pt-[336px] xl:pt-[368px] pb-28 sm:pb-36 md:pb-44">
      {/* MEDIA: móvil (md:hidden) y ordenador (hidden md:block) */}
      <div className="absolute inset-0 w-full h-full" key={slide.id}>
        {slide.mobileMedia && (
          <Media src={slide.mobileMedia} className="md:hidden w-full h-full object-cover opacity-60" />
        )}
        <Media
          src={slide.media}
          className={`${slide.mobileMedia ? 'hidden md:block' : ''} w-full h-full object-cover opacity-60`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/80 via-[#050811]/40 to-[#050811]/95 pointer-events-none" />
      </div>

      {/* CONTENIDO FLOTANTE SIN SOLAPAMIENTOS EN MÓVIL */}
      <div className="relative z-20 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex flex-col items-start text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-dark text-[10px] sm:text-xs font-black text-cyan-300 mb-4 sm:mb-5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="uppercase tracking-widest">
            {slide.subtitle || `Garantía Oficial • ${contact.address.split('-')[0].trim()}`}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black mb-3 sm:mb-4 tracking-tight leading-[1.04] drop-shadow-2xl">
          {slide.title ? (
            <span className="text-white">{slide.title}</span>
          ) : (
            <>
              <span className="text-white">ENERGÍA </span>
              <span className="text-cyan-400">PURA</span>
            </>
          )}
        </h1>

        <p className="text-slate-200 text-xs sm:text-base md:text-lg max-w-xl font-medium mb-6 sm:mb-8 leading-relaxed drop-shadow-lg">
          {siteConfig.description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href={isCustom && slide.buttonLink ? slide.buttonLink : '/catalogo'}
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-full liquid-glass-active text-white font-black hover:-translate-y-0.5 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{slide.buttonText || 'Explorar Equipos'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
              siteConfig.whatsapp.defaultMessage
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-full liquid-glass-dark text-cyan-300 hover:text-white font-black hover:-translate-y-0.5 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <span>Hablar con Ingeniero</span>
          </a>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center gap-2 mt-6">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${i === current ? 'w-8 bg-cyan-400' : 'w-3 bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
