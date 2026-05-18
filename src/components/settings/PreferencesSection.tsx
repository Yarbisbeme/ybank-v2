'use client'

import { useState } from 'react'

interface PreferencesData {
  theme: 'light' | 'dark' | 'auto'
  currency: string
  language: string
  emailUpdates: boolean
  dataCollection: boolean
}

export default function PreferencesSection() {
  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'auto',
    currency: 'EUR',
    language: 'es',
    emailUpdates: true,
    dataCollection: false
  })

  const handlePreferenceChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    console.log('Preferences saved:', preferences)
  }

  return (
    <div className="space-y-6">
      {/* Theme Preference */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Tema</h2>
        <div className="space-y-3">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <label key={theme} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={preferences.theme === theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value as typeof theme)}
                className="w-4 h-4"
              />
              <span className="capitalize">
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Automático'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Language & Currency */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Regional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Idioma</label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Moneda</label>
            <select
              value={preferences.currency}
              onChange={(e) => handlePreferenceChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Datos y Privacidad</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Actualizaciones por Email</p>
              <p className="text-sm text-muted-foreground">Recibe novedades sobre tu cuenta</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailUpdates}
              onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Recolección de Datos Anónimos</p>
              <p className="text-sm text-muted-foreground">Ayúdanos a mejorar compartiendo datos anónimos</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.dataCollection}
              onChange={(e) => handlePreferenceChange('dataCollection', e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
      >
        Guardar Preferencias
      </button>
    </div>
  )
}
