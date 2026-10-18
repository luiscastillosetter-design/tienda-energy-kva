'use client';

import { useRef, useState, useEffect } from 'react';
import { Zap, BatteryCharging, Sun, Cable, Wrench, Shield, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { supabase } from '@/lib/supabase';

interface CategoryDockProps {
  onSelect: (id: string) => void;
  selectedCategory?: string;
}

const iconMap: Record<string, any> = { LayoutGrid, Zap, BatteryCharging, Sun, Cable, Wrench, Shield };

export function CategoryDock({ onSelect, selectedCategory = 'Todos' }: CategoryDockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<any[]>(siteConfig.categories);

  useEffect(() => {
    const fetchCats = async () => {
      if (typeof window !== 'undefined') {
        const { data } = await supabase.from('categories').select('*').order('id', { ascending: true });
        if (data && data.length > 0) {
          localStorage.setItem('kva_categories_db', JSON.stringify(data));
          const hasTodos = data.some((c: any) => c.id === 'Todos');
          if (!hasTodos) {
            setCategories([{ id: 'Todos', name: 'Catálogo Completo', shortName: 'Todos', slug: 'todos', iconName: 'LayoutGrid', image: '' }, ...data]);
          } else {
            setCategories(data);
          }
        } else {
          const localCats = localStorage.getItem('kva_categories_db');
          if (localCats) {
            try { setCategories(JSON.parse(localCats)); } catch (e) {}
          }
        }
      }
    };
    fetchCats();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <button 
        type="button" 
        onClick={() => scroll('left')} 
        aria-label="Desplazar a la izquierda" 
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white items-center justify-center cursor-pointer shadow-lg active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Reducción de márgenes horizontales (px-2) en móvil para que encaje al ocultar las flechas */}
      <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide py-6 px-2 md:px-14 scroll-smooth">
        <div className="flex items-center justify-start lg:justify-between gap-3 sm:gap-4 min-w-max">
          {categories.map((item) => {
            const Icon = iconMap[item.iconName || 'Zap'] || Zap;
            const isSelected = selectedCategory.toUpperCase() === item.id.toUpperCase();
            return (
              <button 
                key={`dock-cat-${item.id}`} 
                type="button" 
                onClick={() => onSelect(item.id)} 
                className={`group flex items-center gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 flex-shrink-0 rounded-full hover:-translate-y-1 ${isSelected ? 'liquid-glass-active text-white' : 'liquid-glass-dark text-slate-200 hover:text-white'}`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                <span className="whitespace-nowrap">{item.shortName || item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button 
        type="button" 
        onClick={() => scroll('right')} 
        aria-label="Desplazar a la derecha" 
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white items-center justify-center cursor-pointer shadow-lg active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}