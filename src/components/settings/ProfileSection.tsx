'use client'

import { useState } from 'react'

interface ProfileData {
  fullName: string
  email: string
  phone: string
  bio: string
}

export default function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    fullName: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+34 600 123 456',
    bio: 'Usuario de yBank'
  })

  const [formData, setFormData] = useState(profile)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Información de Perfil</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre Completo</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Biografía</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Guardar Cambios
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Foto de Perfil</h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            JP
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Carga una foto para personalizar tu perfil
            </p>
            <button className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
              Cambiar Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

