"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Globe, CheckCircle2 } from 'lucide-react';
import { completeOnboarding } from '@/lib/actions/auth';
import { toast } from 'sonner';

// 💡 Definimos las props que vienen del Server Component
interface OnboardingFormProps {
  initialStep: number;
  defaultName: string;
}

export default function OnboardingForm({ initialStep, defaultName }: OnboardingFormProps) {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: defaultName, // Pre-cargamos el nombre si ya existe
    password: '',
    currency: 'DOP'
  });
  
  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await completeOnboarding(formData);
      if (result.success) {
        toast.success("¡Configuración completada!");
        // 🚀 Redirección limpia al Dashboard
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6">
      <AnimatePresence mode="wait">
        {/* PASO 1: NOMBRE (Solo si initialStep era 1) */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">¿Cómo te llamas?</h2>
            <input 
              type="text" 
              placeholder="Tu nombre completo"
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 text-neutral-900 placeholder:text-neutral-400"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
            <button onClick={handleNext} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform">
              Siguiente
            </button>
          </motion.div>
        )}

        {/* PASO 2: CONTRASEÑA (Solo si es usuario de Google que quiere clave local) */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Crea una contraseña</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Como entraste con Google, puedes crear una clave de acceso rápido para YBank.
            </p>
            <input 
              type="password" 
              placeholder="Mínimo 8 caracteres"
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500/20 text-neutral-900"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button onClick={handleNext} className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform">
              Siguiente
            </button>
          </motion.div>
        )}

        {/* PASO 3: PREFERENCIAS (Este paso lo ven TODOS) */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Globe size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Preferencia regional</h2>
            <p className="text-sm text-slate-500 font-medium">¿En qué moneda quieres ver tus balances globales?</p>
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-neutral-900 font-bold"
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
            >
              <option value="DOP">Peso Dominicano (DOP)</option>
              <option value="USD">Dólar Estadounidense (USD)</option>
            </select>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
            >
              {loading ? "Guardando..." : <><CheckCircle2 size={20} /> Finalizar Configuración</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}