'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import SettingsHeader from '@/components/settings/SettingsHeader'
import PreferencesSection from '@/components/settings/PreferencesSection'
import SecuritySection from '@/components/settings/SecuritySection'
import NotificationsSection from '@/components/settings/NotificationsSection'
import { SettingsTab } from '@/types'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences')

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'preferences', label: 'Preferencias' },
    /** 
    { id: 'security', label: 'Seguridad' },
    { id: 'notifications', label: 'Notificaciones' }
     */
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 py-8 space-y-8">
      <SettingsHeader />
      
      {/* Tab Navigation - Responsiva con Scroll Fluido */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-6 md:gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-1 py-3 font-medium text-sm transition-colors relative whitespace-nowrap shrink-0",
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="settings-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
        
        {/* 💡 TRUCO: Añadimos un pequeño padding extra al final del contenedor */}
        <div className="shrink-0 w-2" />
      </div>

      {/* Tab Content (Animated Switcher) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'preferences' && <PreferencesSection />}
          {/** 
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'notifications' && <NotificationsSection />}
          */}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}