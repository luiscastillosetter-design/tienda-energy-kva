'use client';

import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { siteConfig } from '@/config/site';

export default function CartDrawer() {
  const router = useRouter();
  const { items, isCartOpen, toggleCart, updateQuantity, removeItem, currency, bcvRate, usdtRate } = useCartStore();

  const subtotalUSD = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = siteConfig.freeShippingThreshold || 50; 
  const progress = Math.min(100, (subtotalUSD / freeShippingThreshold) * 100);
  const remainingUSD = Math.max(0, freeShippingThreshold - subtotalUSD);

  const handleCheckout = () => {
    toggleCart();
    router.push('/checkout');
  };

  const formatPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'USDT') {
      return `${usdPrice.toFixed(2)} USDT`;
    }
    return `${siteConfig.currencySymbol}${usdPrice.toFixed(2)}`;
  };

  return (
    <>
      {/* VELO DE FONDO */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[140] transition-opacity"
          onClick={toggleCart}
        />
      )}

      {/* CAJÓN DEL CARRITO */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] max-w-[85vw] bg-[#0A0E17]/95 backdrop-blur-2xl border-l border-white/15 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] z-[150] transform transition-transform duration-300 ease-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* CABECERA */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#07090E]">
          <div className="flex items-center gap-3">
            <div className="p-2 liquid-glass-active rounded-full">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Tu Carrito ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button 
            onClick={toggleCart} 
            className="p-2 rounded-full liquid-glass-dark text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE PROGRESO DE ENVÍO GRATIS */}
        <div className="bg-blue-900/20 px-6 py-4 border-b border-blue-500/20 text-xs text-blue-200 font-medium shadow-inner">
          {remainingUSD > 0 ? (
            <p className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Agrega <span className="font-black text-yellow-400">{formatPrice(remainingUSD)}</span> para envío nacional gratis.</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 font-black text-yellow-400 tracking-wider uppercase">
              <Truck className="w-4 h-4" /> ¡Calificas para Envío Gratis!
            </p>
          )}
          <div className="w-full bg-[#07090E] h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
            <div 
              className="bg-blue-500 h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 liquid-glass-dark rounded-full flex items-center justify-center text-slate-500 mb-6 shadow-lg">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-lg font-black text-slate-200 mb-2">Tu carrito está vacío</p>
              <p className="text-xs font-medium text-slate-500 max-w-[200px]">Explora el catálogo y añade equipos industriales a tu orden.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center border-b border-white/5 pb-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/90 border border-white/20 flex-shrink-0 flex items-center justify-center shadow-sm">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-sm font-black text-blue-400 mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center liquid-glass-dark rounded-lg overflow-hidden border border-white/10 h-8">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer font-black"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer font-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors p-1.5 liquid-glass-dark rounded-lg cursor-pointer"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIE DEL CARRITO: TOTALES Y CHECKOUT */}
        <div className="p-6 bg-[#07090E] border-t border-white/10">
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="text-slate-200">{formatPrice(subtotalUSD)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Envío</span>
              <span className={remainingUSD === 0 && items.length > 0 ? 'text-green-400' : 'text-blue-400'}>
                {remainingUSD === 0 && items.length > 0 ? 'GRATIS' : 'Calculado al final'}
              </span>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-end justify-between">
              <span className="text-sm font-black text-white uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-blue-500 drop-shadow-md">
                {formatPrice(subtotalUSD)}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-4 rounded-full font-black liquid-glass-active text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center gap-3"
          >
            Proceder al Pago <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}