"use client";

import { useState } from 'react';
import { ShieldCheck, Globe, Save, Loader2 } from 'lucide-react';
import { updatePreferences } from '@/lib/actions/settings';
import { toast } from 'sonner';

export default function SettingsForm({ currentCurrency }: { currentCurrency: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    currency: currentCurrency || 'DOP'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updatePreferences(formData);
      if (result.success) {
        toast.success("¡Preferencias actualizadas!");
        setFormData({ ...formData, password: '' }); // Limpiamos el campo de clave por seguridad
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {/* SECCIÓN CONTRASEÑA */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Seguridad</h2>
            <p className="text-sm text-slate-500 font-medium">Actualiza tu contraseña de acceso.</p>
          </div>
        </div>
        <input 
          type="password" 
          placeholder="Nueva contraseña (deja en blanco para no cambiar)"
          className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500/20 text-neutral-900 placeholder:text-neutral-400"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
      </div>

      {/* SECCIÓN MONEDA */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Preferencias Regionales</h2>
            <p className="text-sm text-slate-500 font-medium">Moneda principal para tus reportes.</p>
          </div>
        </div>
        <select 
          className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-neutral-900 font-bold"
          value={formData.currency}
          onChange={(e) => setFormData({...formData, currency: e.target.value})}
        >
          <option value="DOP">Peso Dominicano (DOP)</option>
          <option value="USD">Dólar Estadounidense (USD)</option>
        </select>
      </div>

      {/* BOTÓN GUARDAR */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Cambios</>}
      </button>
    </form>
  );
}