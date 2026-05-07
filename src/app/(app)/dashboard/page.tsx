'use client';

import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const { session } = useAuthStore();
  const hasView = session.permissions.includes('view_dashboard');

  if (!hasView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-ip-text mb-2">Access Denied</h2>
          <p className="text-sm text-ip-text-secondary">
            You do not have permission to view dashboards. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ip-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Dashboard</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            Welcome back, {session.user?.display_name}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Parks"
          value="4"
          sublabel="3 operating"
          color="var(--ip-primary)"
        />
        <StatCard
          label="Active Staff"
          value="4"
          sublabel="of 6 total"
          color="var(--ip-success)"
        />
        <StatCard
          label="Events Today"
          value="10"
          sublabel="3 unacknowledged"
          color="var(--ip-warning)"
        />
        <StatCard
          label="System Status"
          value="Online"
          sublabel="All systems operational"
          color="var(--ip-accent)"
        />
      </div>

      {/* Dashboard Widget Placeholder Grid */}
      <div className="ip-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ip-text">
            Widget Grid
          </h2>
          <span className="text-xs text-ip-text-muted px-3 py-1 bg-ip-bg rounded-full">
            Phase 3 — Widget Engine
          </span>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`ip-widget p-4 flex items-center justify-center text-ip-text-muted text-sm ${
                i <= 2 ? 'col-span-3 h-40' : 'col-span-2 h-32'
              }`}
            >
              Widget Slot {i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="ip-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: color }}
          />
        </div>
        <span className="text-sm text-ip-text-secondary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-ip-text">{value}</p>
      <p className="text-xs text-ip-text-muted mt-1">{sublabel}</p>
    </div>
  );
}
