'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DASHBOARD_DB } from '@/data/mock-dashboards';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export default function DashboardPage() {
  const { session } = useAuthStore();
  const hasView = session.permissions.includes('view_dashboard');
  const hasEdit = session.permissions.includes('edit_dashboard');

  const [selectedDashboardId, setSelectedDashboardId] = useState(
    session.user?.pinned_dashboard_id || DASHBOARD_DB[0]?.id
  );
  const [isEditing, setIsEditing] = useState(false);

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

  const currentDashboard = DASHBOARD_DB.find((d) => d.id === selectedDashboardId) || DASHBOARD_DB[0];

  return (
    <div className="ip-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Dashboard</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            Welcome back, {session.user?.display_name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="ip-input py-2 text-sm max-w-[200px]"
            value={selectedDashboardId}
            onChange={(e) => setSelectedDashboardId(Number(e.target.value))}
          >
            {DASHBOARD_DB.filter(d => d.is_enable).map((d) => (
              <option key={d.id} value={d.id}>{d.display_name}</option>
            ))}
          </select>

          {hasEdit && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                isEditing 
                ? 'bg-ip-primary text-white border-ip-primary' 
                : 'bg-ip-bg text-ip-text border-ip-border hover:bg-ip-card'
              }`}
            >
              {isEditing ? 'Done Editing' : 'Edit Layout'}
            </button>
          )}
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

      {/* Dashboard Widget Grid */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-ip-text">
            {currentDashboard.display_name}
          </h2>
          {isEditing && (
            <span className="text-xs bg-ip-warning/10 text-ip-warning px-2 py-1 rounded-full animate-pulse">
              Edit Mode Active
            </span>
          )}
        </div>
        
        <div className="-mx-4 sm:mx-0">
          <DashboardGrid 
            dashboard={currentDashboard} 
            isEditing={isEditing} 
            onLayoutChange={(layout) => {
              if (isEditing) {
                console.log('Layout changed:', layout);
                // In a real app, save to backend or global store here
              }
            }}
          />
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
