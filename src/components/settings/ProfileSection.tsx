'use client'

import { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useCatalogs' // Tus hooks de conexión
import { Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  fullName: string
  phone: string
  bio: string
}

export default function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false)
  
  // 1. Traemos los datos reales del backend
  const { data: profileData, isLoading: isLoadingProfile } = useProfile()
  
  // 2. Traemos el motor de guardado
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()

  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    phone: '',
    bio: ''
  })

  // 3. Hidratamos el formulario cuando los datos reales lleguen de Supabase
  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.full_name || profileData.name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || ''
      })
    }
  }, [profileData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // 4. Mapeamos la data para el backend (snake_case si es necesario) y disparamos la mutación
    const payload = {
      full_name: formData.fullName,
      phone: formData.phone,
      bio: formData.bio
    }

    updateProfile(payload, {
      onSuccess: () => {
        toast.success('Perfil actualizado correctamente')
        setIsEditing(false)
      },
      onError: (error) => {
        toast.error(`Error al guardar: ${error.message}`)
      }
    })
  }

  const handleCancel = () => {
    // Restauramos a los últimos datos seguros conocidos
    if (profileData) {
      setFormData({
        fullName: profileData.full_name || profileData.name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || ''
      })
    }
    setIsEditing(false)
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
      <div className="bg-card border border-border rounded-[12px] p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Información de Perfil</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-border rounded-[8px] hover:bg-surface-2 transition-colors text-sm font-bold shadow-sm"
            >
              Editar Datos
            </button>
          )}
        </div>

        <div className="space-y-4">
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

        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-foreground text-background rounded-[8px] hover:opacity-90 transition-opacity font-bold text-sm flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : 'Guardar Cambios'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-border rounded-[8px] hover:bg-surface-2 transition-colors font-bold text-sm text-muted-foreground hover:text-foreground active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="bg-card border border-border rounded-[12px] p-6 space-y-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[12px] bg-surface-2 border border-border flex items-center justify-center text-primary text-xl font-black overflow-hidden shrink-0">
            {profileData?.avatar_url ? (
               <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <User size={24} />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight">Foto de Perfil</h2>
            <p className="text-xs text-muted-foreground font-medium">
              Formatos soportados: JPG, PNG o GIF. Máximo 2MB.
            </p>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-surface-2 border border-border rounded-[8px] hover:border-primary/50 transition-colors text-xs font-bold shadow-sm whitespace-nowrap">
          Actualizar Foto
        </button>
      </div>
    </div>
  )
}