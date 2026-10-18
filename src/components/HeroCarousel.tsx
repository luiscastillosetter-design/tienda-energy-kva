'use client';

import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

export function HeroCarousel() {
  const whatsappClean = String(
    siteConfig.whatsapp?.number || siteConfig.contact.whatsapp || ''
  ).replace(/\D/g, '');

  return (
    <div className="relative w-full min-h-[92vh] md:h-[100vh] flex flex-col justify-center overflow-hidden bg-[#07090E] pt-28 pb-36 sm:pb-40 md:pb-48">
      {/* VIDEO FONDO MÓVIL */}
      <div className="md:hidden absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-65"
        >
          <source src={siteConfig.branding.videoMobile} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090E]/70 via-black/35 to-[#07090E]/90 pointer-events-none" />
      </div>

      {/* VIDEO FONDO ESCRITORIO */}
      <div className="hidden md:block absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-55"
        >
          <source src={siteConfig.branding.videoDesktop} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E]/80 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* CONTENIDO FLOTANTE ALINEADO AL CENTRO-IZQUIERDA */}
      <div className="relative z-20 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex flex-col items-start text-left">
        {/* Píldora Superior Liquid Glass */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 liquid-glass-dark text-[10px] sm:text-xs font-black text-cyan-300 mb-5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="uppercase tracking-widest">
            Garantía Oficial • {siteConfig.location.split('-')[0].trim()}
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black mb-4 tracking-tight leading-[1.02] drop-shadow-2xl">
          <span className="text-white">ENERGÍA </span>
          <span className="text-cyan-400">PURA</span>
        </h1>

        <p className="text-slate-200 text-sm sm:text-base md:text-lg max-w-xl font-medium mb-8 leading-relaxed drop-shadow-lg">
          {siteConfig.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/catalogo"
            className="w-full sm:w-auto px-8 py-4 liquid-glass-active text-white font-black hover:-translate-y-1 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            Explorar Equipos <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(
              siteConfig.whatsapp.defaultMessage
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-8 py-4 liquid-glass-dark text-cyan-400 hover:text-cyan-300 font-black hover:-translate-y-1 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" /> Hablar con Ingeniero
          </a>
        </div>
      </div>
    </div>
  );
}