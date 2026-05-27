'use client'

import { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useCatalogs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@teispace/next-themes'
import { useYBankStore } from '@/store/useYBankStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CurrencyCode } from '@/types'

interface PreferencesData {
  theme: 'light' | 'dark' | 'auto'
  currency: CurrencyCode
  language: string
  dataCollection: boolean
}

export default function PreferencesSection() {
  const { setTheme } = useTheme()
  const { setCurrency } = useYBankStore() // 👈 Motor de actualización global
  const { data: profileData, isLoading: isLoadingProfile } = useProfile()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()

  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'auto',
    currency: 'DOP',
    language: 'es',
    dataCollection: false
  })

  const handlePreferenceChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({ 
      ...prev, 
      [key]: value 
    }))
  }

  useEffect(() => {
    if (profileData) {
      setPreferences({
        theme: profileData.theme || 'auto',
        currency: profileData.currency_preference || 'DOP',
        language: profileData.language || 'es',
        dataCollection: profileData.data_collection ?? false
      })
    }
  }, [profileData])

  const handleSave = () => {
    const payload = {
      theme: preferences.theme,
      currency_preference: preferences.currency,
      language: preferences.language,
      data_collection: preferences.dataCollection
    }

    updateProfile(payload, {
      onSuccess: () => {
        setCurrency(preferences.currency) 
        setTheme(preferences.theme)
        toast.success('Preferencias actualizadas en el sistema')
      },
      onError: (error) => toast.error(`Error: ${error.message}`)
    })
  }

  // Estilo reutilizable para los contenedores de opciones
  const CardContainer = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="bg-card border border-border rounded-[12px] p-6 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">{title}</h2>
      {children}
    </div>
  )

  if (isLoadingProfile) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      
      {/* 1. TEMA (Grid de selección visual) */}
      <CardContainer title="Tema Visual">
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'auto'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPreferences(p => ({ ...p, theme: t }))}
              className={cn(
                "p-4 rounded-[8px] border-2 text-center transition-all text-[11px] font-black uppercase tracking-widest",
                preferences.theme === t 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-border hover:border-border/80"
              )}
            >
              {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Auto'}
            </button>
          ))}
        </div>
      </CardContainer>

      {/* 2. REGIONALES (Inputs optimizados) */}
      <CardContainer title="Formatos Regionales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2">Idioma</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences(p => ({ ...p, language: e.target.value }))}
              className="w-full bg-surface-2 border border-border p-3 rounded-[8px] text-sm font-bold outline-none focus:border-primary"
            >
              <option value="es">Español (DO)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2">Moneda Principal</label>
            <select
              value={preferences.currency}
              disabled={isSaving}
              onChange={(e) => handlePreferenceChange('currency', e.target.value as CurrencyCode)} 
              className="..."
            >
              <option value="DOP">DOP (RD$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 3. PRIVACIDAD (Toggle) */}
      <CardContainer title="Privacidad">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Telemetría Anónima</p>
            <p className="text-[11px] text-muted-foreground">Ayúdanos a mejorar YBank Engine.</p>
          </div>
          <div 
             onClick={() => setPreferences(p => ({ ...p, dataCollection: !p.dataCollection }))}
             className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors", preferences.dataCollection ? "bg-primary" : "bg-border")}
          >
            <motion.div animate={{ x: preferences.dataCollection ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </CardContainer>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full md:w-auto px-10 py-3 bg-foreground text-background rounded-[8px] font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98]"
      >
        {isSaving ? 'Aplicando cambios...' : 'Guardar Preferencias'}
      </button>
    </div>
  )
}