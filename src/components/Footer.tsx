'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="w-full bg-[#0F172A] border-t border-slate-800 mt-auto px-4 md:px-12 pt-12 pb-28 md:py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        
        {/* Columna 1: Marca (Dinámica conectada a siteConfig) */}
        <div className="flex flex-col items-start text-left">
          <h3 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic mb-4 uppercase">
            {siteConfig.storeName}
          </h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
            {siteConfig.description}
          </p>
        </div>

        {/* Columna 2: Enlaces */}
        <div className="flex flex-col items-start text-left">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4">Enlaces Rápidos</h3>
          <ul className="space-y-3">
            {siteConfig.navigation.slice(0, 3).map((item, idx) => (
              <li key={idx}>
                <Link href={item.href} className="text-sm text-slate-400 hover:text-cyan-400 font-semibold transition-colors">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Contacto */}
        <div className="flex flex-col items-start text-left">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-4">Contacto</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <div className="p-2 bg-[#1E293B] border border-slate-700 rounded-full text-cyan-400">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{siteConfig.contact.phoneDisplay}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-2 bg-[#1E293B] border border-slate-700 rounded-full text-cyan-400">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{siteConfig.contact.email}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-2 bg-[#1E293B] border border-slate-700 rounded-full text-cyan-400">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{siteConfig.location}</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} {siteConfig.storeName}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}