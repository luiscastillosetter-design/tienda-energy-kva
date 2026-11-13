'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { getAdminKey } from '@/lib/adminDb';

interface Msg { role: 'user' | 'assistant'; content: string }

const QUICK = ['¿Cómo nos fue hoy?', 'Pedidos pendientes por Valery', 'Inventario con bajo stock'];

export default function KiraPanel() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'Hola María, soy Kira. Pregúntame por ventas, pedidos, inventario, o pídeme crear ofertas y ajustar stock/precio.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    const history = msgs.slice(1);
    setMsgs((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/kira/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: 'assistant', content: data.reply || data.error || 'Sin respuesta.' }]);
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'Error de conexión con Kira.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(37,99,235,0.5)] cursor-pointer"
        >
          <Bot size={16} /> Kira IA
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[80vh] flex flex-col bg-[#0A0E17]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-wider">
              <Bot size={16} className="text-blue-400" /> Kira IA • Asistente Operativo
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-[11px] text-slate-500 font-bold">Kira está consultando…</div>}
            <div ref={endRef} />
          </div>
          <div className="px-4 pt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)} disabled={loading} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-black hover:bg-blue-500/20 disabled:opacity-50 cursor-pointer">
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe a Kira…"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-500/50"
            />
            <button type="submit" disabled={loading} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 cursor-pointer">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
