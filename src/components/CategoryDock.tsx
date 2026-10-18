'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Zap, BatteryCharging, Sun, Cable, Wrench, Shield, LayoutGrid, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { siteConfig } from '@/config/site';

interface CategoryDockProps {
  onSelect: (id: string) => void;
  selectedCategory?: string;
}

const iconMap: Record<string, any> = {
  LayoutGrid, Zap, BatteryCharging, Sun, Cable, Wrench, Shield,
};

export function CategoryDock({
  onSelect,
  selectedCategory = 'Todos',
}: CategoryDockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Sincronización en vivo con el Administrador
  const [categories, setCategories] = useState<any[]>(siteConfig.categories);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localCats = localStorage.getItem('kva_categories_db');
      if (localCats) {
        try {
          const parsed = JSON.parse(localCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasTodos = parsed.some((c: any) => c.id === 'Todos');
            if (!hasTodos) {
              setCategories([{ id: 'Todos', name: 'Catálogo Completo', shortName: 'Todos', slug: 'todos', iconName: 'LayoutGrid', image: '' }, ...parsed]);
            } else {
              setCategories(parsed);
            }
          }
        } catch (e) {}
      }
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative w-full flex items-center">
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Desplazar categorías a la izquierda"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-hide py-6 px-12 sm:px-14 scroll-smooth"
      >
        <div className="flex items-center justify-start lg:justify-between gap-3 sm:gap-4 min-w-max">
          {categories.map((item) => {
            const Icon = iconMap[item.iconName || 'Zap'] || Zap;
            const isSelected = selectedCategory.toUpperCase() === item.id.toUpperCase();

            return (
              <button
                key={`dock-cat-${item.id}`}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`group flex items-center gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 flex-shrink-0 rounded-full hover:-translate-y-1 ${
                  isSelected
                    ? 'liquid-glass-active text-white'
                    : 'liquid-glass-dark text-slate-200 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isSelected ? 'text-white' : 'text-cyan-400'
                  }`}
                />
                <span className="whitespace-nowrap">{item.shortName || item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Desplazar categorías a la derecha"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-dark text-cyan-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}