'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { siteConfig } from '@/config/site';
import { ChevronLeft, CheckCircle2, MapPin, CreditCard, User, ShoppingBag } from 'lucide-react';

export default function CheckoutPage() {
  const { items, clearCart, currency, bcvRate, usdtRate } = useCartStore();
  const router = useRouter();

  // Formularios
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [courier, setCourier] = useState('MRW');
  const [estado, setEstado] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [metodoPago, setMetodoPago] = useState('Zelle');
  const [refCode, setRefCode] = useState('DIRECTO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedRef = localStorage.getItem('store_ref');
    if (storedRef) setRefCode(storedRef);
  }, []);

  const subtotalUSD = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const envioGratis = subtotalUSD >= (siteConfig.freeShippingThreshold || 50);

  const formatPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'USDT') {
      return `${usdPrice.toFixed(2)} USDT`;
    }
    return `${siteConfig.currencySymbol}${usdPrice.toFixed(2)}`;
  };

  const enviarPedidoWhatsApp = () => {
    setIsSubmitting(true);
    
    const listaProductos = items
      .map(item => `🔹 *${item.title}*\n   Cant: ${item.quantity} | Unit: $${item.price.toFixed(2)} | Sub: $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n\n');

    let totalString = `💰 *TOTAL A PAGAR:* $${subtotalUSD.toFixed(2)} USD`;
    if (metodoPago.includes('Pago Móvil') && bcvRate > 0) {
      totalString += `\n🔄 *(Equivalente a Bs. ${(subtotalUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })})*`;
    } else if (metodoPago.includes('Binance')) {
      totalString += `\n🔄 *(Equivalente a ${subtotalUSD.toFixed(2)} USDT)*`;
    }

    const mensaje = 
      `*NUEVA ORDEN - ${siteConfig.storeName.toUpperCase()}*\n` +
      `===========================\n\n` +
      `🛍️ *PRODUCTOS:*\n${listaProductos}\n\n` +
      `${totalString}\n` +
      `🚚 *ENVÍO:* ${envioGratis ? 'GRATIS' : 'Cobro en Destino'}\n\n` +
      `===========================\n\n` +
      `👤 *DATOS DEL CLIENTE:*\n` +
      `- Nombre: ${nombre} ${apellido}\n` +
      `- Teléfono: ${telefono}\n\n` +
      `📍 *DIRECCIÓN DE ENTREGA:*\n` +
      `- Agencia/Método: ${courier}\n` +
      `- Destino: ${ciudad}, ${estado}\n` +
      `- Detalles: ${direccion}\n\n` +
      `💳 *MÉTODO DE PAGO:* ${metodoPago}` +
      (refCode !== 'DIRECTO' ? `\n\n🎟️ *CÓDIGO AFILIADO:* ${refCode}` : '');

    const whatsappNum = String(siteConfig.contact.whatsapp).replace(/\D/g, '');

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      router.push('/');
    }, 2000);

    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleConfirmarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }
    enviarPedidoWhatsApp();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-4 relative z-10">
        <ShoppingBag className="w-20 h-20 text-slate-300 mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-4">No hay equipos por facturar</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md font-medium">Vuelve al catálogo para agregar componentes a tu orden industrial.</p>
        <button
          onClick={() => router.push('/catalogo')}
          className="liquid-glass-active text-white px-8 py-4 rounded-full font-black uppercase tracking-wider cursor-pointer"
        >
          Explorar Inventario
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[100px] md:pt-[120px] pb-28 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 text-slate-900 w-full relative z-10">
      <div className="w-full mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black text-xs uppercase tracking-wider transition-colors w-fit cursor-pointer"
          >
            <div className="p-2 liquid-glass-pearl rounded-full group-hover:border-blue-400">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Modificar Carrito
          </button>
          
          <div className="flex items-center gap-2 liquid-glass-pearl px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600">Checkout Seguro • {siteConfig.storeName}</span>
          </div>
        </div>
        
        <form onSubmit={handleConfirmarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Tarjeta Datos Personales */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><User className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Datos de Facturación</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Carlos" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Apellido</label>
                  <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Rodríguez" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">WhatsApp / Teléfono</label>
                  <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="+58 414 0000000" />
                </div>
              </div>
            </div>

            {/* Tarjeta Logística */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><MapPin className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Logística de Entrega</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Agencia / Modalidad</label>
                  <select value={courier} onChange={(e) => setCourier(e.target.value)} className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 font-bold outline-none cursor-pointer appearance-none">
                    <option value="MRW">Agencia MRW</option>
                    <option value="Zoom">Agencia Zoom</option>
                    <option value="Tealca">Agencia Tealca</option>
                    <option value="Delivery Local">Delivery Local (Guanare)</option>
                    <option value="Retiro en Tienda">Retiro en Sede Física</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Estado</label>
                    <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Portuguesa" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ciudad</label>
                    <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Guanare" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Dirección Exacta</label>
                  <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Nombre de agencia o dirección de entrega" />
                </div>
              </div>
            </div>

            {/* Tarjeta Método de Pago */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><CreditCard className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Método de Pago</h2>
              </div>
              
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 font-bold outline-none cursor-pointer appearance-none">
                <option value="Zelle">Zelle (USD)</option>
                <option value="Pago Móvil">Pago Móvil (Bs al cambio)</option>
                <option value="Binance Pay">Binance Pay (USDT)</option>
                <option value="Efectivo">Efectivo (Solo en Tienda)</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria Nacional</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-wider">
                Los datos de transferencia te serán proporcionados por nuestro ingeniero de ventas vía WhatsApp para mayor seguridad.
              </p>
            </div>
            
          </div>

          {/* COLUMNA DERECHA: RESUMEN (Sticky) */}
          <div className="lg:col-span-5 relative">
            <div className="liquid-glass-pearl p-6 md:p-8 sticky top-[100px] md:top-[120px]">
              
              <h2 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-4 mb-6 uppercase tracking-wider">
                Resumen de Orden
              </h2>

              <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 scrollbar-hide mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-white/40 p-3 rounded-2xl border border-slate-200">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="w-full h-full object-contain p-1.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">{item.title}</h4>
                      <p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-wider">Cant: <span className="text-blue-600">{item.quantity}</span></p>
                    </div>
                    <span className="font-black text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-white/50 rounded-2xl p-5 border border-slate-200 space-y-3 mb-8">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Subtotal</span>
                  <span className="text-slate-900">{formatPrice(subtotalUSD)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Envío Nacional</span>
                  <span className={envioGratis ? 'text-green-600' : 'text-slate-900'}>
                    {envioGratis ? 'GRATIS' : 'Cobro en Destino'}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-300 flex items-end justify-between">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-blue-600">
                    {formatPrice(subtotalUSD)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full liquid-glass-active text-white py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando Orden...' : 'Facturar vía WhatsApp'}
              </button>
              
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}