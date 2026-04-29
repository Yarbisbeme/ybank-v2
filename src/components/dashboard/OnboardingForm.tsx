"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Globe, CheckCircle2, Building2 } from 'lucide-react';
import { completeOnboarding } from '@/lib/actions/auth';
import { createAccount } from '@/lib/actions/accounts'; 
import { CurrencyCode } from '@/types';
import { toast } from 'sonner';

interface Institution {
  id: string;
  name: string;
}

interface OnboardingFormProps {
  initialStep: number;
  defaultName: string;
  institutions: Institution[];
}

export default function OnboardingForm({ initialStep, defaultName, institutions }: OnboardingFormProps) {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  
  // 💡 CORRECCIÓN 1: Le decimos a TypeScript que 'currency' es estrictamente un CurrencyCode
  const [formData, setFormData] = useState({
    fullName: defaultName,
    password: '',
    currency: 'DOP' as CurrencyCode, 
    accountName: '',
    institutionId: institutions.length > 0 ? institutions[0].id : '',
    initialBalance: ''
  });
  
  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    if (!formData.accountName || !formData.institutionId) {
      toast.error("Por favor completa los datos de tu cuenta principal.");
      return setStep(3);
    }

    setLoading(true);
    try {
      const accountResult = await createAccount({
        institution_id: formData.institutionId,
        name: formData.accountName,
        type: 'savings', 
        initial_balance: Number(formData.initialBalance) || 0,
        currency: formData.currency, 
        is_active: true
      });

      if (!accountResult.success) {
        throw new Error("Error creando tu cuenta bancaria. " + (accountResult.error || ""));
      }

      // 💡 CORRECCIÓN 2: Forzamos a TypeScript a reconocer que 'data' existe en el resultado exitoso
      const resultData = (accountResult as { success: true; data: { id: string } }).data;
      const newAccountId = resultData?.id;

      if (!newAccountId) {
        throw new Error("La cuenta se creó, pero no se pudo obtener el ID de verificación.");
      }

      const result = await completeOnboarding({
        fullName: formData.fullName,
        password: formData.password,
        currency: formData.currency,
        primaryAccountId: newAccountId 
      });

      if (result.success) {
        toast.success("¡Infraestructura lista!");
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Error crítico al configurar YBANK");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const cardClasses = "space-y-6 bg-card p-8 rounded-2xl shadow-lg border border-border";
  const inputClasses = "w-full p-4 bg-background rounded-xl border border-border focus:ring-4 focus:ring-primary/10 text-foreground font-sans placeholder:text-muted-foreground outline-none transition-all";

  return (
    <div className="max-w-md w-full mx-auto p-6">
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="step1" {...variants} className={cardClasses}>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <User size={24} />
            </div>
            <h2 className="text-3xl font-bold font-sans text-foreground tracking-tight">Identidad</h2>
            <p className="text-muted-foreground">¿Cómo te llamas?</p>
            <input 
              type="text" 
              placeholder="Tu nombre completo"
              className={inputClasses}
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
            <button onClick={handleNext} className="btn-primary w-full py-4 font-semibold text-lg">
              Siguiente
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" {...variants} className={cardClasses}>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-bold font-sans text-foreground tracking-tight">Seguridad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Define una clave maestra para YBANK.
            </p>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              className={inputClasses}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
             <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="p-4 bg-surface-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                Atrás
              </button>
              <button onClick={handleNext} className="btn-primary flex-1 py-4 font-semibold text-lg">
                Siguiente
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...variants} className={cardClasses}>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>
            <h2 className="text-3xl font-bold font-sans text-foreground tracking-tight">Origen de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Configura tu cuenta principal para que la IA calcule tus tasas correctamente.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Institución</label>
                <select 
                  className={inputClasses}
                  value={formData.institutionId}
                  onChange={(e) => setFormData({...formData, institutionId: e.target.value})}
                >
                  <option value="" disabled>Selecciona un banco</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Nombre (Ej. Nómina)</label>
                <input 
                  type="text" 
                  placeholder="Cuenta Principal"
                  className={inputClasses}
                  value={formData.accountName}
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                />
              </div>

               <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Balance Inicial</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className={`${inputClasses} font-mono text-lg`}
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({...formData, initialBalance: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="p-4 bg-surface-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                Atrás
              </button>
              <button onClick={handleNext} className="btn-primary flex-1 py-4 font-semibold text-lg">
                Siguiente
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" {...variants} className={cardClasses}>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Globe size={24} />
            </div>
            <h2 className="text-3xl font-bold font-sans text-foreground tracking-tight">Consolidación</h2>
            <p className="text-muted-foreground">¿En qué moneda quieres ver el resumen de tu infraestructura?</p>
            <select 
              className={`${inputClasses} font-mono font-semibold text-xl text-center`}
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value as CurrencyCode})}
            >
              <option value="DOP">DOP - Peso Dominicano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
            </select>
            
            <div className="flex gap-3 mt-6">
               <button onClick={() => setStep(3)} className="p-4 bg-surface-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                Atrás
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="btn-primary flex-1 py-4 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Iniciando..." : <><CheckCircle2 size={20} /> Desplegar YBANK</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}