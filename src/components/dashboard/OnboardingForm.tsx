"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Globe, CheckCircle2, Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import { completeOnboarding } from '@/lib/actions/auth';
import { createAccount } from '@/lib/actions/accounts'; 
import { CurrencyCode } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // 💡 Asegúrate de tener este import

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
  
  const [formData, setFormData] = useState({
    fullName: defaultName,
    password: '',
    currency: 'DOP' as CurrencyCode, 
    accountName: '',
    institutionId: institutions.length > 0 ? institutions[0].id : '',
    initialBalance: ''
  });
  
  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const isValidStep1 = formData.fullName.trim().length > 0;
  const isValidStep2 = formData.password.length >= 6;
  const isValidStep3 = formData.accountName.trim().length > 0 && formData.institutionId !== '';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const accountResult = await createAccount({
        institution_id: formData.institutionId,
        name: formData.accountName,
        type: 'savings', 
        initial_balance: Number(formData.initialBalance) || 0,
        currency: formData.currency, 
        is_active: true,
      });

      if (!accountResult.success) {
        throw new Error("Error creando tu cuenta bancaria. " + (accountResult.error || ""));
      }

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
        window.location.href = '/dashboard';
        toast.success("¡Infraestructura lista!");
        setLoading(false);
      } else {
        toast.error(result.error);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error crítico al configurar YBANK");
      }
    }
  };

  // 💡 Animación Spring (Resorte) estilo iOS / YBANK
  const variants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -15, scale: 0.98 },
  };

  // 💡 Clases maestras redefinidas
  const cardClasses = "flex flex-col gap-6 bg-card p-8 rounded-[24px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.1)] border border-border/50";
  const inputClasses = "w-full h-12 px-4 bg-surface-2/50 rounded-[10px] border border-border/60 focus:bg-background focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 outline-none transition-all disabled:opacity-50";
  const labelClasses = "text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block ml-1";

  return (
    <div className="max-w-md w-full mx-auto p-6 relative">
      
      {/* 💡 Indicador de progreso técnico */}
      <div className="absolute -top-6 left-0 w-full flex justify-center">
        <div className="bg-surface-2 border border-border px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
           <div className="flex gap-1">
             {[1, 2, 3, 4].map((s) => (
               <div key={s} className={cn("h-1.5 rounded-full transition-all duration-300", s === step ? "w-4 bg-primary" : s < step ? "w-1.5 bg-foreground" : "w-1.5 bg-border")} />
             ))}
           </div>
           <span className="text-[10px] font-mono font-bold text-muted-foreground ml-1">STEP 0{step}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={cardClasses}>
            <div className="flex items-center gap-4 border-b border-border/50 pb-5">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-[12px] flex items-center justify-center shrink-0">
                <User size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Identidad Operativa</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Creación de Perfil</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="fullName" className={labelClasses}>Nombre Legal / Alias</label>
              <input 
                id="fullName"
                type="text" 
                placeholder="¿Cómo te llamamos?"
                className={inputClasses}
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                autoFocus
              />
            </div>

            <button 
              onClick={handleNext} 
              disabled={!isValidStep1}
              className="mt-2 flex items-center justify-center gap-2 w-full h-12 rounded-[10px] bg-foreground text-background text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none shadow-md"
            >
              Continuar <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={cardClasses}>
            <div className="flex items-center gap-4 border-b border-border/50 pb-5">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-[12px] flex items-center justify-center shrink-0">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Cifrado de Acceso</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Seguridad Master</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className={labelClasses}>Clave Maestra YBANK</label>
              <input 
                id="password"
                type="password" 
                placeholder="••••••••"
                className={cn(inputClasses, "font-mono text-lg tracking-widest")}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                autoFocus
              />
              <p className="text-[10px] font-medium text-muted-foreground mt-2 ml-1">Debe contener al menos 6 caracteres alfanuméricos.</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={handleBack} className="flex items-center justify-center w-12 h-12 bg-surface-2 border border-border rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={handleNext} 
                disabled={!isValidStep2}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px] bg-foreground text-background text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none shadow-md"
              >
                Asegurar Bóveda <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={cardClasses}>
            <div className="flex items-center gap-4 border-b border-border/50 pb-5">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-[12px] flex items-center justify-center shrink-0">
                <Building2 size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Nodo Principal</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Estructura Base</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="institution" className={labelClasses}>Institución</label>
                  <select 
                    id="institution"
                    className={inputClasses}
                    value={formData.institutionId}
                    onChange={(e) => setFormData({...formData, institutionId: e.target.value})}
                  >
                    <option value="" disabled>Banco...</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="accountName" className={labelClasses}>Identificador</label>
                  <input 
                    id="accountName"
                    type="text" 
                    placeholder="Ej. Nómina"
                    className={inputClasses}
                    value={formData.accountName}
                    onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                  />
                </div>
              </div>

              {/* 💡 HERO INPUT para el balance */}
              <div className="pt-2">
                <label htmlFor="initialBalance" className={labelClasses}>Balance Actual (Apertura)</label>
                <div className="flex items-center justify-center py-4 px-4 rounded-[12px] bg-surface-2/30 border border-border/50 focus-within:border-primary/40 focus-within:bg-background transition-all">
                  <div className="flex items-center text-3xl font-mono font-black text-foreground">
                    <span className="text-xl text-emerald-500 mr-2 -mt-1">$</span>
                    <input 
                      id="initialBalance"
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full bg-transparent border-none outline-none text-left placeholder:text-muted-foreground/30 focus:ring-0 p-0 tracking-tighter"
                      value={formData.initialBalance}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setFormData({...formData, initialBalance: val})
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={handleBack} className="flex items-center justify-center w-12 h-12 bg-surface-2 border border-border rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={handleNext} 
                disabled={!isValidStep3}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px] bg-foreground text-background text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none shadow-md"
              >
                Configurar Nodo <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 25 }} className={cardClasses}>
            <div className="flex items-center gap-4 border-b border-border/50 pb-5">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-[12px] flex items-center justify-center shrink-0">
                <Globe size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Consolidación</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Moneda Base</p>
              </div>
            </div>
            
            <div className="py-2">
              <label htmlFor="currency" className={labelClasses}>Divisa de Reportes</label>
              <select 
                id="currency"
                className={cn(inputClasses, "font-mono font-bold text-base")}
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value as CurrencyCode})}
                disabled={loading}
              >
                <option value="DOP">DOP - Peso Dominicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
              </select>
              <p className="text-[10px] font-medium text-muted-foreground mt-3 text-center px-4 leading-relaxed">
                Toda la infraestructura y métricas analíticas se calcularán usando esta moneda base.
              </p>
            </div>
            
            <div className="flex gap-3 mt-2">
               <button onClick={handleBack} disabled={loading} className="flex items-center justify-center w-12 h-12 bg-surface-2 border border-border rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50">
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-12 rounded-[10px] text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)]",
                  loading ? "bg-muted text-muted-foreground cursor-wait" : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {loading ? "Sincronizando..." : <><CheckCircle2 size={16} /> Inicializar YBANK</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}