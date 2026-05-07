'use client';

import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const { session } = useAuthStore();
  const hasView = session.permissions.includes('view_settings');

  if (!hasView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ip-text mb-2">Access Denied</h2>
          <p className="text-sm text-ip-text-secondary">You do not have permission to view settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ip-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ip-text">Settings</h1>
        <p className="text-sm text-ip-text-secondary mt-1">System configuration and account management</p>
      </div>

      <div className="grid gap-6">
        {/* Notifications Section */}
        <div className="ip-card p-6">
          <h2 className="text-lg font-semibold text-ip-text mb-4">Notifications</h2>
          <div className="space-y-4">
            <SettingRow label="Enable Notifications" sublabel="Master toggle for all notification channels" defaultOn={true} />
            <SettingRow label="In-App Push Notifications" sublabel="Receive push notifications within the app" defaultOn={true} />
            <SettingRow label="Email Notifications" sublabel="Receive event notifications via email" defaultOn={false} />
          </div>
        </div>

        {/* Language & Theme */}
        <div className="ip-card p-6">
          <h2 className="text-lg font-semibold text-ip-text mb-4">Language & Theme</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-ip-text-secondary block mb-2">Language</span>
              <div className="flex gap-3">
                <RadioPill label="English" checked={session.user?.language === 'English'} />
                <RadioPill label="Vietnamese" checked={session.user?.language === 'Vietnamese'} />
              </div>
            </div>
            <div>
              <span className="text-sm text-ip-text-secondary block mb-2">Theme</span>
              <div className="flex gap-3">
                <RadioPill label="Light" checked={session.user?.theme === 'Light'} />
                <RadioPill label="Dark" checked={session.user?.theme === 'Dark'} />
                <RadioPill label="System" checked={session.user?.theme === 'System'} />
              </div>
            </div>
          </div>
        </div>

        {/* Account Management Placeholder */}
        <div className="ip-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ip-text">Account Management</h2>
            <span className="text-xs text-ip-text-muted px-3 py-1 bg-ip-bg rounded-full">Phase 5</span>
          </div>
          <p className="text-sm text-ip-text-secondary">
            User account table and management actions will be implemented in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, sublabel, defaultOn }: { label: string; sublabel: string; defaultOn: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-ip-text">{label}</p>
        <p className="text-xs text-ip-text-muted">{sublabel}</p>
      </div>
      <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${defaultOn ? 'bg-ip-primary' : 'bg-ip-border'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${defaultOn ? 'left-5.5' : 'left-0.5'}`} />
      </div>
    </div>
  );
}

function RadioPill({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <span className={`text-xs font-medium px-4 py-2 rounded-full border cursor-pointer transition-all ${
      checked ? 'bg-ip-primary text-white border-ip-primary' : 'bg-ip-surface text-ip-text-secondary border-ip-border hover:border-ip-primary/50'
    }`}>
      {label}
    </span>
  );
}
