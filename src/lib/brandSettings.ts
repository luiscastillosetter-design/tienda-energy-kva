'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/config/site';

export interface BrandSettings {
  storeName: string;
  tagline: string;
  logoUrl: string; // Logotipo principal ('' = usar logos por defecto del sitio)
  footerLogoUrl: string; // Logotipo secundario / pie de página ('' = sin logo en el pie)
}

export const DEFAULT_BRAND: BrandSettings = {
  storeName: siteConfig.storeName,
  tagline: siteConfig.tagline,
  logoUrl: '',
  footerLogoUrl: '',
};

const CACHE_KEY = 'kva_brand_db';
const EVENT_NAME = 'kva-brand-updated';

export function rowToBrand(row: any): BrandSettings {
  return {
    storeName: row?.store_name || DEFAULT_BRAND.storeName,
    tagline: row?.tagline || DEFAULT_BRAND.tagline,
    logoUrl: row?.logo_url || '',
    footerLogoUrl: row?.footer_logo_url || '',
  };
}

export function broadcastBrand(b: BrandSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(b));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: b }));
  } catch {}
}

/** Marca en vivo desde Supabase (store_settings), con respaldo local y siteConfig. */
export function useBrand(): BrandSettings {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setBrand({ ...DEFAULT_BRAND, ...JSON.parse(cached) });
    } catch {}

    let active = true;
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          const b = rowToBrand(data);
          setBrand(b);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(b)); } catch {}
        }
      });

    const onUpdate = (e: Event) => setBrand((e as CustomEvent).detail);
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => {
      active = false;
      window.removeEventListener(EVENT_NAME, onUpdate);
    };
  }, []);

  return brand;
}
