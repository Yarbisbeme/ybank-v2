'use client'

import { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useCatalogs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@teispace/next-themes'

interface PreferencesData {
  theme: 'light' | 'dark' | 'auto'
  currency: string
  language: string
  emailUpdates: boolean
  dataCollection: boolean
}

export default function PreferencesSection() {
  const { setTheme } = useTheme()
  const { data: profileData, isLoading: isLoadingProfile } = useProfile()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()

  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'auto',
    currency: 'DOP', // Ajustado a la moneda principal del ecosistema
    language: 'es',
    emailUpdates: true,
    dataCollection: false
  })

  // 2. Hidratación de datos cuando llegan de Supabase
  useEffect(() => {
    if (profileData) {
      setPreferences({
        theme: profileData.theme || 'auto',
        currency: profileData.currency || 'DOP',
        language: profileData.language || 'es',
        // Usamos nullish coalescing (??) por si en la BD están guardados como `false`
        emailUpdates: profileData.email_updates ?? true, 
        dataCollection: profileData.data_collection ?? false
      })
    }
  }, [profileData])

  const handlePreferenceChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // 3. Mapeo a snake_case para la base de datos
    const payload = {
      theme: preferences.theme,
      currency_preference: preferences.currency,
      language: preferences.language,
      email_updates: preferences.emailUpdates,
      data_collection: preferences.dataCollection
    }

    updateProfile(payload, {
      onSuccess: () => {
        toast.success('Preferencias guardadas correctamente')
        setTheme(preferences.theme)
      },
      onError: (error) => {
        toast.error(`Error al guardar preferencias: ${error.message}`)
      }
    })
  }

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-card border border-border rounded-[12px] p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Tema Visual</h2>
        <div className="space-y-3">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <label key={theme} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={preferences.theme === theme}
                disabled={isSaving}
                onChange={(e) => handlePreferenceChange('theme', e.target.value as typeof theme)}
                className="w-4 h-4 text-primary bg-surface-2 border-border focus:ring-primary disabled:opacity-50 transition-colors"
              />
              <span className="capitalize text-sm font-medium group-hover:text-primary transition-colors">
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Automático (Sistema)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-[12px] p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Formatos Regionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Idioma de la Interfaz</label>
            <select
              value={preferences.language}
              disabled={isSaving}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-background disabled:opacity-50 disabled:bg-surface-2/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm font-medium cursor-pointer"
            >
              <option value="es">Español (DO)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Moneda Principal</label>
            <select
              value={preferences.currency}
              disabled={isSaving}
              onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-background disabled:opacity-50 disabled:bg-surface-2/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm font-medium cursor-pointer"
            >
              <option value="DOP">DOP (RD$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card border border-border rounded-[12px] p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Privacidad y Notificaciones</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer p-4 border border-border rounded-[8px] hover:bg-surface-2/50 hover:border-primary/30 transition-all group">
            <div>
              <p className="font-bold text-sm text-foreground">Alertas por Correo Electrónico</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recibe resúmenes de tus conciliaciones y avisos de seguridad.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailUpdates}
              disabled={isSaving}
              onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
              className="w-5 h-5 rounded-[4px] text-primary bg-surface-2 border-border focus:ring-primary disabled:opacity-50 transition-colors"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-4 border border-border rounded-[8px] hover:bg-surface-2/50 hover:border-primary/30 transition-all group">
            <div>
              <p className="font-bold text-sm text-foreground">Telemetría Anónima</p>
              <p className="text-xs text-muted-foreground mt-0.5">Comparte diagnósticos de uso para mejorar YBank Engine.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.dataCollection}
              disabled={isSaving}
              onChange={(e) => handlePreferenceChange('dataCollection', e.target.checked)}
              className="w-5 h-5 rounded-[4px] text-primary bg-surface-2 border-border focus:ring-primary disabled:opacity-50 transition-colors"
            />
          </label>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto px-8 py-2.5 bg-foreground text-background rounded-[8px] hover:opacity-90 transition-opacity font-bold text-sm flex justify-center items-center gap-2 active:scale-[0.98]"
        >
          {isSaving ? <><Loader2 size={16} className="animate-spin" /> Actualizando Sistema...</> : 'Guardar Preferencias'}
        </button>
      </div>
      
    </div>
  )
}