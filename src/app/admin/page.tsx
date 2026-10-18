'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Pencil, X, Lock, ArrowLeft, CheckCircle, 
  Image as ImageIcon, Settings, ShoppingBag, Layers, 
  Sliders, Zap, Search, Cpu, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/config/site';
import { products as sampleIndustrialProducts } from '@/data/products';

const FALLBACK_INDUSTRIAL_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" rx="32" fill="%230A0E17"/><circle cx="200" cy="200" r="120" stroke="%230044FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.5"/><circle cx="200" cy="200" r="85" fill="%230044FF" fill-opacity="0.15" stroke="%2300E5FF" stroke-width="3"/><path d="M215 115L145 215H200L185 285L255 185H200L215 115Z" fill="%2300E5FF" stroke="%23FFFFFF" stroke-width="4" stroke-linejoin="round"/><text x="200" y="355" text-anchor="middle" fill="%2300E5FF" font-family="sans-serif" font-weight="900" font-size="18" letter-spacing="4">ENERGY KVA</text></svg>';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'hero' | 'ofertas' | 'categories' | 'branding' | 'advisor'>('products');
  const [successMsg, setSuccessMsg] = useState('');

  const [storeName, setStoreName] = useState(siteConfig.storeName);
  const [logoWhite, setLogoWhite] = useState(siteConfig.branding.logoWhite);
  const [logoDark, setLogoDark] = useState(siteConfig.branding.logoDark);

  const availableCategories = siteConfig.categories.filter(c => c.id !== 'Todos');

  const [products, setProducts] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingProductId, setEditingProductId] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    title: '', price: '', stock: '100', category: availableCategories[0]?.id || 'TRANSFORMADORES', description: '', features: '', images: ['', '', '', '']
  });

  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [editingHeroId, setEditingHeroId] = useState<any>(null);
  const [heroForm, setHeroForm] = useState({ title: '', btnLink: '/catalogo', desktopImg: '', mobileImg: '' });

  const [offers, setOffers] = useState<any[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', btnLink: '/catalogo', desktopImg: '', mobileImg: '' });

  const [categories, setCategories] = useState<any[]>(siteConfig.categories);
  const [editingCategoryId, setEditingCategoryId] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', image: '' });

  const ADMIN_PIN = 'Admin1234.';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth_kva_v2', 'true');
      loadAllData();
    } else {
      showNotification('Credenciales inválidas. Acceso denegado.');
    }
  };

  const loadAllData = async () => {
    const localProds = localStorage.getItem('kva_products_db');
    if (localProds) setProducts(JSON.parse(localProds));
    
    const localOffers = localStorage.getItem('kva_offers_db');
    if (localOffers) setOffers(JSON.parse(localOffers));

    const localHero = localStorage.getItem('kva_hero_db');
    if (localHero) setHeroSlides(JSON.parse(localHero));

    const localBrand = localStorage.getItem('kva_branding_db');
    if (localBrand) {
      const lb = JSON.parse(localBrand);
      setStoreName(lb.store_name); setLogoWhite(lb.logo_white); setLogoDark(lb.logo_dark);
    }

    const { data: prodData } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (prodData && prodData.length > 0) {
      setProducts(prodData);
      localStorage.setItem('kva_products_db', JSON.stringify(prodData));
    }
    const { data: offersData } = await supabase.from('offers').select('*').order('id', { ascending: true });
    if (offersData && offersData.length > 0) {
      setOffers(offersData);
      localStorage.setItem('kva_offers_db', JSON.stringify(offersData));
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth_kva_v2') === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  const filteredInventory = useMemo(() => {
    if (!adminSearch.trim()) return products;
    const q = adminSearch.toLowerCase();
    return products.filter((p) =>
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.category || '').toLowerCase().includes(q) ||
      String(p.id || '').toLowerCase().includes(q)
    );
  }, [products, adminSearch]);

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

  const isVideoSource = (url: string) => url?.endsWith('.mp4') || url?.includes('.mp4?') || url?.startsWith('data:video');

  const handleRestoreSampleData = async () => {
    if (confirm("¿Estás seguro de restaurar los 8 productos industriales base? Esto borrará el inventario actual de Supabase y de tu navegador.")) {
      setProducts(sampleIndustrialProducts);
      localStorage.setItem('kva_products_db', JSON.stringify(sampleIndustrialProducts));
      showNotification('✅ Datos de muestra industriales restaurados con éxito.');
      
      // Borrar registros antiguos y guardar limpios sin paymentMethods
      await supabase.from('products').delete().neq('id', '0');
      const { error } = await supabase.from('products').insert(sampleIndustrialProducts);
      if (error) console.error("Error Supabase:", error);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) return;
    const parsedFeatures = productForm.features.split('\n').map((f) => f.trim()).filter(Boolean);
    const cleanImages = productForm.images.filter((img) => img.trim() !== '');
    const numericPrice = Number(productForm.price) || 0;
    const numericStock = Number(productForm.stock ?? 100);

    let updatedList = [...products];

    if (editingProductId) {
      const updatedProduct = {
        id: editingProductId, title: productForm.title, price: numericPrice, stock: numericStock,
        category: productForm.category, description: productForm.description,
        features: parsedFeatures, images: cleanImages
      };
      updatedList = products.map((p) => p.id === editingProductId ? updatedProduct : p);
      setProducts(updatedList);
      localStorage.setItem('kva_products_db', JSON.stringify(updatedList));
      setEditingProductId(null);
      showNotification('¡Equipo actualizado exitosamente!');
      await supabase.from('products').update(updatedProduct).eq('id', editingProductId);
    } else {
      const newItem = {
        id: `kva-${Date.now()}`, title: productForm.title, price: numericPrice, stock: numericStock,
        category: productForm.category, description: productForm.description,
        features: parsedFeatures, images: cleanImages,
      };
      updatedList = [newItem, ...products];
      setProducts(updatedList);
      localStorage.setItem('kva_products_db', JSON.stringify(updatedList));
      showNotification('¡Nuevo equipo agregado al catálogo!');
      await supabase.from('products').insert([newItem]);
    }
    setProductForm({ title: '', price: '', stock: '100', category: availableCategories[0]?.id || 'TRANSFORMADORES', description: '', features: '', images: ['', '', '', ''] });
  };

  const startEditProduct = (product: any) => {
    setEditingProductId(product.id);
    const existingImgs = Array.isArray(product.images) ? [...product.images] : [];
    while (existingImgs.length < 4) existingImgs.push('');
    setProductForm({
      title: product.title || '', price: product.price?.toString() || '',
      stock: (product.stock ?? 100).toString(), category: product.category || availableCategories[0]?.id,
      description: product.description || '', features: Array.isArray(product.features) ? product.features.join('\n') : product.features || '',
      images: existingImgs.slice(0, 4),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: any) => {
    if(confirm("¿Eliminar este equipo del inventario?")) {
      const updatedList = products.filter((p) => p.id !== id);
      setProducts(updatedList);
      localStorage.setItem('kva_products_db', JSON.stringify(updatedList));
      showNotification('Equipo eliminado definitivamente.');
      await supabase.from('products').delete().eq('id', id);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroForm.desktopImg) return showNotification('La imagen de escritorio es obligatoria.');
    
    let updatedList = [...heroSlides];
    if (editingHeroId) {
      const updated = { id: editingHeroId, title: heroForm.title, btnLink: heroForm.btnLink, desktopImg: heroForm.desktopImg, mobileImg: heroForm.mobileImg || heroForm.desktopImg };
      updatedList = heroSlides.map((s) => s.id === editingHeroId ? updated : s);
      setHeroSlides(updatedList);
      setEditingHeroId(null);
      showNotification('Banner actualizado.');
      await supabase.from('hero_slides').update(updated).eq('id', editingHeroId);
    } else {
      const newItem = { id: `hero-${Date.now()}`, title: heroForm.title || 'Nuevo Banner', btnLink: heroForm.btnLink || '/catalogo', desktopImg: heroForm.desktopImg, mobileImg: heroForm.mobileImg || heroForm.desktopImg };
      updatedList = [...heroSlides, newItem];
      setHeroSlides(updatedList);
      showNotification('Banner publicado.');
      await supabase.from('hero_slides').insert([newItem]);
    }
    localStorage.setItem('kva_hero_db', JSON.stringify(updatedList));
    setHeroForm({ title: '', btnLink: '/catalogo', desktopImg: '', mobileImg: '' });
  };

  const startEditHero = (slide: any) => {
    setEditingHeroId(slide.id);
    setHeroForm({ title: slide.title || '', btnLink: slide.btnLink || '/catalogo', desktopImg: slide.desktopImg || '', mobileImg: slide.mobileImg || '' });
  };

  const handleDeleteHero = async (id: any) => {
    const updatedList = heroSlides.filter((s) => s.id !== id);
    setHeroSlides(updatedList);
    localStorage.setItem('kva_hero_db', JSON.stringify(updatedList));
    await supabase.from('hero_slides').delete().eq('id', id);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.desktopImg) return showNotification('La imagen de escritorio es obligatoria.');

    let updatedList = [...offers];
    if (editingOfferId) {
      const updated = { id: editingOfferId, title: offerForm.title, description: offerForm.description, btnLink: offerForm.btnLink, desktopImg: offerForm.desktopImg, mobileImg: offerForm.mobileImg || offerForm.desktopImg };
      updatedList = offers.map((o) => o.id === editingOfferId ? updated : o);
      setOffers(updatedList);
      setEditingOfferId(null);
      showNotification('Oferta actualizada.');
      await supabase.from('offers').update(updated).eq('id', editingOfferId);
    } else {
      const newItem = { id: `offer-${Date.now()}`, title: offerForm.title, description: offerForm.description, btnLink: offerForm.btnLink, desktopImg: offerForm.desktopImg, mobileImg: offerForm.mobileImg || offerForm.desktopImg };
      updatedList = [...offers, newItem];
      setOffers(updatedList);
      showNotification('Oferta publicada.');
      await supabase.from('offers').insert([newItem]);
    }
    localStorage.setItem('kva_offers_db', JSON.stringify(updatedList));
    setOfferForm({ title: '', description: '', btnLink: '/catalogo', desktopImg: '', mobileImg: '' });
  };

  const startEditOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setOfferForm({ title: offer.title || '', description: offer.description || '', btnLink: offer.btnLink || '/catalogo', desktopImg: offer.desktopImg || '', mobileImg: offer.mobileImg || '' });
  };

  const handleDeleteOffer = async (id: any) => {
    const updatedList = offers.filter((o) => o.id !== id);
    setOffers(updatedList);
    localStorage.setItem('kva_offers_db', JSON.stringify(updatedList));
    await supabase.from('offers').delete().eq('id', id);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.image) return showNotification('Nombre e imagen requeridos.');

    const cleanId = (categoryForm.id || categoryForm.name).toUpperCase().replace(/\s+/g, '');
    let updatedList = [...categories];
    
    if (editingCategoryId) {
      const updated = { name: categoryForm.name, image: categoryForm.image };
      updatedList = categories.map((c) => c.id === editingCategoryId ? { ...c, ...updated } : c);
      setCategories(updatedList);
      setEditingCategoryId(null);
      showNotification('Departamento actualizado.');
      await supabase.from('categories').update(updated).eq('id', editingCategoryId);
    } else {
      const newItem = { id: cleanId, name: categoryForm.name, image: categoryForm.image };
      updatedList = [...categories, newItem];
      setCategories(updatedList);
      showNotification('Departamento creado.');
      await supabase.from('categories').insert([newItem]);
    }
    localStorage.setItem('kva_categories_db', JSON.stringify(updatedList));
    setCategoryForm({ id: '', name: '', image: '' });
  };

  const startEditCategory = (cat: any) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ id: cat.id || '', name: cat.name || '', image: cat.image || '' });
  };

  const handleDeleteCategory = async (id: any) => {
    const updatedList = categories.filter((c) => c.id !== id);
    setCategories(updatedList);
    localStorage.setItem('kva_categories_db', JSON.stringify(updatedList));
    await supabase.from('categories').delete().eq('id', id);
  };

  const handleSaveBranding = async () => {
    const updated = { store_name: storeName, logo_white: logoWhite, logo_dark: logoDark };
    localStorage.setItem('kva_branding_db', JSON.stringify(updated));
    showNotification('Identidad corporativa actualizada en vivo.');
    await supabase.from('store_settings').upsert({ id: 1, ...updated });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-robot-skin flex items-center justify-center px-4 relative">
        <div className="bg-[#0A0E17]/95 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 w-full max-w-md relative z-10 border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-[0_0_20px_rgba(0,56,255,0.3)]">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-center text-white mb-2 uppercase tracking-tight">
            Terminal Admin <span className="text-blue-500">KVA</span>
          </h1>
          <p className="text-xs text-slate-400 text-center mb-8 font-medium">
            Acceso restringido. Ingrese clave de seguridad.
          </p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-5 text-center tracking-widest liquid-glass-input text-white rounded-full focus:outline-none focus:border-blue-500 font-bold"
            />
            <button
              type="submit"
              className="w-full liquid-glass-active text-white font-black py-4 rounded-full transition-all uppercase tracking-widest text-xs cursor-pointer hover:brightness-110"
            >
              Autorizar Acceso
            </button>
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
          <h1 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
            Consola Operativa
          </h1>
          <span className="hidden md:inline-block bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            En Vivo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="px-5 py-2.5 rounded-full liquid-glass-input text-xs font-black text-blue-400 hover:text-white transition-colors border border-blue-500/20">
            Ver Tienda
          </Link>
          <button onClick={() => { localStorage.removeItem('admin_auth_kva_v2'); setIsAuthenticated(false); }} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">
            Desconectar
          </button>
        </div>
      </header>

      <div className="bg-[#0A0E17]/80 border-b border-white/5">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-28 flex gap-3 overflow-x-auto py-4 scrollbar-hide">
          {[
            { id: 'products', icon: ShoppingBag, label: `Inventario (${products.length})` },
            { id: 'ofertas', icon: Zap, label: `Ofertas (${offers.length})` },
            { id: 'categories', icon: Layers, label: `Departamentos (${categories.length})` },
            { id: 'hero', icon: Sliders, label: `Banners (${heroSlides.length})` },
            { id: 'branding', icon: Settings, label: `Marca` },
            { id: 'advisor', icon: Cpu, label: `KVA Advisor (AI)` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive ? 'liquid-glass-active text-white' : 'liquid-glass-dark text-slate-400 hover:text-white border-transparent'
                }`}
              >
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

        <div className="mb-8 flex justify-end relative z-20">
          <button 
            onClick={handleRestoreSampleData}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0A0E17]/80 backdrop-blur-md text-blue-400 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border border-blue-500/30"
          >
            <RotateCcw size={14} /> Restaurar Data Industrial Base
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-20">
            <div className="lg:col-span-4 xl:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  {editingProductId ? <Pencil size={16} className="text-amber-400" /> : <Plus size={16} className="text-blue-500" />}
                  {editingProductId ? 'Modificar Equipo' : 'Nuevo Equipo'}
                </h2>
                {editingProductId && (
                  <button onClick={() => { setEditingProductId(null); setProductForm({ title: '', price: '', stock: '100', category: availableCategories[0]?.id || 'TRANSFORMADORES', description: '', features: '', images: ['', '', '', ''] }); }} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer uppercase">
                    <X size={12} /> Cancelar
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Nombre del Equipo</label>
                  <input type="text" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Precio (USD)</label>
                    <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-blue-400 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-black" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Stock</label>
                    <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Departamento (Real)</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-blue-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-bold cursor-pointer appearance-none">
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#0A0E17]">{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Ficha Técnica</label>
                  <textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full p-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Especificaciones</label>
                  <textarea rows={3} value={productForm.features} onChange={(e) => setProductForm({ ...productForm, features: e.target.value })} className="w-full p-4 liquid-glass-input text-white rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Multimedia (MP4 / Imagen)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const media = productForm.images[index];
                      const isVideo = isVideoSource(media);
                      return (
                        <div key={index} className="liquid-glass-input border-dashed border-white/20 p-1 rounded-2xl text-center relative h-20 flex items-center justify-center hover:border-blue-500 transition-colors">
                          {media ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                              {isVideo ? <video src={media} className="h-full w-full object-contain" muted autoPlay loop playsInline /> : <img src={media} alt={`Preview ${index}`} className="h-full w-full object-contain p-2" />}
                              <button type="button" onClick={() => { const updated = [...productForm.images]; updated[index] = ''; setProductForm({ ...productForm, images: updated }); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 cursor-pointer shadow-md">✕</button>
                            </div>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full opacity-60 hover:opacity-100">
                              <div className="flex items-center gap-2 text-blue-500 mb-1"><ImageIcon size={14} /></div>
                              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={(e) => handleMediaUpload(e, (url) => { const updated = [...productForm.images]; updated[index] = url; setProductForm({ ...productForm, images: updated }); })} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button type="submit" className="w-full font-black py-4 rounded-full transition-all text-[11px] uppercase tracking-widest shadow-lg cursor-pointer liquid-glass-active text-white hover:brightness-110">
                  {editingProductId ? 'Actualizar BD en Vivo' : 'Publicar al Catálogo'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 xl:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Base de Datos ({filteredInventory.length})</h2>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="search" placeholder="Buscar ID, nombre..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="w-full h-11 pl-11 pr-4 liquid-glass-input rounded-full text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
                {filteredInventory.map((product) => {
                  const firstMedia = Array.isArray(product.images) && product.images[0] ? product.images[0] : FALLBACK_INDUSTRIAL_SVG;
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/40 transition-colors gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src={firstMedia} alt={product.title} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-slate-100 text-sm truncate mb-1">{product.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                            <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">${Number(product.price || 0).toFixed(2)}</span>
                            <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">{product.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditProduct(product)} className="p-3 text-blue-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-3 text-red-400 hover:text-white liquid-glass-input rounded-xl cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
            <div className="lg:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10">{editingHeroId ? 'Editar Banner' : 'Nuevo Banner'}</h2>
              <form onSubmit={handleSaveHero} className="space-y-4">
                <input type="text" placeholder="Título" value={heroForm.title} onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                <input type="text" placeholder="Enlace (/catalogo...)" value={heroForm.btnLink} onChange={(e) => setHeroForm({ ...heroForm, btnLink: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Imagen PC</label>
                  {heroForm.desktopImg && <img src={heroForm.desktopImg} alt="PC" className="h-20 w-full object-cover rounded-xl" />}
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setHeroForm({ ...heroForm, desktopImg: url }))} className="text-xs text-slate-400 w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Imagen Móvil</label>
                  {heroForm.mobileImg && <img src={heroForm.mobileImg} alt="Movil" className="h-20 w-24 object-cover rounded-xl" />}
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setHeroForm({ ...heroForm, mobileImg: url }))} className="text-xs text-slate-400 w-full" />
                </div>
                <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-xs font-black uppercase">Guardar Cambios</button>
              </form>
            </div>
            <div className="lg:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase mb-6">Banners Activos ({heroSlides.length})</h2>
              <div className="space-y-4">
                {heroSlides.map((slide) => (
                  <div key={slide.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex gap-4">
                      <img src={slide.desktopImg} className="w-24 h-14 object-cover rounded-lg" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{slide.title}</h4>
                        <p className="text-xs text-blue-400">{slide.btnLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditHero(slide)} className="p-2 text-blue-400 liquid-glass-input rounded-xl"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteHero(slide.id)} className="p-2 text-red-400 liquid-glass-input rounded-xl"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ofertas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
            <div className="lg:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10">{editingOfferId ? 'Editar Oferta' : 'Nueva Oferta'}</h2>
              <form onSubmit={handleSaveOffer} className="space-y-4">
                <input type="text" placeholder="Título" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                <input type="text" placeholder="Descripción" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                <input type="text" placeholder="Enlace" value={offerForm.btnLink} onChange={(e) => setOfferForm({ ...offerForm, btnLink: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Imagen PC</label>
                  {offerForm.desktopImg && <img src={offerForm.desktopImg} alt="PC" className="h-20 w-full object-cover rounded-xl" />}
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setOfferForm({ ...offerForm, desktopImg: url }))} className="text-xs text-slate-400 w-full" />
                </div>
                <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-xs font-black uppercase">Guardar en Ofertas</button>
              </form>
            </div>
            <div className="lg:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase mb-6">Ofertas Activas ({offers.length})</h2>
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex gap-4">
                      <img src={offer.desktopImg} className="w-24 h-14 object-cover rounded-lg" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{offer.title}</h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditOffer(offer)} className="p-2 text-blue-400 liquid-glass-input rounded-xl"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteOffer(offer.id)} className="p-2 text-red-400 liquid-glass-input rounded-xl"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
            <div className="lg:col-span-4 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10">{editingCategoryId ? 'Editar Dpto' : 'Nuevo Dpto'}</h2>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <input type="text" placeholder="ID (Ej: ENERGIA)" value={categoryForm.id} disabled={!!editingCategoryId} onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-blue-400 font-bold rounded-xl text-xs disabled:opacity-50" />
                <input type="text" placeholder="Nombre" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full h-11 px-4 liquid-glass-input text-white rounded-xl text-xs" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Imagen Ref</label>
                  {categoryForm.image && <img src={categoryForm.image} alt="Cat" className="h-16 w-16 object-cover rounded-xl" />}
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setCategoryForm({ ...categoryForm, image: url }))} className="text-xs text-slate-400 w-full" />
                </div>
                <button type="submit" className="w-full py-4 rounded-full liquid-glass-active text-white text-xs font-black uppercase">Guardar en Configuración</button>
              </form>
            </div>
            <div className="lg:col-span-8 bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-black text-white uppercase mb-6">Departamentos Activos ({categories.length})</h2>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex gap-3 items-center">
                      <img src={cat.image} className="w-10 h-10 object-cover rounded-lg bg-white/10" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                        <span className="text-[10px] text-blue-400 font-black">{cat.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditCategory(cat)} className="p-2 text-blue-400 liquid-glass-input rounded-xl"><Pencil size={14}/></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-400 liquid-glass-input rounded-xl"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-2xl relative z-20 shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10">Identidad Corporativa DB</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Tienda</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full h-11 px-4 mt-2 liquid-glass-input text-white rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Blanco</label>
                <div className="flex items-center gap-4 mt-2">
                  <img src={logoWhite} className="h-12 w-auto bg-black p-2 rounded-lg" />
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setLogoWhite(url))} className="text-xs text-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Oscuro</label>
                <div className="flex items-center gap-4 mt-2">
                  <img src={logoDark} className="h-12 w-auto bg-white/80 p-2 rounded-lg" />
                  <input type="file" onChange={(e) => handleMediaUpload(e, (url) => setLogoDark(url))} className="text-xs text-slate-400" />
                </div>
              </div>
              <button onClick={handleSaveBranding} className="py-4 px-8 rounded-full liquid-glass-active text-white text-xs font-black uppercase shadow-lg hover:brightness-110">Sincronizar Branding</button>
            </div>
          </div>
        )}

        {activeTab === 'advisor' && (
          <div className="bg-[#0A0E17]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 max-w-3xl mx-auto text-center shadow-xl relative z-20">
            <div className="w-24 h-24 rounded-full liquid-glass-active flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,56,255,0.4)]">
              <Cpu className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              KVA Energy Advisor <span className="text-blue-500">(Beta)</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-8 font-medium">
              El motor de Inteligencia Artificial para el cálculo de demanda en KVA/Watts está en fase de despliegue.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}