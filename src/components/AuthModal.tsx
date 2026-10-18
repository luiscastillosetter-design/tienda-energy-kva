'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, LogOut, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userSession, setUserSession] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('kva_user_session');
    if (session) setUserSession(JSON.parse(session));
  }, []);

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { name: name || email.split('@')[0], email };
    localStorage.setItem('kva_user_session', JSON.stringify(userData));
    setUserSession(userData);
    alert(isLogin ? `¡Bienvenido a ${siteConfig.storeName}!` : '¡Cuenta industrial creada con éxito!');
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('kva_user_session');
    setUserSession(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-[#0A0E17]/95 border border-white/15 w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.15)] p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white cursor-pointer transition-colors">
          <X className="w-6 h-6" />
        </button>

        {userSession ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 liquid-glass-dark border border-cyan-500 text-cyan-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-[0_0_20px_rgba(0,229,255,0.3)]">
              {userSession.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">¡Hola, {userSession.name}!</h3>
              <p className="text-sm text-cyan-400 mt-1 font-medium">{userSession.email}</p>
            </div>
            <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 hover:text-red-300 font-black py-4 rounded-xl transition-colors mt-6 flex items-center justify-center gap-2 uppercase tracking-wider text-xs">
              <LogOut className="w-4 h-4" /> Desconectar Equipo
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 liquid-glass-dark border border-blue-500/50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(0,68,255,0.3)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">{isLogin ? 'Acceso a Clientes' : 'Registro Corporativo'}</h3>
              <p className="text-xs text-slate-400 mt-2">Plataforma Oficial {siteConfig.storeName}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre o Razón Social" className="w-full bg-[#05070E] border border-white/10 text-white rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 text-sm font-medium transition-colors" />
                </div>
              )}
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" className="w-full bg-[#05070E] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-cyan-500 text-sm font-medium transition-colors" />
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Clave de seguridad" className="w-full bg-[#05070E] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-cyan-500 text-sm font-medium transition-colors" />
              </div>

              <button type="submit" className="w-full liquid-glass-active text-white font-black py-4 rounded-xl transition-all shadow-lg mt-4 uppercase tracking-wider text-xs hover:brightness-110">
                {isLogin ? 'Iniciar Sesión' : 'Crear Perfil Industrial'}
              </button>
            </form>

            <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center mt-6 text-xs text-slate-400 hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors cursor-pointer">
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}