'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function Afiliados() {
  const [formData, setFormData] = useState({ nombre: '', email: '', codigo: '' });
  const [submitted, setSubmitted] = useState(false);
  const [waLink, setWaLink] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mensaje = `Hola equipo de ${siteConfig.storeName} ⚡, deseo registrarme como aliado comercial B2B.\n\n*Mis datos corporativos:*\n👤 Nombre/Razón Social: ${formData.nombre}\n📧 Email: ${formData.email}\n🎟️ Código de Aliado sugerido: ${formData.codigo.toUpperCase()}\n\nQuedo atento a la aprobación.`;
    const whatsappNum = String(siteConfig.contact.whatsapp || '').replace(/\D/g, '');
    const link = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(mensaje)}`;
    setWaLink(link);
    setSubmitted(true);
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen pt-36 pb-20 text-slate-200 bg-robot-skin">
      <div className="max-w-2xl mx-auto px-4 text-center mb-12 relative z-20">
        <span className="inline-block px-4 py-1.5 liquid-glass-dark border border-cyan-500/30 text-cyan-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          Aliados Comerciales B2B
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Red de <span className="text-blue-600">Distribuidores</span></h1>
        <p className="text-slate-600 font-bold max-w-lg mx-auto text-sm">Únete a nuestra red industrial. Genera tu código de aliado y obtén márgenes de comisión por cada proyecto cerrado.</p>
      </div>

      <div className="max-w-md mx-auto px-4 relative z-20">
        {!submitted ? (
          <div className="liquid-glass-pearl rounded-3xl p-8 md:p-10 shadow-2xl border border-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre / Razón Social</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-4 py-4 rounded-xl liquid-glass-input-light text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="Ej. Constructora KVA C.A." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Correo Corporativo</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-4 rounded-xl liquid-glass-input-light text-slate-900 font-bold focus:border-blue-500 outline-none" placeholder="ventas@empresa.com" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Código Deseado</label>
                <input type="text" required value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase().replace(/\s+/g, '') })} className="w-full px-4 py-4 rounded-xl liquid-glass-input-light text-blue-600 font-black uppercase focus:border-blue-500 outline-none tracking-widest" placeholder="EJ: DISTRIBUIDOR24" />
              </div>
              <button type="submit" className="w-full py-4 rounded-full font-black text-white liquid-glass-active transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs hover:brightness-110 shadow-lg cursor-pointer">
                Enviar Solicitud <MessageCircle className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="liquid-glass-pearl rounded-3xl p-8 md:p-10 text-center shadow-2xl border border-white">
            <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-6 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Solicitud Generada!</h2>
            <p className="text-slate-600 font-medium mb-8 text-sm">Un ingeniero de ventas de {siteConfig.storeName} te espera en WhatsApp para validar tus credenciales B2B.</p>
            <a href={waLink} target="_blank" rel="noreferrer" className="w-full py-4 rounded-full font-black text-white liquid-glass-dark hover:bg-green-600 transition-all flex items-center justify-center gap-2 mb-4 uppercase tracking-widest text-xs cursor-pointer shadow-lg">
              <MessageCircle className="w-4 h-4" /> Finalizar en WhatsApp
            </a>
            <button onClick={() => setSubmitted(false)} className="text-[10px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors cursor-pointer mt-2">Modificar datos</button>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors"><ArrowLeft className="w-4 h-4" /> Volver al catálogo</Link>
        </div>
      </div>
    </div>
  );
}