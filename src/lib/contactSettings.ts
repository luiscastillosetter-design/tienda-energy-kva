'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/config/site';

export interface ContactSettings {
  phoneDisplay: string; // Teléfono principal (visible)
  whatsapp: string; // WhatsApp de ventas, solo dígitos con código de país (ej. 584140909873)
  email: string;
  address: string;
}

export const DEFAULT_CONTACT: ContactSettings = {
  phoneDisplay: siteConfig.contact.phoneDisplay,
  whatsapp: siteConfig.contact.whatsapp,
  email: siteConfig.contact.email,
  address: siteConfig.location,
};

const CACHE_KEY = 'kva_contact_db';
const EVENT_NAME = 'kva-contact-updated';

export function rowToContact(row: any): ContactSettings {
  return {
    phoneDisplay: row?.phone_display || DEFAULT_CONTACT.phoneDisplay,
    whatsapp: String(row?.whatsapp || DEFAULT_CONTACT.whatsapp).replace(/\D/g, ''),
    email: row?.email || DEFAULT_CONTACT.email,
    address: row?.address || DEFAULT_CONTACT.address,
  };
}

export function broadcastContact(c: ContactSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: c }));
  } catch {}
}

/** Datos de contacto en vivo desde Supabase (tabla contact_settings), con respaldo local y siteConfig. */
export function useContact(): ContactSettings {
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setContact({ ...DEFAULT_CONTACT, ...JSON.parse(cached) });
    } catch {}

    let active = true;
    supabase
      .from('contact_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          const c = rowToContact(data);
          setContact(c);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
        }
      });

    const onUpdate = (e: Event) => setContact((e as CustomEvent).detail);
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => {
      active = false;
      window.removeEventListener(EVENT_NAME, onUpdate);
    };
  }, []);

  return contact;
}
