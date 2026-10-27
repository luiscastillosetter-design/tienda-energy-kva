'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { siteConfig } from '@/config/site';
import { 
  ChevronLeft, CheckCircle2, MapPin, CreditCard, 
  User, ShoppingBag, Copy, UploadCloud, FileCheck, ArrowRight
} from 'lucide-react';

export default function CheckoutPage() {
  const { items, clearCart, currency, bcvRate, usdtRate } = useCartStore();
  const router = useRouter();

  // Datos de Facturación
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Logística
  const [courier, setCourier] = useState('Retiro en Tienda');
  const [estado, setEstado] = useState('Portuguesa');
  const [ciudad, setCiudad] = useState('Guanare');
  const [direccion, setDireccion] = useState('Tienda Física ENERGY KVA');
  
  // Pagos
  const [metodoPagoId, setMetodoPagoId] = useState(siteConfig.paymentMethods[0].id);
  const [referencia, setReferencia] = useState('');
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotalUSD = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const envioGratis = subtotalUSD >= (siteConfig.freeShippingThreshold || 50);
  
  const selectedMethod = siteConfig.paymentMethods.find(m => m.id === metodoPagoId) || siteConfig.paymentMethods[0];

  const formatDisplayPrice = () => {
    if (selectedMethod.currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(subtotalUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (selectedMethod.currency === 'USDT') {
      return `${subtotalUSD.toFixed(2)} USDT`;
    }
    return `$${subtotalUSD.toFixed(2)} USD`;
  };

  const formatItemPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'USDT') {
      return `${usdPrice.toFixed(2)} USDT`;
    }
    return `$${usdPrice.toFixed(2)}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('La imagen es muy pesada. Máximo 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobanteBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Tu carrito está vacío.');
    if (selectedMethod.requiresReference && referencia.trim().length < 4) {
      return alert('Debes ingresar un número de referencia válido.');
    }
    if (selectedMethod.requiresReceipt && !comprobanteBase64) {
      return alert('Debes subir la captura del comprobante de pago.');
    }

    setIsSubmitting(true);
    
    try {
      const orderPayload = {
        clientName: `${nombre} ${apellido}`.trim(),
        clientDni: cedula,
        clientPhone: telefono,
        paymentMethod: selectedMethod.name,
        paymentReference: referencia || null,
        receiptBase64: comprobanteBase64,
        totalUsd: subtotalUSD,
        totalVes: selectedMethod.currency === 'VES' ? subtotalUSD * bcvRate : null,
        exchangeRate: selectedMethod.currency === 'VES' ? bcvRate : (selectedMethod.currency === 'USDT' ? usdtRate : null),
        items: items
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error procesando la orden');
      }

      const displayId = data.order.display_id;
      enviarPedidoWhatsApp(displayId);

    } catch (error) {
      alert('Error de conexión guardando el pedido. Intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  const enviarPedidoWhatsApp = (orderId: string) => {
    const listaProductos = items
      .map(item => `🔹 *${item.title}*\n   Cant: ${item.quantity} | Unit: $${item.price.toFixed(2)} | Sub: $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n\n');

    const totalString = `💰 *TOTAL PAGADO:* ${formatDisplayPrice()}\n(_Equivalente a $${subtotalUSD.toFixed(2)} USD_)`;

    const mensaje = 
      `*NUEVA ORDEN WEB: ${orderId}*\n` +
      `===========================\n\n` +
      `👤 *CLIENTE:*\n` +
      `- Nombre: ${nombre} ${apellido}\n` +
      `- C.I./RIF: ${cedula}\n` +
      `- Teléfono: ${telefono}\n\n` +
      `🛍️ *PRODUCTOS:*\n${listaProductos}\n\n` +
      `${totalString}\n\n` +
      `🚚 *ENTREGA:*\n` +
      `- Método: ${courier}\n` +
      `- Destino: ${ciudad}, ${estado}\n\n` +
      `💳 *PAGO:*\n` +
      `- Método: ${selectedMethod.shortLabel}\n` +
      (referencia ? `- Referencia: ${referencia}\n` : '') +
      (comprobanteBase64 ? `- Comprobante adjunto en el sistema web.\n` : '') +
      `\nSolicito verificación de administración para despacho.`;

    const whatsappNum = String(siteConfig.contact.whatsapp).replace(/\D/g, '');

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      router.push('/');
    }, 2000);

    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(mensaje)}`, '_blank');
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
    <div className="min-h-screen pt-[100px] md:pt-[120px] pb-28 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 text-slate-900 w-full relative z-10 bg-robot-skin">
      <div className="w-full mx-auto max-w-7xl">
        
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
          
          <div className="flex items-center gap-2 liquid-glass-pearl px-4 py-2 rounded-full border border-white">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600">Checkout Seguro • {siteConfig.storeName}</span>
          </div>
        </div>
        
        <form onSubmit={handleConfirmarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Datos Personales */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><User className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Datos de Facturación</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cédula / RIF</label>
                  <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value.toUpperCase())} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none font-bold" placeholder="V-12345678 o J-123456789" />
                </div>
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
                  <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="0414-0000000" />
                </div>
              </div>
            </div>

            {/* Logística */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><MapPin className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Logística de Entrega</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Modalidad</label>
                  <select value={courier} onChange={(e) => setCourier(e.target.value)} className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 font-bold outline-none cursor-pointer appearance-none">
                    <option value="Retiro en Tienda">Retiro en Sede Física (Guanare)</option>
                    <option value="MRW">Envío Nacional MRW</option>
                    <option value="Tealca">Envío Nacional Tealca</option>
                    <option value="Zoom">Envío Nacional Zoom</option>
                  </select>
                </div>
                
                {courier !== 'Retiro en Tienda' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Estado</label>
                        <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Lara" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ciudad</label>
                        <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Ej. Barquisimeto" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Dirección Exacta / Agencia</label>
                      <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required className="w-full h-12 px-4 rounded-xl liquid-glass-input-light text-slate-900 placeholder-slate-400 outline-none" placeholder="Nombre de agencia o dirección completa" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="liquid-glass-pearl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><CreditCard className="w-5 h-5" /></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Verificación de Pago</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block">Selecciona Método</label>
                  <select 
                    value={metodoPagoId} 
                    onChange={(e) => {
                      setMetodoPagoId(e.target.value as any);
                      setReferencia('');
                      setComprobanteBase64(null);
                    }} 
                    className="w-full h-12 px-4 rounded-xl liquid-glass-active text-white font-black outline-none cursor-pointer appearance-none text-sm uppercase tracking-wider"
                  >
                    {siteConfig.paymentMethods.map(method => (
                      <option key={method.id} value={method.id} className="bg-slate-900 text-white">{method.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-5 rounded-2xl bg-[#0A0E17] border border-blue-500/30 shadow-inner">
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed font-medium">{selectedMethod.instructions}</p>
                  
                  <div className="space-y-3 mb-5">
                    {selectedMethod.details.map((detail, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/5 gap-2">
                        <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">{detail.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white break-all">{detail.value}</span>
                          {detail.copyValue && (
                            <button 
                              type="button" 
                              onClick={() => handleCopy(detail.copyValue!)}
                              className="p-1.5 liquid-glass-dark text-slate-300 hover:text-white rounded-md cursor-pointer transition-colors"
                              title="Copiar"
                            >
                              {copiedText === detail.copyValue ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMethod.currency === 'VES' && bcvRate > 0 && (
                    <div className="p-3.5 mb-5 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Monto Exacto a Transferir (BCV)</span>
                      <span className="text-2xl font-black text-cyan-400 drop-shadow-md">{formatDisplayPrice()}</span>
                    </div>
                  )}

                  {selectedMethod.requiresReference && (
                    <div className="mb-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Número de Referencia</label>
                      <input 
                        type="text" 
                        value={referencia} 
                        onChange={(e) => setReferencia(e.target.value)} 
                        maxLength={20}
                        required 
                        className="w-full h-11 px-4 rounded-xl bg-[#05070E] border border-white/10 text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors font-mono text-sm" 
                        placeholder="Ej. 12345678901234567890" 
                      />
                    </div>
                  )}

                  {selectedMethod.requiresReceipt && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Capture del Comprobante</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${comprobanteBase64 ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 bg-white/5 hover:border-cyan-400/50'}`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          accept="image/png, image/jpeg, image/jpg, application/pdf" 
                          className="hidden" 
                        />
                        {comprobanteBase64 ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileCheck className="w-6 h-6 text-green-400" />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Comprobante Adjunto</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="w-6 h-6 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Click para subir foto (Max 3MB)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>

          {/* COLUMNA DERECHA: RESUMEN */}
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
                      {formatItemPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-white/50 rounded-2xl p-5 border border-slate-200 space-y-3 mb-8 shadow-inner">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Subtotal Base</span>
                  <span className="text-slate-900">${subtotalUSD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Logística Nacional</span>
                  <span className={envioGratis ? 'text-green-600' : 'text-slate-900'}>
                    {courier === 'Retiro en Tienda' ? 'EN TIENDA' : (envioGratis ? 'GRATIS' : 'COBRO DESTINO')}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-300 flex items-end justify-between">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total a Pagar</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600 block leading-none mb-1">
                      {formatDisplayPrice()}
                    </span>
                    {selectedMethod.currency !== 'USD' && (
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest">
                        Ref: ${subtotalUSD.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full liquid-glass-active text-white py-4.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 hover:brightness-110 shadow-lg"
              >
                {isSubmitting ? 'Registrando en Valery...' : 'Procesar Orden Seguro'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest mt-4">
                El comprobante será verificado por administración
              </p>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}