'use client'

import { useState } from 'react'
import SettingsHeader from '@/components/settings/SettingsHeader'
import ProfileSection from '@/components/settings/ProfileSection'
import PreferencesSection from '@/components/settings/PreferencesSection'
import SecuritySection from '@/components/settings/SecuritySection'
import NotificationsSection from '@/components/settings/NotificationsSection'

type SettingsTab = 'profile' | 'preferences' | 'security' | 'notifications'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'profile', label: 'Perfil' },
    { id: 'preferences', label: 'Preferencias' },
    { id: 'security', label: 'Seguridad' },
    { id: 'notifications', label: 'Notificaciones' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SettingsHeader />
      
      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'preferences' && <PreferencesSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'notifications' && <NotificationsSection />}
      </div>
    </div>
  )
}