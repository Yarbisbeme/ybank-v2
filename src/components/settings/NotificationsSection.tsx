'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Switch } from '../filters/Switch'

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

  const sectionClasses = "bg-card border border-border p-6 rounded-[12px] space-y-4"
  const headerClasses = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4"

  return (
    <div className="space-y-6">
      
      {/* 1. Transacciones */}
      <div className={sectionClasses}>
        <h2 className={headerClasses}>Notificaciones de Transacciones</h2>
        <div className="space-y-2">
          <NotificationRow 
            label="Todas las Transacciones" 
            sub="Recibe una notificación inmediata por cada movimiento."
            checked={notifications.transactions}
            onChange={() => handleToggle('transactions')}
          />
          <NotificationRow 
            label="Transferencias Grandes" 
            sub="Solo para montos mayores a $1,000 USD."
            checked={notifications.transfers}
            onChange={() => handleToggle('transfers')}
          />
        </div>
      </div>

      {/* 2. Seguridad */}
      <div className={sectionClasses}>
        <h2 className={headerClasses}>Alertas de Seguridad</h2>
        <NotificationRow 
          label="Cambios de Seguridad" 
          sub="Cambios de contraseña, nuevos dispositivos y accesos."
          checked={notifications.security}
          onChange={() => handleToggle('security')}
          disabled
        />
      </div>

      {/* 3. Reportes */}
      <div className={sectionClasses}>
        <h2 className={headerClasses}>Marketing y Reportes</h2>
        <div className="space-y-2">
          <NotificationRow label="Ofertas y Promociones" disabled checked={notifications.promotions} onChange={() => handleToggle('promotions')} />
          <NotificationRow label="Reporte Semanal" checked={notifications.weeklyReport} onChange={() => handleToggle('weeklyReport')} />
          <NotificationRow label="Reporte Mensual" checked={notifications.monthlyReport} onChange={() => handleToggle('monthlyReport')} />
        </div>
      </div>

      {/* 4. Canales */}
      <div className={sectionClasses}>
        <h2 className={headerClasses}>Canales de Notificación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChannelCard label="Email" active />
          <ChannelCard label="Push" active />
          <ChannelCard label="SMS" />
        </div>
      </div>

      <button
        onClick={() => console.log('Saved:', notifications)}
        className="w-full md:w-auto px-8 py-4 bg-blue-600 text-background rounded-[8px] font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Guardar Preferencias
      </button>
    </div>
  )
}

// Sub-componentes para mantener el código limpio
function NotificationRow({ label, sub, checked, onChange, disabled }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-2 rounded-[8px] border border-border/50 gap-4">
      {/* 💡 FIX: Usamos flex-1 y min-w-0 para que el texto NO empuje el switch */}
      <div className="flex-1 min-w-0"> 
        <p className="text-[13px] font-bold text-foreground truncate">{label}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate leading-tight">
            {sub}
          </p>
        )}
      </div>
      
      {/* 💡 FIX: Usamos shrink-0 para asegurar que el switch nunca cambie su tamaño */}
      <div className="shrink-0">
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}

function ChannelCard({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <div className={cn(
      "p-4 border rounded-[8px] flex items-center gap-3 transition-colors",
      active ? "border-primary bg-primary/5" : "border-border bg-surface-2"
    )}>
      <div className={cn("w-4 h-4 rounded-full border-2", active ? "bg-primary border-primary" : "border-muted-foreground")} />
      <span className="text-[12px] font-bold text-foreground">{label}</span>
    </div>
  )
}