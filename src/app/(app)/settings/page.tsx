'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

export default function SettingsPage() {
  const { session } = useAuthStore();
  const hasView = session.permissions.includes('view_settings');
  const hasEdit = session.permissions.includes('edit_settings');
  const { users, enableUser, disableUser, setOnline, updateUser, deleteUser } = useUserStore();

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

        {/* Account Management Table */}
        <div className="ip-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ip-text">Account Management</h2>
            <div className="flex gap-2">
              <span className="text-xs text-ip-text-muted px-3 py-1 bg-ip-bg rounded-full flex items-center">
                Editable Store
              </span>
              {hasEdit && (
                <button
                  onClick={() => alert('Mock: Add new user dialog would appear here')}
                  className="px-3 py-1 bg-ip-primary hover:bg-ip-primary/90 text-white text-xs font-semibold rounded transition-colors"
                >
                  + Add User
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto border border-ip-border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-ip-bg/50 border-b border-ip-border text-ip-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Group</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Online</th>
                  {hasEdit && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-ip-border last:border-0 hover:bg-ip-surface-hover">
                    <td className="px-4 py-3 font-mono text-xs">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-ip-text">{u.user_name}</td>
                    <td className="px-4 py-3 text-ip-text-secondary">{u.email}</td>
                    <td className="px-4 py-3"><span className="text-xs font-mono bg-ip-bg px-2 py-1 rounded">{u.group}</span></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (!hasEdit) return;
                          if (u.is_enable) {
                            if (confirm(`Disable user ${u.user_name}?`)) disableUser(u.id);
                          } else {
                            if (confirm(`Enable user ${u.user_name}?`)) enableUser(u.id);
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_enable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'} ${hasEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        title={hasEdit ? "Click to toggle" : ""}
                      >
                        {u.is_enable ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_online ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    {hasEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {u.is_online && (
                            <button onClick={() => { if(confirm(`Revoke session for ${u.user_name}?`)) setOnline(u.id, false); }} className="text-ip-warning hover:text-ip-warning/80">Revoke</button>
                          )}
                          <button
                            onClick={() => {
                              if (session.user?.group === 'admins' || session.user?.id === u.id) {
                                const newPassword = prompt(`Enter new password for ${u.user_name}:`, u.password);
                                if (newPassword && newPassword !== u.password) updateUser(u.id, { password: newPassword });
                              } else {
                                alert("You can only edit your own password.");
                              }
                              if (session.user?.id === u.id) {
                                const newEmail = prompt(`Enter new email for ${u.user_name}:`, u.email);
                                if (newEmail && newEmail !== u.email) updateUser(u.id, { email: newEmail });
                              }
                            }}
                            className="text-ip-primary hover:text-ip-primary/80"
                          >
                            Edit
                          </button>
                          <button onClick={() => { if(confirm(`Delete user ${u.user_name}?`)) deleteUser(u.id); }} className="text-red-500 hover:text-red-600">Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
