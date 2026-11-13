'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatProduct } from '@/services/productService';
import type { Product } from '@/data/products';

interface LiveOffer {
  id: number;
  label: string;
  promoPrice: number;
  percent: number;
  product: Product;
}

/** Ofertas por equipo publicadas desde /admin (tabla product_offers), actualizadas en tiempo real. */
export function ProductOffers() {
  const [offers, setOffers] = useState<LiveOffer[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: rows, error } = await supabase
        .from('product_offers')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: false });
      if (error || !rows || rows.length === 0) {
        if (active) setOffers([]);
        return;
      }
      const ids = rows.map((r: any) => r.product_id);
      const { data: prods } = await supabase.from('products').select('*').in('id', ids);
      const map = new Map((prods || []).map((p: any) => [String(p.id), formatProduct(p)]));
      const live: LiveOffer[] = rows
        .filter((r: any) => map.has(String(r.product_id)))
        .map((r: any) => {
          const product = map.get(String(r.product_id)) as Product;
          const promo = Number(r.promo_price);
          return {
            id: r.id,
            label: r.label || 'OFERTA',
            promoPrice: promo,
            percent: product.price > 0 ? Math.round((1 - promo / product.price) * 100) : 0,
            product,
          };
        });
      if (active) setOffers(live);
    };

    load();
    const channel = supabase
      .channel('product-offers-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_offers' }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (offers.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-6 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-6" id="ofertas-equipos">
      <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-black text-white uppercase tracking-tight mb-4">
        <Zap className="w-5 h-5 text-amber-400" /> Ofertas del Momento
      </h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {offers.map((o) => (
          <Link
            key={o.id}
            href={`/product/${encodeURIComponent(o.product.id)}`}
            className="flex-shrink-0 w-64 liquid-glass-dark rounded-2xl p-4 hover:-translate-y-1 transition-transform"
          >
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md mb-3">
              {o.label}
            </span>
            <div className="h-36 rounded-xl bg-white/90 flex items-center justify-center overflow-hidden mb-3">
              <img src={o.product.images[0]} alt={o.product.title} className="h-full w-full object-contain p-2" />
            </div>
            <p className="text-xs font-bold text-white line-clamp-2 min-h-[2rem]">{o.product.title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-cyan-300">${o.promoPrice.toFixed(2)}</span>
              <span className="text-xs text-slate-400 line-through">${o.product.price.toFixed(2)}</span>
              {o.percent > 0 && <span className="text-[10px] font-black text-emerald-400">-{o.percent}%</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
