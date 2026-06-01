'use client'

import { useState, useEffect, useRef } from 'react'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useCatalogs'
import { Loader2, Camera, User } from 'lucide-react'
import { toast } from 'sonner'
import { useYBankStore } from '@/store/useYBankStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CurrencyCode } from '@/types'
import { useTheme } from '@teispace/next-themes'
import SearchableDropdown from '../ui/SearchableDropdown'
import { values } from 'idb-keyval'

interface PreferencesData {
  theme: 'light' | 'dark' | 'auto'
  currency: CurrencyCode
  language: string
  dataCollection: boolean
  avatarUrl: string | null
}

export default function PreferencesSection() {
  const { setTheme } = useTheme()
  const { setCurrency } = useYBankStore() 
  const { data: profileData, isLoading: isLoadingProfile } = useProfile()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()
  const { mutateAsync: uploadAvatar } = useUploadAvatar()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bio: ''
  })

  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'auto',
    currency: 'DOP',
    language: 'es',
    dataCollection: false,
    avatarUrl: null
  })

    useEffect(() => {
    if (profileData) {
      setPreferences({
        theme: profileData.theme || profileData.theme_preference || 'auto',
        currency: profileData.currency_preference || 'DOP',
        language: profileData.language || 'es',
        dataCollection: profileData.data_collection ?? false,
        avatarUrl: profileData.avatar_url || null 
      })
      
      // 💡 Sincronizar el estado del formulario de texto con la BD
      setFormData({
        fullName: profileData.full_name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || ''
      })
    }
  }, [profileData])

  const handlePreferenceChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    if (key === 'theme') {
      setTheme(value)
    }
  }

  // 💡 2. HANDLERS PARA EL FORMULARIO DE TEXTO
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profileData) {
      // Revertir a los datos originales si el usuario cancela
      setFormData({
        fullName: profileData.full_name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || ''
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file || !profileData?.id) return

    if (!file.type.startsWith('image/')) {
      return toast.error('Por favor, selecciona una imagen válida.')
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('La imagen no debe superar los 2MB.')
    }

    const previewUrl = URL.createObjectURL(file)
    handlePreferenceChange('avatarUrl', previewUrl)
    
    setIsUploading(true)

    try {
      const response = await uploadAvatar({ 
        file: file, 
        userId: profileData.id 
      })
      
      handlePreferenceChange('avatarUrl', response.url)
      toast.success('Imagen lista. ¡Recuerda guardar tus preferencias!')

    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la imagen.')
      handlePreferenceChange('avatarUrl', profileData?.avatar_url || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = () => {
    // 💡 3. UNIFICACIÓN DE PAYLOAD: Enviamos las preferencias y los datos de texto juntos
    const payload = {
      theme: preferences.theme,
      theme_preference: preferences.theme,
      currency_preference: preferences.currency,
      language: preferences.language,
      data_collection: preferences.dataCollection,
      avatar_url: preferences.avatarUrl,
      full_name: formData.fullName,
      phone: formData.phone,
      bio: formData.bio
    }

    updateProfile(payload, {
      onSuccess: () => {
        setCurrency(preferences.currency) 
        setTheme(preferences.theme)
        setIsEditing(false) // Cerramos el modo edición al guardar con éxito
        toast.success('Perfil y preferencias actualizados')
      },
      onError: (error) => toast.error(`Error al guardar: ${error.message}`)
    })
  }

  // Tu contenedor estilizado
  const CardContainer = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="bg-card border border-border rounded-[12px] p-6 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">{title}</h2>
      {children}
    </div>
  )

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* 1. PERFIL GENERAL (Avatar) */}
      <CardContainer title="Perfil General">
        <div className="flex items-center gap-6">
          <div className="relative group shrink-0">
            <div 
              className={cn(
                "w-24 h-24 rounded-full border border-border bg-surface-2 overflow-hidden flex items-center justify-center transition-all",
                isUploading ? "opacity-50" : "group-hover:border-primary cursor-pointer"
              )}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {preferences.avatarUrl ? (
                <img 
                  src={preferences.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-muted-foreground opacity-50" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />
          </div>

          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-foreground">
              {formData.fullName || profileData?.full_name || 'Usuario'}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {profileData?.email || 'Tu cuenta está activa'}
            </p>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 self-start transition-colors"
            >
              Cambiar Fotografía
            </button>
          </div>
        </div>
      </CardContainer>

      {/* 2. INFORMACIÓN DE PERFIL (Ahora usando tu CardContainer estilizado) */}
      <CardContainer title="Información Personal">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nombre Completo</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing || isSaving}
                className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-background disabled:opacity-50 disabled:bg-surface-2/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing || isSaving}
                className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-background disabled:opacity-50 disabled:bg-surface-2/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Biografía</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing || isSaving}
              rows={3}
              placeholder="Escribe algo sobre ti..."
              className="w-full px-3 py-2.5 border border-border rounded-[8px] bg-background disabled:opacity-50 disabled:bg-surface-2/50 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm font-medium resize-none"
            />
          </div>
        </div>

        {/* Controles de edición para esta sección */}
        <div className="mt-6">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-6 py-2.5 bg-surface-2 border border-border rounded-[8px] hover:border-primary/50 transition-all text-[11px] font-black uppercase tracking-[0.1em] shadow-sm"
            >
              Editar Datos
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-8 py-2.5 bg-foreground text-background rounded-[8px] hover:opacity-90 transition-opacity font-bold text-sm flex justify-center items-center gap-2 active:scale-[0.98]"
              >
                {isSaving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Confirmar Cambios'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-8 py-2.5 border border-border rounded-[8px] hover:bg-surface-2 transition-colors font-bold text-sm text-muted-foreground hover:text-foreground active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </CardContainer>

      {/* 3. TEMA VISUAL */}
      <CardContainer title="Tema Visual">
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'auto'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handlePreferenceChange('theme', t)}
              disabled={isSaving || isUploading}
              className={cn(
                "p-4 rounded-[8px] border-2 text-center transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-50",
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

      {/* 4. REGIONALES CON EL NUEVO DROPDOWN */}
      <CardContainer title="Formatos Regionales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Selector de Idioma */}
          <div className={cn(
            "w-full bg-surface-2 border border-border px-3 py-2 rounded-[8px] transition-colors focus-within:border-primary/50",
            (isSaving || isUploading) && "opacity-50 pointer-events-none"
          )}>
            <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              Idioma
            </label>
            <SearchableDropdown
              options={[
                { id: 'es', label: 'Español (DO)', subLabel: 'República Dominicana' },
                { id: 'en', label: 'English (US)', subLabel: 'Estados Unidos' }
              ]}
              value={preferences.language}
              onChange={(val) => handlePreferenceChange('language', val)}
              placeholder="Buscar idioma..."
              disabled={isSaving || isUploading}
            />
          </div>

          {/* Selector de Moneda */}
          <div className={cn(
            "w-full bg-surface-2 border border-border px-3 py-2 rounded-[8px] transition-colors focus-within:border-primary/50",
            (isSaving || isUploading) && "opacity-50 pointer-events-none"
          )}>
            <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              Moneda Principal
            </label>
            <SearchableDropdown
              options={[
                { id: 'DOP', label: 'DOP (RD$)', subLabel: 'Peso Dominicano' },
                { id: 'USD', label: 'USD ($)', subLabel: 'Dólar Estadounidense' }
              ]}
              value={preferences.currency}
              onChange={(val) => handlePreferenceChange('currency', val as CurrencyCode)}
              placeholder="Buscar moneda..."
              disabled={isSaving || isUploading}
            />
          </div>

        </div>
      </CardContainer>

      {/* 5. PRIVACIDAD */}
      <CardContainer title="Privacidad">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Telemetría Anónima</p>
            <p className="text-[11px] text-muted-foreground">Ayúdanos a mejorar YBank Engine.</p>
          </div>
          <div 
             onClick={() => !isSaving && !isUploading && handlePreferenceChange('dataCollection', !preferences.dataCollection)}
             className={cn(
               "w-12 h-6 rounded-full p-1 transition-colors", 
               (isSaving || isUploading) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
               preferences.dataCollection ? "bg-primary" : "bg-border"
             )}
          >
            <motion.div 
              animate={{ x: preferences.dataCollection ? 24 : 0 }} 
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4 h-4 bg-white rounded-full shadow-sm" 
            />
          </div>
        </div>
      </CardContainer>

      {/* BOTÓN GENERAL DE GUARDADO (Para preferencias globales) */}
      {/* Lo ocultamos si isEditing es true para evitar confusión visual con el botón de "Confirmar Cambios" de arriba */}
      {!isEditing && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="w-full md:w-auto px-10 py-3 bg-foreground text-background rounded-[8px] font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Aplicando...
            </>
          ) : (
            'Guardar Preferencias'
          )}
        </motion.button>
      )}
    </div>
  )
}