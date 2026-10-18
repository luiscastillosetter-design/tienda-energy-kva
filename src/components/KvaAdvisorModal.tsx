'use client';

import { useState, useEffect } from 'react';
import { 
  Cpu, X, Zap, ArrowRight, CheckCircle2, ShieldCheck, 
  Printer, MessageCircle, RefreshCw, ShoppingCart, 
  FileText, ChevronRight
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useCartStore } from '@/store/cartStore';
import { productService } from '@/services/productService';
import type { Product } from '@/data/products';

const COMMON_APPLIANCES = [
  { name: 'Aire Acond. 12.000 BTU', watts: 1200, category: 'Climatización' },
  { name: 'Aire Acond. 24.000 BTU', watts: 2400, category: 'Climatización' },
  { name: 'Bomba de Agua 1 HP', watts: 750, category: 'Motores' },
  { name: 'Bomba de Agua 2 HP', watts: 1500, category: 'Motores' },
  { name: 'Cava Cuarto / Refrigeración', watts: 2800, category: 'Refrigeración' },
  { name: 'Nevera / Congelador Comercial', watts: 600, category: 'Refrigeración' },
  { name: 'Iluminación (10 Reflectores)', watts: 1000, category: 'Iluminación' },
  { name: 'Servidor / Laptops / Oficina', watts: 800, category: 'Electrónica' },
  { name: 'Máquina de Soldar 200A', watts: 4500, category: 'Herramientas' },
];

export function KvaAdvisorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [remainingQueries, setRemainingQueries] = useState<number | null>(5);
  const [clientCompany, setClientCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [showQuotationView, setShowQuotationView] = useState(false);
  
  const [liveCatalog, setLiveCatalog] = useState<Product[]>([]);

  const { currency, bcvRate, addItem, toggleCart } = useCartStore();

  useEffect(() => {
    productService.getProducts().then(setLiveCatalog);
    if (sessionStorage.getItem('dismiss_advisor') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('dismiss_advisor', 'true');
  };

  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const formatPrice = (usdPrice: number) => {
    if (currency === 'VES' && bcvRate > 0) {
      return `Bs. ${(usdPrice * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${usdPrice.toFixed(2)}`;
  };

  const handleCalculate = async () => {
    if (!userPrompt.trim() && selectedItems.length === 0) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          selectedAppliances: selectedItems,
        }),
      });

      const resData = await res.json();
      
      if (res.ok && resData.success) {
        setResult(resData.data);
        if (typeof resData.remainingQueries === 'number') {
          setRemainingQueries(resData.remainingQueries);
        }
      } else {
        alert(resData.error || 'Ocurrió un error de conexión con la IA.');
        if (res.status === 429) setRemainingQueries(0);
      }
    } catch (e: any) {
      alert('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintQuotation = () => {
    window.print();
  };

  const handleSendQuotationWhatsApp = () => {
    if (!result) return;
    const cleanPhone = String(siteConfig.contact.whatsapp).replace(/\D/g, '');
    const itemsText = (result.b2bItems || [])
      .map((item: any) => {
        const prod = liveCatalog.find((p) => p.id === item.productId);
        return `• ${item.quantity}x *${prod?.title || item.productId}* ($${((prod?.price || 0) * item.quantity).toFixed(2)})`;
      })
      .join('\n');

    const totalUSD = (result.b2bItems || []).reduce((acc: number, item: any) => {
      const prod = liveCatalog.find((p) => p.id === item.productId);
      return acc + (prod?.price || 0) * item.quantity;
    }, 0);

    const text = `*PRESUPUESTO FORMAL B2B - ${siteConfig.storeName}*\n===========================\n👤 *Empresa / Cliente:* ${
      clientCompany || 'Particular'
    }\n📞 *Contacto:* ${clientContact || 'N/A'}\n\n⚡ *DIMENSIONAMIENTO ELÉCTRICO:*\n- Demanda Estimada: ${result.totalWatts?.toLocaleString()} Watts\n- Capacidad Sugerida (+20% Margen): *${result.marginKva?.toFixed(
      1
    )} KVA*\n\n📦 *EQUIPOS RECOMENDADOS:*\n${itemsText}\n\n💰 *TOTAL ESTIMADO:* $${totalUSD.toFixed(2)} USD${
      bcvRate > 0 ? `\n🔄 (Equivalente en Bs: ${(totalUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs)` : ''
    }\n\nSolicito emisión de factura proforma y verificación de stock para despacho.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isDismissed) return null;

  return (
    <>
      <div className="fixed bottom-[90px] md:bottom-8 right-4 sm:right-6 z-[100] group">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 md:w-auto md:px-5 md:py-3.5 rounded-full liquid-glass-active text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          aria-label="Abrir Asesor de Energía con IA"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-full h-full rounded-full bg-cyan-300 animate-ping opacity-75" />
            <Cpu className="w-5 h-5 md:w-4 md:h-4 text-cyan-100 group-hover:rotate-12 transition-transform relative z-10" />
          </div>
          <span className="hidden md:inline drop-shadow-sm font-black relative z-10">Dimensionar Carga (AI)</span>
        </button>

        {/* La X ahora es visible en móvil SIEMPRE y oculta en PC hasta hacer hover */}
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-50"
          aria-label="Cerrar botón IA"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-[#03060D]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#060A14] border border-white/10 text-slate-100 shadow-[0_25px_60px_-15px_rgba(0,180,255,0.25)] overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#03050A] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl liquid-glass-active text-white border border-white/10">
                  <Cpu className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      KVA Energy Advisor <span className="text-cyan-400 font-bold">(AI Powered)</span>
                    </h2>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">
                    Análisis matemático industrial con +20% de reserva térmica
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {remainingQueries !== null && (
                  <span className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider liquid-glass-dark text-cyan-300 border border-cyan-500/20">
                    Consultas Hoy: {remainingQueries}/5
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl liquid-glass-dark text-slate-300 hover:text-white cursor-pointer border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 scrollbar-hide bg-[#060A14]">
              {!result ? (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-3">
                      1. Selecciona equipos de tu instalación:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {COMMON_APPLIANCES.map((app) => {
                        const isSelected = selectedItems.includes(app.name);
                        return (
                          <button
                            key={app.name}
                            type="button"
                            onClick={() => toggleItem(app.name)}
                            className={`flex items-center justify-between p-3.5 rounded-xl text-left text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'liquid-glass-active text-white border-cyan-400/50'
                                : 'bg-[#0A101D] border-white/5 text-slate-300 hover:border-cyan-400/30'
                            }`}
                          >
                            <span className="truncate pr-2">{app.name}</span>
                            <span className="text-[10px] opacity-75 flex-shrink-0 bg-black/20 px-2 py-0.5 rounded">
                              {app.watts}W
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-2">
                      2. O describe tu proyecto con tus propias palabras:
                    </label>
                    <textarea
                      rows={3}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Ejemplo: Necesito electrificar una granja con 2 bombas de 2HP, 3 aires de 18.000 BTU y 15 reflectores..."
                      className="w-full p-4 rounded-xl bg-[#0A101D] border border-white/10 text-white text-xs sm:text-sm font-medium outline-none resize-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#051024] border border-blue-500/20 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-medium">
                      El motor aplica el factor de potencia industrial ($FP = 0.85$) y suma una{' '}
                      <strong className="text-cyan-300 font-bold">reserva del 20%</strong> sobre los KVA totales para
                      garantizar que los transformadores o plantas sugeridas nunca operen en fatiga térmica.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#0A101D] border border-white/5 flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Demanda Nominal Total</span>
                      <span className="text-2xl font-black text-white mt-1">{result.totalWatts?.toLocaleString()} W</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0A101D] border border-white/5 flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Cálculo Base</span>
                      <span className="text-2xl font-black text-blue-400 mt-1">{result.calculatedKva?.toFixed(1)} KVA</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#031526] border border-cyan-500/30 flex flex-col shadow-[0_0_15px_rgba(0,229,255,0.05)]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">Sugerencia Comercial (+20%)</span>
                      <span className="text-3xl font-black text-cyan-300 mt-0.5">{result.marginKva?.toFixed(1)} KVA</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl liquid-glass-dark border border-white/10">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Dictamen de Ingeniería
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                      {result.explanation}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-3">
                      Equipos Disponibles en Stock:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(result.b2bItems || []).map((item: any) => {
                        const prod = liveCatalog.find((p) => p.id === item.productId);
                        if (!prod) return null;
                        return (
                          <div key={prod.id} className="p-4 rounded-xl bg-[#0A101D] border border-white/10 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{prod.category}</span>
                                <span className="text-xs font-black text-white">{formatPrice(prod.price)}</span>
                              </div>
                              <h4 className="text-sm font-bold text-white mb-2">{prod.title}</h4>
                              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-4">{item.reason}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                addItem({ id: prod.id, title: prod.title, price: prod.price, image: prod.images[0] || '' }, item.quantity || 1);
                                toggleCart();
                                setIsOpen(false);
                              }}
                              className="w-full py-2.5 rounded-lg liquid-glass-active text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Añadir Orden
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowQuotationView(!showQuotationView)}
                      className="w-full p-4 rounded-xl bg-[#061228] border border-blue-500/30 text-blue-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div className="text-left">
                          <h4 className="text-[11px] font-black uppercase tracking-wider">Generar Presupuesto B2B (PDF / WhatsApp)</h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Membrete corporativo y cálculos en USD y Bs</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${showQuotationView ? 'rotate-90' : ''}`} />
                    </button>

                    {showQuotationView && (
                      <div className="mt-3 p-5 rounded-xl bg-[#0A101D] border border-white/5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Empresa / Cliente</label>
                            <input
                              type="text"
                              value={clientCompany}
                              onChange={(e) => setClientCompany(e.target.value)}
                              placeholder="Ej. Constructora GNK"
                              className="w-full h-11 px-3.5 rounded-lg bg-[#04070E] border border-white/10 text-white text-xs outline-none focus:border-cyan-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">WhatsApp Contacto</label>
                            <input
                              type="text"
                              value={clientContact}
                              onChange={(e) => setClientContact(e.target.value)}
                              placeholder="+58 414 0000000"
                              className="w-full h-11 px-3.5 rounded-lg bg-[#04070E] border border-white/10 text-white text-xs outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleSendQuotationWhatsApp}
                            className="flex-1 py-3.5 rounded-lg bg-[#00A859] hover:bg-[#00904C] text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" /> Enviar a WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={handlePrintQuotation}
                            className="px-6 py-3.5 rounded-lg liquid-glass-dark border border-white/10 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-cyan-400" /> Imprimir / PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-[#03050A] flex items-center justify-between flex-shrink-0">
              {result ? (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setShowQuotationView(false);
                  }}
                  className="px-5 py-2.5 rounded-lg liquid-glass-dark border border-white/10 text-slate-300 hover:text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Nuevo Proyecto
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Cálculo inmediato según normativa Corpoelec
                </span>
              )}

              {!result && (
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isLoading || (!userPrompt.trim() && selectedItems.length === 0) || remainingQueries === 0}
                  className="px-6 sm:px-8 py-3.5 rounded-full liquid-glass-active text-white text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg hover:brightness-110 border border-white/20 ml-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : remainingQueries === 0 ? (
                    <span>Límite Alcanzado</span>
                  ) : (
                    <>
                      <span>Calcular KVA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}