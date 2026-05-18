'use client'

import { useState } from 'react'

interface NotificationsData {
  transactions: boolean
  transfers: boolean
  security: boolean
  promotions: boolean
  weeklyReport: boolean
  monthlyReport: boolean
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<NotificationsData>({
    transactions: true,
    transfers: true,
    security: true,
    promotions: false,
    weeklyReport: true,
    monthlyReport: true
  })

  const handleToggle = (key: keyof NotificationsData) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    console.log('Notification preferences saved:', notifications)
  }

  return (
    <div className="space-y-6">
      {/* Transaction Notifications */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Notificaciones de Transacciones</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Todas las Transacciones</p>
              <p className="text-sm text-muted-foreground">Recibe una notificación para cada transacción</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.transactions}
              onChange={() => handleToggle('transactions')}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Transferencias Grandes</p>
              <p className="text-sm text-muted-foreground">Solo para transacciones mayores a €1,000</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.transfers}
              onChange={() => handleToggle('transfers')}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Security Notifications */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Alertas de Seguridad</h2>
        <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
          <div>
            <p className="font-medium">Cambios de Seguridad</p>
            <p className="text-sm text-muted-foreground">Cambios de contraseña, nuevos dispositivos, etc.</p>
          </div>
          <input
            type="checkbox"
            checked={notifications.security}
            onChange={() => handleToggle('security')}
            className="w-5 h-5"
            disabled
          />
        </label>
      </div>

      {/* Marketing & Reports */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Marketing y Reportes</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Ofertas y Promociones</p>
              <p className="text-sm text-muted-foreground">Recibe información sobre ofertas especiales</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.promotions}
              onChange={() => handleToggle('promotions')}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Reporte Semanal</p>
              <p className="text-sm text-muted-foreground">Resumen de tu actividad cada semana</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyReport}
              onChange={() => handleToggle('weeklyReport')}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="font-medium">Reporte Mensual</p>
              <p className="text-sm text-muted-foreground">Análisis completo de tu mes</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.monthlyReport}
              onChange={() => handleToggle('monthlyReport')}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Canales de Notificación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-medium">📧 Email</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-medium">🔔 Push</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <input type="checkbox" className="w-5 h-5" />
            <span className="font-medium">💬 SMS</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
      >
        Guardar Preferencias de Notificaciones
      </button>
    </div>
  )
}
