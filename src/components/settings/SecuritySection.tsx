'use client'

import { useState } from 'react'

interface SecurityData {
  twoFactorEnabled: boolean
  biometricEnabled: boolean
}

export default function SecuritySection() {
  const [security, setSecurity] = useState<SecurityData>({
    twoFactorEnabled: false,
    biometricEnabled: true
  })

  const handleToggle = (key: keyof SecurityData) => {
    setSecurity(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Contraseña</h2>
        <p className="text-muted-foreground text-sm">
          Cambiar tu contraseña regularmente ayuda a mantener tu cuenta segura
        </p>
        <button className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
          Cambiar Contraseña
        </button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Autenticación de Dos Factores</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Aumenta la seguridad de tu cuenta requiriendo un código adicional
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={security.twoFactorEnabled}
              onChange={() => handleToggle('twoFactorEnabled')}
              className="w-5 h-5"
            />
          </label>
        </div>
        {security.twoFactorEnabled && (
          <div className="pt-3 border-t border-border">
            <p className="text-sm mb-3">Métodos de autenticación disponibles:</p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-left">
                📱 Aplicación Autenticadora
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-left">
                📧 Código por Email
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-left">
                💬 SMS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Biometric */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Autenticación Biométrica</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Usa tu huella dactilar o reconocimiento facial para acceder
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={security.biometricEnabled}
              onChange={() => handleToggle('biometricEnabled')}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Sesiones Activas</h2>
        <p className="text-muted-foreground text-sm">
          Revisa dónde estás conectado y cierra sesiones en otros dispositivos
        </p>
        <div className="space-y-3">
          <div className="p-3 border border-border rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Chrome en Windows</p>
              <p className="text-sm text-muted-foreground">Última actividad: Hace 5 minutos</p>
            </div>
            <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded">Actual</span>
          </div>
          <div className="p-3 border border-border rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Safari en iPhone</p>
              <p className="text-sm text-muted-foreground">Última actividad: Hace 2 horas</p>
            </div>
            <button className="px-3 py-1 text-sm hover:text-muted-foreground transition-colors">Cerrar</button>
          </div>
        </div>
      </div>

      {/* Trusted Devices */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Dispositivos Confiables</h2>
        <p className="text-muted-foreground text-sm">
          Gestiona los dispositivos que no requieren verificación adicional
        </p>
        <button className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
          Ver Dispositivos Confiables
        </button>
      </div>
    </div>
  )
}
