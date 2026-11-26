'use client';

import PreferencesSection from '@/components/settings/PreferencesSection';
import SettingsHeader from '@/components/settings/SettingsHeader';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <SettingsHeader />
      <PreferencesSection />
    </div>
  );
}
