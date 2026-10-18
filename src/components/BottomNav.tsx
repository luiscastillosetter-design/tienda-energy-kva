'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, Cpu, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import AuthModal from './AuthModal';

export default function BottomNav() {
  const { items, toggleCart, isCartOpen } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleMenuState = (e: CustomEvent) => {
      setIsMenuOpen(e.detail.isOpen);
    };
    window.addEventListener('kva-menu-toggle' as any, handleMenuState);
    return () => window.removeEventListener('kva-menu-toggle' as any, handleMenuState);
  }, []);

  if (pathname?.startsWith('/admin') || isMenuOpen || isCartOpen) return null;

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
    else router.push('/');
  };

  const openAdvisor = () => {
    window.dispatchEvent(new CustomEvent('open-advisor'));
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[45] liquid-glass-dark rounded-full px-2 py-1.5 shadow-2xl flex items-center justify-around border border-white/10">
        <button onClick={handleHomeClick} className={`flex flex-col items-center gap-1 p-2 transition-transform active:scale-95 cursor-pointer ${pathname === '/' ? 'text-blue-400' : 'text-slate-400 hover:text-blue-300'}`}>
          <Home className={`w-5 h-5 ${pathname === '/' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Inicio</span>
        </button>
        
        <Link href="/catalogo" className={`flex flex-col items-center gap-1 p-2 transition-transform active:scale-95 cursor-pointer ${pathname === '/catalogo' ? 'text-blue-400' : 'text-slate-400 hover:text-blue-300'}`}>
          <LayoutGrid className={`w-5 h-5 ${pathname === '/catalogo' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Catálogo</span>
        </Link>
        
        <button onClick={() => toggleCart()} className="flex flex-col items-center justify-center -mt-8 relative cursor-pointer group" aria-label="Abrir carrito">
          <div className="w-14 h-14 rounded-full liquid-glass-active flex items-center justify-center group-active:scale-95 transition-transform border-[3px] border-[#0A0E17]">
            <ShoppingBag className="w-6 h-6 text-white drop-shadow-md" />
            {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-[11px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-[#0A0E17] shadow-lg">{cartItemsCount}</span>}
          </div>
        </button>
        
        <button onClick={openAdvisor} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-cyan-400 transition-transform active:scale-95 cursor-pointer">
          <Cpu className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Advisor</span>
        </button>
        
        <button onClick={() => setIsAuthOpen(true)} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-blue-400 transition-transform active:scale-95 cursor-pointer">
          <User className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Cuenta</span>
        </button>
      </nav>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}