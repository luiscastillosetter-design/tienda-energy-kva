'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

export function HeroCarousel() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const whatsappClean = String(
    siteConfig.whatsapp?.number || siteConfig.contact.whatsapp || ''
  ).replace(/\D/g, '');

  const videoSrc = isMobile
    ? siteConfig.branding.videoMobile
    : siteConfig.branding.videoDesktop;

  return (
    <div className="relative w-full min-h-[82vh] sm:min-h-[88vh] md:h-[96vh] flex flex-col justify-center overflow-hidden bg-[#050811] pt-28 pb-28 sm:pb-36 md:pb-44">
      {/* UN SOLO VIDEO ACTIVO EN MEMORIA SEGÚN DISPOSITIVO */}
      <div className="absolute inset-0 w-full h-full">
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050811]/80 via-[#050811]/40 to-[#050811]/95 pointer-events-none" />
      </div>

      {/* CONTENIDO FLOTANTE SIN SOLAPAMIENTOS EN MÓVIL */}
      <div className="relative z-20 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex flex-col items-start text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-dark text-[10px] sm:text-xs font-black text-cyan-300 mb-4 sm:mb-5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="uppercase tracking-widest">
            Garantía Oficial • {siteConfig.location.split('-')[0].trim()}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-black mb-3 sm:mb-4 tracking-tight leading-[1.04] drop-shadow-2xl">
          <span className="text-white">ENERGÍA </span>
          <span className="text-cyan-400">PURA</span>
        </h1>

        <p className="text-slate-200 text-xs sm:text-base md:text-lg max-w-xl font-medium mb-6 sm:mb-8 leading-relaxed drop-shadow-lg">
          {siteConfig.description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/catalogo"
            className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-full liquid-glass-active text-white font-black hover:-translate-y-0.5 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explorar Equipos</span>
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
      </div>
    </div>
  );
}