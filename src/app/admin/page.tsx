'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, X, Lock, ArrowLeft, CheckCircle, 
  Image as ImageIcon, Settings, ShoppingBag, Layers, Sliders, 
  Zap, Search, Cpu, Phone, RotateCcw, ShieldCheck, ClipboardList, Eye, FileText, CheckCircle2, Clock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { adminWrite, setAdminKey, clearAdminKey, getAdminKey, verifyAdminKey } from '@/lib/adminDb';
import { siteConfig } from '@/config/site';
import { FALLBACK_INDUSTRIAL_SVG } from '@/data/products';
import { productService, formatProduct } from '@/services/productService';
import { normalizeCategoryKey, slugifyCategory } from '@/lib/categoryUtils';
import KiraPanel from '@/components/KiraPanel';
import { DEFAULT_CONTACT, rowToContact, broadcastContact, type ContactSettings } from '@/lib/contactSettings';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<
    'orders' | 'products' | 'ofertas' | 'categories' | 'branding' | 'contact' | 'advisor'
  >('orders');
  const [successMsg, setSuccessMsg] = useState('');

  const [storeName, setStoreName] = useState(siteConfig.storeName);
  const [logoWhite, setLogoWhite] = useState(siteConfig.branding.logoWhite);
  const [logoDark, setLogoDark] = useState(siteConfig.branding.logoDark);

  const staticCategories = siteConfig.categories.filter((c) => c.id !== 'Todos');

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [filterNoPhoto, setFilterNoPhoto] = useState(false);
  const [editingProductId, setEditingProductId] = useState<any>(null);
  
  const [productForm, setProductForm] = useState({
    id: '',
    valeryCode: '',
    title: '',
    price: '',
    stock: '100',
    category: staticCategories[0]?.id || 'TRANSFORMADORES',
    description: '',
    features: '',
    images: ['', '', '', ''],
  });

  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [editingHeroId, setEditingHeroId] = useState<any>(null);
  const [heroForm, setHeroForm] = useState({ title: '', btnLink: '/catalogo', desktopImg: '', mobileImg: '' });

  // ---- OFERTAS (por equipo del inventario) ----
  const [offers, setOffers] = useState<any[]>([]);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerProduct, setOfferProduct] = useState<any>(null);
  const [offerMode, setOfferMode] = useState<'price' | 'percent'>('price');
  const [offerValue, setOfferValue] = useState('');
  const [offerLabel, setOfferLabel] = useState('OFERTA RELÁMPAGO');
  const [offerActive, setOfferActive] = useState(true);
  const [editingOfferPrice, setEditingOfferPrice] = useState<{ id: number; value: string } | null>(null);

  // ---- DEPARTAMENTOS ----
  const [categories, setCategories] = useState<any[]>(siteConfig.categories);
  const availableCategories = categories.filter((c: any) => c.id !== 'Todos');
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const [contactForm, setContactForm] = useState<ContactSettings>(DEFAULT_CONTACT);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean: ContactSettings = {
      phoneDisplay: contactForm.phoneDisplay.trim(),
      whatsapp: contactForm.whatsapp.replace(/\D/g, ''),
      email: contactForm.email.trim(),
      address: contactForm.address.trim(),
    };
    if (!clean.phoneDisplay || !clean.whatsapp || !clean.email || !clean.address) {
      showNotification('Completa todos los campos de contacto.');
      return;
    }
    const { error } = await adminWrite('contact_settings', 'upsert', { values: {
      id: 1,
      phone_display: clean.phoneDisplay,
      whatsapp: clean.whatsapp,
      email: clean.email,
      address: clean.address,
      updated_at: new Date().toISOString(),
    }, onConflict: 'id' });
    if (error) {
      showNotification('Error guardando contacto (¿existe la tabla contact_settings?).');
      return;
    }
    setContactForm(clean);
    broadcastContact(clean);
    showNotification('¡Datos de contacto actualizados en toda la web!');
  };

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const handleMarkValerySynced = async (order: any) => {
    let { error } = await adminWrite('orders', 'update', { values: {
      status: 'SINCRONIZADO_VALERY',
      valery_synced_at: new Date().toISOString(),
    }, match: { id: order.id } });
    if (error) {
      const fb = await adminWrite('orders', 'update', { values: { status: 'SINCRONIZADO_VALERY' }, match: { id: order.id } });
      error = fb.error;
    }
    if (error) { showNotification('Error marcando la orden como sincronizada.'); return; }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'SINCRONIZADO_VALERY' } : o)));
    showNotification('Orden marcada como sincronizada en Valery.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyAdminKey(password)) {
      setAdminKey(password);
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth_kva_v2', 'true');
      loadAllData();
    } else {
      showNotification('Credenciales inválidas. Acceso denegado.');
    }
  };

  const loadAllData = async () => {
    // 1. Cargar Órdenes
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ordersData) setOrders(ordersData);

    // 2. Cargar Productos
    const mergedProducts = await productService.getProducts();
    setProducts(mergedProducts);

    // 3. Cargar Ofertas
    const { data: offersData } = await supabase.from('product_offers').select('*').order('id', { ascending: false });
    if (offersData) setOffers(offersData);

    // 4. Cargar Hero Banners
    const { data: heroData } = await supabase.from('hero_slides').select('*').order('id', { ascending: true });
    if (heroData) setHeroSlides(heroData);

    // 5. Cargar Categorías
    let { data: catsData } = await supabase.from('categories').select('*').order('name', { ascending: true });
    const known = new Set((catsData || []).map((c: any) => c.id));
    const missing = siteConfig.categories.filter((c) => c.id !== 'Todos' && !known.has(c.id));
    if (missing.length > 0) {
      // Migración automática de los departamentos base para no perder ninguno
      await adminWrite('categories', 'upsert', {
        values: missing.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, slug: c.slug, iconName: c.iconName, image: c.image })),
        onConflict: 'id',
      });
      const re = await supabase.from('categories').select('*').order('name', { ascending: true });
      catsData = re.data;
    }
    if (catsData) setCategories([{ id: 'Todos', name: 'Catálogo Completo', shortName: 'Todos', slug: 'todos', iconName: 'LayoutGrid', image: '' }, ...catsData.filter((c: any) => c.id !== 'Todos')]);

    // 7. Cargar Contacto
    const { data: contactData } = await supabase.from('contact_settings').select('*').eq('id', 1).maybeSingle();
    if (contactData) setContactForm(rowToContact(contactData));

    // 6. Cargar Branding
    const { data: brandData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (brandData) {
      setStoreName(brandData.store_name);
      setLogoWhite(brandData.logo_white);
      setLogoDark(brandData.logo_dark);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth_kva_v2') === 'true' && getAdminKey()) {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  const filteredInventory = useMemo(() => {
    let filtered = products;
    
    if (filterNoPhoto) {
      filtered = filtered.filter(p => !p.images || p.images.length === 0 || p.images[0] === FALLBACK_INDUSTRIAL_SVG || p.images[0].includes('data:image/svg+xml'));
    }

    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      filtered = filtered.filter(p => 
        String(p.title || '').toLowerCase().includes(q) || 
        String(p.id || '').toLowerCase().includes(q) ||
        String(p.valeryCode || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [products, adminSearch, filterNoPhoto]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) return;
    const parsedFeatures = productForm.features.split('\n').map((f) => f.trim()).filter(Boolean);
    const cleanImages = productForm.images.filter((img) => img.trim() !== '');
    const numericPrice = Number(productForm.price) || 0;
    const numericStock = Number(productForm.stock ?? 0);

    const updatedProduct = {
      id: productForm.id || `WEB-${Date.now()}`,
      valery_code: productForm.valeryCode || productForm.id || `WEB-${Date.now()}`,
      title: productForm.title,
      price: numericPrice,
      stock: numericStock,
      category: productForm.category,
      description: productForm.description,
      features: parsedFeatures,
      images: cleanImages,
      category_manual: true, // Valery ya no pisa el departamento elegido a mano
      updated_at: new Date().toISOString()
    };

    let { data, error } = await adminWrite('products', 'upsert', { values: updatedProduct, onConflict: 'id', returning: true, single: true });
    if (error) {
      // Compatibilidad si aún no existe la columna category_manual
      const { category_manual, ...legacy } = updatedProduct;
      ({ data, error } = await adminWrite('products', 'upsert', { values: legacy, onConflict: 'id', returning: true, single: true }));
    }
    
    if (error) {
      showNotification('Error actualizando el equipo.');
    } else {
      showNotification('¡Equipo actualizado exitosamente!');
      setProducts(products.map(p => p.id === updatedProduct.id ? formatProduct(data) : p));
      if (!editingProductId) setProducts([formatProduct(data), ...products]);
      
      setEditingProductId(null);
      setProductForm({ id: '', valeryCode: '', title: '', price: '', stock: '100', category: availableCategories[0]?.id || 'TRANSFORMADORES', description: '', features: '', images: ['', '', '', ''] });
    }
  };

  const startEditProduct = (product: any) => {
    setEditingProductId(product.id);
    const existingImgs = Array.isArray(product.images) ? [...product.images] : [];
    while (existingImgs.length < 4) existingImgs.push('');
    setProductForm({
      id: product.id,
      valeryCode: product.valeryCode || product.id,
      title: product.title || '',
      price: product.price?.toString() || '',
      stock: (product.stock ?? 0).toString(),
      category: product.category || availableCategories[0]?.id,
      description: product.description || '',
      features: Array.isArray(product.features) ? product.features.join('\n') : product.features || '',
      images: existingImgs.map(img => img === FALLBACK_INDUSTRIAL_SVG ? '' : img).slice(0, 4),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: any) => {
    if (confirm('¿Eliminar este equipo de la web? (Si Valery lo vuelve a enviar, aparecerá de nuevo)')) {
      setProducts(products.filter((p) => p.id !== id));
      showNotification('Equipo eliminado de la web.');
      await adminWrite('products', 'delete', { match: { id } });
    }
  };

  // ================= OFERTAS =================
  const offerCandidates = useMemo(() => {
    const q = offerSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => String(p.title || '').toLowerCase().includes(q) || String(p.valeryCode || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, offerSearch]);

  const computePromo = () => {
    if (!offerProduct) return NaN;
    const v = Number(offerValue);
    if (!(v > 0)) return NaN;
    if (offerMode === 'percent') return v < 100 ? Math.round(offerProduct.price * (1 - v / 100) * 100) / 100 : NaN;
    return v;
  };

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerProduct) { showNotification('Selecciona un equipo del inventario.'); return; }
    const promo = computePromo();
    if (isNaN(promo) || promo <= 0) { showNotification('Define un precio o porcentaje válido.'); return; }
    if (promo >= offerProduct.price) { showNotification('El precio promocional debe ser menor al precio actual.'); return; }
    const percent = Math.round((1 - promo / offerProduct.price) * 10000) / 100;
    const { data, error } = await adminWrite('product_offers', 'insert', { values: {
      product_id: offerProduct.id,
      promo_price: promo,
      discount_percent: percent,
      label: offerLabel.trim() || 'OFERTA',
      active: offerActive,
    }, returning: true, single: true });
    if (error) { showNotification('Error publicando oferta (¿ejecutaste supabase/offers_categories.sql?).'); return; }
    setOffers([data, ...offers]);
    setOfferProduct(null); setOfferSearch(''); setOfferValue('');
    showNotification('¡Oferta publicada en la tienda!');
  };

  const handleToggleOffer = async (offer: any) => {
    const { error } = await adminWrite('product_offers', 'update', { values: { active: !offer.active }, match: { id: offer.id } });
    if (error) { showNotification('Error actualizando oferta.'); return; }
    setOffers(offers.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o)));
  };

  const handleSaveOfferPrice = async (offer: any) => {
    if (!editingOfferPrice) return;
    const prod = products.find((p) => String(p.id) === String(offer.product_id));
    const promo = Number(editingOfferPrice.value);
    if (!(promo > 0) || (prod && promo >= prod.price)) { showNotification('Precio promocional inválido (debe ser menor al precio actual).'); return; }
    const percent = prod ? Math.round((1 - promo / prod.price) * 10000) / 100 : offer.discount_percent;
    const { error } = await adminWrite('product_offers', 'update', { values: { promo_price: promo, discount_percent: percent }, match: { id: offer.id } });
    if (error) { showNotification('Error guardando precio.'); return; }
    setOffers(offers.map((o) => (o.id === offer.id ? { ...o, promo_price: promo, discount_percent: percent } : o)));
    setEditingOfferPrice(null);
    showNotification('Precio promocional actualizado.');
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    const { error } = await adminWrite('product_offers', 'delete', { match: { id } });
    if (error) { showNotification('Error eliminando oferta.'); return; }
    setOffers(offers.filter((o) => o.id !== id));
    showNotification('Oferta eliminada.');
  };

  // ================= DEPARTAMENTOS =================
  const shortOf = (name: string) => (name.length > 18 ? name.slice(0, 18) : name);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryForm.name.trim();
    const id = normalizeCategoryKey(name);
    if (!id) { showNotification('Escribe un nombre para el departamento.'); return; }
    if (categories.some((c: any) => normalizeCategoryKey(c.id) === id || normalizeCategoryKey(c.name) === id)) { showNotification('Ese departamento ya existe.'); return; }
    const row = { id, name, shortName: shortOf(name), slug: slugifyCategory(name), iconName: 'Zap', image: '' };
    const { error } = await adminWrite('categories', 'insert', { values: row });
    if (error) { showNotification('Error creando departamento.'); return; }
    setCategories([...categories, row]);
    setCategoryForm({ name: '' });
    showNotification('Departamento creado y visible en la tienda.');
  };

  const handleRenameCategory = async () => {
    if (!editingCategory) return;
    const name = editingCategory.name.trim();
    if (!name) return;
    const cat = categories.find((c: any) => c.id === editingCategory.id);
    // El id se mantiene (los productos lo referencian); cambia el nombre visible en toda la tienda
    const patch = { name, shortName: shortOf(name), slug: slugifyCategory(name) };
    const { error } = await adminWrite('categories', 'update', { values: patch, match: { id: editingCategory.id } });
    if (error) { showNotification('Error renombrando departamento.'); return; }
    // Productos guardados con el nombre antiguo (texto) se re-vinculan al departamento
    if (cat?.name && cat.name !== editingCategory.id) {
      await adminWrite('products', 'update', { values: { category: editingCategory.id }, match: { category: cat.name } });
    }
    setCategories(categories.map((c: any) => (c.id === editingCategory.id ? { ...c, ...patch } : c)));
    setEditingCategory(null);
    showNotification('Departamento renombrado en toda la tienda.');
  };

  const handleDeleteCategory = async (cat: any) => {
    const count = products.filter((p) => String(p.category).toUpperCase() === String(cat.id).toUpperCase()).length;
    if (count > 0) { showNotification(`No se puede eliminar: tiene ${count} equipo(s) asignado(s).`); return; }
    if (!confirm(`¿Eliminar el departamento "${cat.name}"?`)) return;
    const { error } = await adminWrite('categories', 'delete', { match: { id: cat.id } });
    if (error) { showNotification('Error eliminando departamento.'); return; }
    setCategories(categories.filter((c: any) => c.id !== cat.id));
    showNotification('Departamento eliminado.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-robot-skin flex items-center justify-center px-4 relative">
        <div className="bg-[#0A0E17]/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 w-full max-w-md relative z-10 border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-[0_0_20px_rgba(0,56,255,0.3)]">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-center text-white mb-2 uppercase tracking-tight">Terminal Admin <span className="text-blue-500">KVA</span></h1>
          <form onSubmit={handleLogin} className="space-y-5 mt-8">
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 px-5 text-center tracking-widest liquid-glass-input text-white rounded-full focus:outline-none focus:border-blue-500 font-bold" />
            <button type="submit" className="w-full liquid-glass-active text-white font-black py-4 rounded-full uppercase tracking-widest text-xs cursor-pointer hover:brightness-110">Autorizar Acceso</button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-blue-400 flex items-center justify-center gap-1.5 font-bold transition-colors">
              <ArrowLeft size={14} /> Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-robot-skin text-slate-200 pb-24 w-full">
      <header className="bg-[#0A0E17]/95 backdrop-blur-xl border-b border-white/10 py-4 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={logoWhite || siteConfig.branding.logoWhite} alt="KVA" className="h-8 w-auto object-contain" />
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
          <h1 className="text-sm md:text-base font-black text-white uppercase tracking-wider">Consola Operativa</h1>
          <span className="hidden md:inline-block bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">En Vivo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="px-5 py-2.5 rounded-full liquid-glass-input text-xs font-black text-blue-400 hover:text-white transition-colors border border-blue-500/20">Ver Tienda</Link>
          <button onClick={() => { localStorage.removeItem('admin_auth_kva_v2'); clearAdminKey(); setIsAuthenticated(false); }} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">Desconectar</button>
        </div>
      </header>

      <div className="bg-[#0A0E17]/80 border-b border-white/5">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex gap-3 overflow-x-auto py-4 scrollbar-hide">
          {[
            { id: 'orders', icon: ClipboardList, label: `Órdenes (${orders.length})` },
            { id: 'products', icon: ShoppingBag, label: `Inventario Valery (${products.length})` },
            { id: 'ofertas', icon: Zap, label: `Ofertas (${offers.length})` },
            { id: 'categories', icon: Layers, label: `Departamentos (${categories.length})` },
            { id: 'branding', icon: Settings, label: `Marca` },
            { id: 'contact', icon: Phone, label: `Contacto y WhatsApp` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${isActive ? 'liquid-glass-active text-white' : 'liquid-glass-dark text-slate-400 hover:text-white border-transparent'}`}>
                <Icon size={14} className={isActive ? 'text-white' : 'text-blue-500'} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 py-8 chasis-bisel">
        {successMsg && (
          <div className="mb-6 bg-[#0A0E17]/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative z-20">
            <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
            <span className="font-black text-xs uppercase tracking-wider">{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA DE ÓRDENES (NUEVA) */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div className="relative z-20 space-y-6">
            
            <div className="p-5 bg-blue-900/10 border border-blue-500/30 rounded-2xl flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Pasarela Híbrida Activa</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Todas las compras realizadas en la web aparecerán aquí con sus respectivos comprobantes de pago. El equipo de administración debe verificar los pagos en bancos/Zelle/Binance y facturar el pedido definitivo en el sistema Valery para su posterior despacho.</p>
              </div>
            </div>

            <div className="bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                <ClipboardList className="w-5 h-5 text-blue-500" /> Registro de Pedidos Web
              </h2>
              
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay órdenes registradas aún.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-blue-500/30 transition-colors">
                      
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
                            {order.display_id}
                          </span>
                          {order.status === 'SINCRONIZADO_VALERY' ? (
                            <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
                              Sincronizada en Valery{order.valery_doc_number ? ` · Doc ${order.valery_doc_number}` : ''}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
                              Pendiente Valery
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleString('es-VE')}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-white text-sm">{order.client_name} <span className="text-slate-400 font-normal">({order.client_dni})</span></h4>
                          <p className="text-xs text-cyan-400 font-bold mt-0.5">Telf: {order.client_phone}</p>
                        </div>
                        
                        <div className="text-xs text-slate-300 font-medium">
                          <span className="text-slate-500">Pago:</span> {order.payment_method} 
                          {order.payment_reference && <span className="ml-2 text-yellow-400">Ref: {order.payment_reference}</span>}
                        </div>
                      </div>

                      <div className="flex-1 max-h-24 overflow-y-auto scrollbar-hide bg-[#04070E] rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] font-black uppercase text-slate-500 mb-2">Equipos Solicitados:</p>
                        <ul className="space-y-1.5">
                          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <li key={idx} className="text-xs text-slate-200 flex justify-between">
                              <span className="truncate pr-4">{item.quantity}x {item.title}</span>
                              <span className="font-bold text-slate-400 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col items-end gap-3 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Total USD</p>
                          <p className="text-2xl font-black text-blue-400">${Number(order.total_usd).toFixed(2)}</p>
                          {order.total_ves && (
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Bs. {Number(order.total_ves).toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                          )}
                        </div>
                        
                        {order.receipt_url ? (
                          <button 
                            onClick={() => setSelectedReceipt(order.receipt_url)}
                            className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Comprobante
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-500 font-bold px-3 py-1 bg-amber-500/10 rounded-md">Sin Comprobante Web</span>
                        )}
                        {order.status !== 'SINCRONIZADO_VALERY' && (
                          <button
                            onClick={() => handleMarkValerySynced(order)}
                            className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Sincronizada en Valery
                          </button>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Modal Comprobante */}
            {selectedReceipt && (
              <div className="fixed inset-0 z-[300] bg-[#0A0E17]/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="relative max-w-2xl w-full bg-[#05070E] p-2 rounded-2xl border border-white/20 shadow-2xl">
                  <button onClick={() => setSelectedReceipt(null)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform">
                    <X className="w-5 h-5" />
                  </button>
                  <img src={selectedReceipt} alt="Comprobante de Pago" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA INVENTARIO Y CONEXIÓN VALERY */}
        {/* ============================================================== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20">
            <div className="lg:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl sticky top-24">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Pencil size={16} className="text-amber-400" />
                  {editingProductId ? 'Modificar Equipo' : 'Agregar Manualmente'}
                </h2>
                {editingProductId && (
                  <button onClick={() => {
                    setEditingProductId(null);
                    setProductForm({ id: '', valeryCode: '', title: '', price: '', stock: '100', category: availableCategories[0]?.id || 'TRANSFORMADORES', description: '', features: '', images: ['', '', '', ''] });
                  }} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer uppercase">
                    <X size={12} /> Cancelar
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Código Valery (SKU)</label>
                    <input type="text" value={productForm.valeryCode} onChange={(e) => setProductForm({ ...productForm, valeryCode: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-amber-400 font-mono font-bold rounded-xl text-xs focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Precio (USD)</label>
                    <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-blue-400 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-black" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Nombre Comercial</label>
                  <input type="text" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Departamento Web</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500 cursor-pointer appearance-none">
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#0A0E17]">{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Subir Fotos / MP4 Web</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((index) => {
                      const media = productForm.images[index];
                      return (
                        <div key={index} className="liquid-glass-input border-dashed border-white/20 p-1 rounded-lg text-center relative h-16 flex items-center justify-center cursor-pointer hover:border-blue-500">
                          {media ? (
                            <div className="relative w-full h-full bg-white/10 rounded-md overflow-hidden flex items-center justify-center">
                              {media.includes('.mp4') ? <video src={media} className="h-full w-full object-cover" /> : <img src={media} className="h-full w-full object-cover" />}
                              <button type="button" onClick={() => { const u = [...productForm.images]; u[index] = ''; setProductForm({ ...productForm, images: u }); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] z-10 shadow-md">✕</button>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <ImageIcon size={12} className="text-slate-400" />
                              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={(e) => handleMediaUpload(e, (url) => { const u = [...productForm.images]; u[index] = url; setProductForm({ ...productForm, images: u }); })} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2">La foto protege su URL aunque Valery cambie el precio.</p>
                </div>
                <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-[10px] font-black uppercase shadow-lg cursor-pointer">
                  Guardar Datos de Venta Web
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Catálogo ({filteredInventory.length})</h2>
                  <button 
                    onClick={() => setFilterNoPhoto(!filterNoPhoto)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border ${filterNoPhoto ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'liquid-glass-input text-slate-400 border-white/10'}`}
                  >
                    Filtro: Sin Foto
                  </button>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="search" placeholder="Buscar por Código Valery o nombre..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="w-full h-11 pl-11 pr-4 liquid-glass-input rounded-full text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
                {filteredInventory.map((product) => {
                  const firstMedia = Array.isArray(product.images) && product.images[0] ? product.images[0] : FALLBACK_INDUSTRIAL_SVG;
                  const isFallback = firstMedia === FALLBACK_INDUSTRIAL_SVG || firstMedia.includes('data:image/svg+xml');
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/40 transition-colors gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0 overflow-hidden ${isFallback ? 'border-amber-500/50 bg-amber-900/20' : 'border-white/10 bg-white/90'}`}>
                          <img src={firstMedia} alt={product.title} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-slate-100 text-sm truncate mb-1">{product.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                            <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">Valery: {product.valeryCode || product.id}</span>
                            <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">${Number(product.price || 0).toFixed(2)} | Stock: {product.stock}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditProduct(product)} className="p-3 text-blue-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-3 text-red-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑAS EXISTENTES: OFERTAS, DEPARTAMENTOS Y MARCA */}
        {/* ============================================================== */}
        {activeTab === 'ofertas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20">
            <form onSubmit={handlePublishOffer} className="lg:col-span-5 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider pb-4 border-b border-white/10 flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Nueva Oferta</h2>
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Equipo (nombre o código Valery)</label>
                {offerProduct ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-blue-500/30 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{offerProduct.title}</p>
                      <p className="text-[10px] text-amber-400 font-mono font-bold">{offerProduct.valeryCode || offerProduct.id} · ${Number(offerProduct.price).toFixed(2)}</p>
                    </div>
                    <button type="button" onClick={() => setOfferProduct(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-blue-500 absolute left-4 top-3.5" />
                    <input type="search" value={offerSearch} onChange={(e) => setOfferSearch(e.target.value)} placeholder="Buscar equipo..." className="w-full h-11 pl-11 pr-4 liquid-glass-input rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                    {offerCandidates.length > 0 && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#04070E] divide-y divide-white/5">
                        {offerCandidates.map((p) => (
                          <button type="button" key={p.id} onClick={() => setOfferProduct(p)} className="w-full text-left px-4 py-2.5 hover:bg-white/5 cursor-pointer">
                            <p className="text-xs text-white font-bold truncate">{p.title}</p>
                            <p className="text-[10px] text-amber-400 font-mono">{p.valeryCode || p.id} · ${Number(p.price).toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Tipo</label>
                  <select value={offerMode} onChange={(e) => setOfferMode(e.target.value as 'price' | 'percent')} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none cursor-pointer appearance-none">
                    <option value="price" className="bg-[#0A0E17]">Precio promo (USD)</option>
                    <option value="percent" className="bg-[#0A0E17]">% de descuento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">{offerMode === 'price' ? 'Precio USD' : 'Descuento %'}</label>
                  <input type="number" step="0.01" value={offerValue} onChange={(e) => setOfferValue(e.target.value)} className="w-full h-11 px-4 liquid-glass-input text-blue-400 rounded-xl text-sm focus:outline-none font-black" required />
                </div>
              </div>
              {offerProduct && !isNaN(computePromo()) && (
                <p className="text-[11px] text-emerald-400 font-bold">Precio final: ${computePromo().toFixed(2)} (antes ${Number(offerProduct.price).toFixed(2)})</p>
              )}
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Etiqueta de oferta</label>
                <input type="text" list="offer-labels" value={offerLabel} onChange={(e) => setOfferLabel(e.target.value)} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none" />
                <datalist id="offer-labels"><option value="OFERTA RELÁMPAGO" /><option value="LOTE ESPECIAL" /><option value="LIQUIDACIÓN" /></datalist>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer">
                <input type="checkbox" checked={offerActive} onChange={(e) => setOfferActive(e.target.checked)} /> Activa (visible en la tienda)
              </label>
              <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-[10px] font-black uppercase shadow-lg cursor-pointer flex items-center justify-center gap-2"><Plus size={14} /> Agregar / Publicar Oferta</button>
            </form>

            <div className="lg:col-span-7 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider pb-4 mb-4 border-b border-white/10">Ofertas creadas ({offers.length})</h2>
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
                {offers.length === 0 && <p className="text-xs text-slate-500 font-bold uppercase text-center py-8">Aún no hay ofertas.</p>}
                {offers.map((offer) => {
                  const prod = products.find((p) => String(p.id) === String(offer.product_id));
                  const editing = editingOfferPrice?.id === offer.id;
                  return (
                    <div key={offer.id} className={`p-4 bg-white/5 border rounded-2xl flex flex-wrap items-center justify-between gap-3 ${offer.active ? 'border-emerald-500/30' : 'border-white/10 opacity-70'}`}>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">{offer.label}</span>
                        <p className="text-sm font-bold text-white truncate mt-1.5">{prod?.title || `Equipo ${offer.product_id} (no encontrado)`}</p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          <span className="text-amber-400 font-mono">{prod?.valeryCode || offer.product_id}</span>
                          {prod && <> · Normal ${Number(prod.price).toFixed(2)}</>}
                          {' · '}<span className="text-blue-400">Promo ${Number(offer.promo_price).toFixed(2)}</span>
                          {offer.discount_percent ? ` (-${Number(offer.discount_percent).toFixed(0)}%)` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {editing ? (
                          <>
                            <input type="number" step="0.01" value={editingOfferPrice!.value} onChange={(e) => setEditingOfferPrice({ id: offer.id, value: e.target.value })} className="w-24 h-10 px-3 liquid-glass-input text-blue-400 rounded-xl text-xs font-black focus:outline-none" />
                            <button type="button" onClick={() => handleSaveOfferPrice(offer)} className="px-3 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase cursor-pointer">Guardar</button>
                            <button type="button" onClick={() => setEditingOfferPrice(null)} className="p-2.5 text-slate-400 hover:text-white cursor-pointer"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleToggleOffer(offer)} className={`px-3 h-10 rounded-xl text-[10px] font-black uppercase cursor-pointer border ${offer.active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'liquid-glass-input border-white/10 text-slate-400'}`}>{offer.active ? 'Activa' : 'Inactiva'}</button>
                            <button type="button" onClick={() => setEditingOfferPrice({ id: offer.id, value: String(offer.promo_price) })} className="p-3 text-blue-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer"><Pencil size={14} /></button>
                            <button type="button" onClick={() => handleDeleteOffer(offer.id)} className="p-3 text-red-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20">
            <form onSubmit={handleAddCategory} className="lg:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase pb-4 border-b border-white/10">Nuevo Departamento</h2>
              <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} placeholder="Ej: Medidores y Contadores" className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500" required />
              <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-[10px] font-black uppercase cursor-pointer flex items-center justify-center gap-2"><Plus size={14} /> Crear Departamento</button>
              <p className="text-[10px] text-slate-500">Los departamentos nuevos aparecen en el desplegable de equipos, la portada y el catálogo. Valery también los crea automáticamente al sincronizar.</p>
            </form>
            <div className="lg:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase pb-4 mb-4 border-b border-white/10">Departamentos ({availableCategories.length})</h2>
              <div className="space-y-3">
                {availableCategories.map((cat: any) => {
                  const count = products.filter((p) => String(p.category).toUpperCase() === String(cat.id).toUpperCase()).length;
                  const editing = editingCategory?.id === cat.id;
                  return (
                    <div key={cat.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {editing ? (
                          <input type="text" value={editingCategory!.name} onChange={(e) => setEditingCategory({ id: cat.id, name: e.target.value })} className="w-full h-10 px-3 liquid-glass-input text-white rounded-xl text-xs font-bold focus:outline-none" autoFocus />
                        ) : (
                          <>
                            <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">ID: <span className="text-amber-400 font-mono">{cat.id}</span> · {count} equipo(s)</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editing ? (
                          <>
                            <button type="button" onClick={handleRenameCategory} className="px-3 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase cursor-pointer">Guardar</button>
                            <button type="button" onClick={() => setEditingCategory(null)} className="p-2.5 text-slate-400 hover:text-white cursor-pointer"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => setEditingCategory({ id: cat.id, name: cat.name })} className="p-3 text-blue-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer"><Pencil size={14} /></button>
                            <button type="button" onClick={() => handleDeleteCategory(cat)} disabled={count > 0} title={count > 0 ? 'Tiene equipos asignados' : 'Eliminar'} className="p-3 text-red-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'contact' && (
          <form onSubmit={handleSaveContact} className="bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-2xl relative z-20 shadow-xl space-y-5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider pb-4 border-b border-white/10">Datos de Contacto y WhatsApp</h2>
            {([
              ['phoneDisplay', 'Teléfono principal (visible)', '0414-0909873'],
              ['whatsapp', 'WhatsApp de ventas / atención (con código de país, solo números)', '584140909873'],
              ['email', 'Correo de contacto', 'ventas@energykva.com'],
              ['address', 'Dirección', 'Guanare, Edo. Portuguesa...'],
            ] as const).map(([key, label, ph]) => (
              <div key={key}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
                <input
                  type="text"
                  value={contactForm[key]}
                  onChange={(e) => setContactForm({ ...contactForm, [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full h-12 px-5 liquid-glass-input text-white rounded-full focus:outline-none font-bold text-sm"
                />
              </div>
            ))}
            <button type="submit" className="w-full liquid-glass-active text-white font-black py-4 rounded-full uppercase tracking-widest text-xs cursor-pointer hover:brightness-110">Guardar y publicar en la web</button>
          </form>
        )}
        {activeTab === 'branding' && (
          <div className="bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-2xl relative z-20 shadow-xl">
             <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10">Identidad Corporativa DB</h2>
             <div className="text-xs text-slate-400">Configuración de Logo y Marca funcional...</div>
          </div>
        )}
      </div>
      <KiraPanel />
    </main>
  );
}