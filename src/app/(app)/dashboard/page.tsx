'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { WidgetLibrary } from '@/components/dashboard/WidgetLibrary';
import { useDashboardStore } from '@/stores/dashboard-store';
import { AppDialog } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { useParkStore } from '@/stores/park-store';
import { useStaffStore } from '@/stores/staff-store';
import { useSystemStateStore } from '@/stores/system-state-store';
import { useUserStore } from '@/stores/user-store';
import { dateKey, sameDay } from '@/lib/ipark-utils';
import { useTranslation } from '@/lib/i18n';
import { Pin, Plus, Trash2, PencilLine, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const { session } = useAuthStore();
  const dashboards = useDashboardStore((state) => state.dashboards);
  const addDashboard = useDashboardStore((state) => state.addDashboard);
  const deleteDashboard = useDashboardStore((state) => state.deleteDashboard);
  const updateDashboard = useDashboardStore((state) => state.updateDashboard);
  const updateWidgetLayout = useDashboardStore((state) => state.updateWidgetLayout);
  const parks = useParkStore((state) => state.parks);
  const staffs = useStaffStore((state) => state.staffs);
  const events = useEventHistoryStore((state) => state.events);
  const globalState = useSystemStateStore((state) => state.getGlobalState());
  const users = useUserStore((state) => state.users);
  const updateUser = useUserStore((state) => state.updateUser);
  const { t } = useTranslation();
  const hasView = session.permissions.includes('view_dashboard');
  const hasEdit = session.permissions.includes('edit_dashboard');
  const hasAdd = session.permissions.includes('add_dashboard');
  const hasDelete = session.permissions.includes('delete_dashboard');

  const enabledDashboards = useMemo(
    () => dashboards.filter((dashboard) => dashboard.is_enable),
    [dashboards]
  );
  const activeUser = users.find((user) => user.id === session.user?.id);

  const [selectedDashboardId, setSelectedDashboardId] = useState(
    activeUser?.pinned_dashboard_id || enabledDashboards[0]?.id
  );
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dashboardForm, setDashboardForm] = useState({
    dashboard_name: '',
    display_name: '',
    description: '',
  });
  const [dialogError, setDialogError] = useState('');

  useEffect(() => {
    if (!enabledDashboards.length) {
      return;
    }

    const selectedStillExists = enabledDashboards.some(
      (dashboard) => dashboard.id === selectedDashboardId
    );

    if (!selectedStillExists) {
      setSelectedDashboardId(activeUser?.pinned_dashboard_id || enabledDashboards[0].id);
    }
  }, [activeUser?.pinned_dashboard_id, enabledDashboards, selectedDashboardId]);

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
          <h2 className="text-lg font-bold text-ip-text mb-2">{t('access_denied')}</h2>
          <p className="text-sm text-ip-text-secondary">
            {t('no_permission_view')}
          </p>
        </div>
      </div>
    );
  }

  const currentDashboard =
    enabledDashboards.find((dashboard) => dashboard.id === selectedDashboardId) ||
    enabledDashboards[0];

  const operatingParks = parks.filter((park) => park.is_operating).length;
  const enabledStaff = staffs.filter((staff) => staff.is_enable);
  const activeStaff = enabledStaff.filter((staff) => staff.is_on_shift).length;
  const todayEvents = events.filter((event) => sameDay(event.received_time, dateKey())).length;
  const unacknowledgedTodayEvents = events.filter(
    (event) => sameDay(event.received_time, dateKey()) && !event.is_acknowledged
  ).length;
  const systemStatus = globalState?.emergency_mode
    ? { 
        value: 'emergency', 
        detail: t('emergency_mode_enabled_desc'), 
        color: 'var(--ip-error)' 
      }
    : globalState?.maintenance_mode
      ? { 
          value: 'maintenance', 
          detail: t('maintenance_mode_enabled_desc'), 
          color: 'var(--ip-warning)' 
        }
      : {
          value: 'online',
          detail: t('parks_connected_desc').replace('{count}', String(operatingParks)),
          color: 'var(--ip-accent)',
        };

  const handlePinToggle = () => {
    if (!session.user || !currentDashboard) {
      return;
    }

    const fallbackDashboardId = enabledDashboards.find(
      (dashboard) => dashboard.id !== currentDashboard.id
    )?.id;
    const isPinned = activeUser?.pinned_dashboard_id === currentDashboard.id;

    if (isPinned && fallbackDashboardId) {
      updateUser(session.user.id, { pinned_dashboard_id: fallbackDashboardId });
      return;
    }

    updateUser(session.user.id, { pinned_dashboard_id: currentDashboard.id });
  };

  const openAddDialog = () => {
    const nextNameBase = `dashboard_${enabledDashboards.length + 1}`;
    setDashboardForm({
      dashboard_name: nextNameBase,
      display_name: `Dashboard ${enabledDashboards.length + 1}`,
      description: currentDashboard
        ? `Cloned from ${currentDashboard.display_name}`
        : 'New iPark dashboard',
    });
    setDialogError('');
    setShowAddDialog(true);
  };

  const handleAddDashboard = () => {
    const result = addDashboard({
      dashboard_name: dashboardForm.dashboard_name,
      display_name: dashboardForm.display_name,
      description: dashboardForm.description,
      widgets_list: currentDashboard?.widgets_list.map((widget) => ({ ...widget })) ?? [],
      is_enable: true,
    });

    if (!result.ok || !result.value) {
      setDialogError(result.error || 'Unable to create dashboard.');
      return;
    }

    setSelectedDashboardId(result.value.id);
    setShowAddDialog(false);
    setIsEditing(false);
  };

  const handleDeleteDashboard = () => {
    if (!currentDashboard) {
      return;
    }

    const result = deleteDashboard(currentDashboard.id);
    if (!result.ok) {
      setDialogError(result.error || 'Unable to delete dashboard.');
      return;
    }

    const nextDashboard = enabledDashboards.find(
      (dashboard) => dashboard.id !== currentDashboard.id
    );
    if (nextDashboard) {
      setSelectedDashboardId(nextDashboard.id);
    }
    setShowDeleteDialog(false);
    setIsEditing(false);
  };

  const handleClearAllWidgets = () => {
    if (!currentDashboard) return;
    updateDashboard(currentDashboard.id, { widgets_list: [] });
    setShowClearConfirm(false);
  };

  const handleRefreshData = () => {
    useParkStore.getState().refreshData();
    useStaffStore.getState().refreshData();
    useEventHistoryStore.getState().refreshData();
    
    // Using simple alert for now as there is no Toast system mentioned, 
    // but the task says 'Make sure all new UI elements has translation correctly'
    // I will use the t('data_refreshed') in a simple way.
    console.log(t('data_refreshed'));
  };

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ip-text mb-2">No Dashboard Available</h2>
          <p className="text-sm text-ip-text-secondary">
            Enable or create a dashboard to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ip-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">{t('dashboard')}</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            {t('welcome_back').replace('{name}', session.user?.display_name || '')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="ip-input py-2 text-sm max-w-[200px]"
            value={selectedDashboardId}
            onChange={(e) => setSelectedDashboardId(Number(e.target.value))}
          >
            {enabledDashboards.map((dashboard) => (
              <option key={dashboard.id} value={dashboard.id}>
                {dashboard.display_name}
              </option>
            ))}
          </select>

          <button
            onClick={handlePinToggle}
            className={`ip-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors border ${
              activeUser?.pinned_dashboard_id === currentDashboard.id
                ? 'bg-ip-accent/10 text-ip-accent border-ip-accent/30'
                : 'bg-ip-surface text-ip-text-secondary border-ip-border hover:bg-ip-surface-hover hover:text-ip-text'
            }`}
          >
            <Pin size={16} className={activeUser?.pinned_dashboard_id === currentDashboard.id ? 'fill-current' : ''} />
            {activeUser?.pinned_dashboard_id === currentDashboard.id ? t('unpin') : t('pin')}
          </button>

          {hasAdd && (
            <button
              onClick={openAddDialog}
              disabled={isEditing}
              className="ip-btn flex items-center gap-2 rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {t('add')}
            </button>
          )}

          {hasDelete && enabledDashboards.length > 1 && (
            <button
              onClick={() => {
                setDialogError('');
                setShowDeleteDialog(true);
              }}
              disabled={isEditing}
              className="ip-btn flex items-center gap-2 rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              {t('delete')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('total_parks')}
          value={String(parks.length)}
          sublabel={`${operatingParks} ${t('operating_lc')}`}
          color="var(--ip-primary)"
        />
        <StatCard
          label={t('active_staff')}
          value={String(activeStaff)}
          sublabel={`${t('of')} ${enabledStaff.length} ${t('enabled')}`}
          color="var(--ip-success)"
        />
        <StatCard
          label={t('events_today')}
          value={String(todayEvents)}
          sublabel={`${unacknowledgedTodayEvents} ${t('unacknowledged')}`}
          color="var(--ip-warning)"
        />
        <StatCard
          label={t('system_status')}
          value={t(systemStatus.value as any)}
          sublabel={systemStatus.detail}
          color={systemStatus.color}
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-ip-text">
              {currentDashboard.display_name}
            </h2>
            <button
              type="button"
              className="rounded-lg p-1.5 text-ip-text-secondary hover:bg-ip-surface-hover hover:text-ip-text transition-colors"
              title={t('refresh_data')}
              onClick={handleRefreshData}
            >
              <RefreshCw size={16} />
            </button>
            {isEditing && (
              <span className="text-xs bg-ip-warning/10 text-ip-warning px-2 py-1 rounded-full animate-pulse ml-2">
                {t('edit_mode_active')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="ip-btn flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                >
                  <Trash2 size={14} />
                  {t('clear_all')}
                </button>
                <button
                  onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
                  className={`ip-btn flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold border transition-all ${
                    showWidgetLibrary 
                    ? 'bg-ip-primary text-white border-ip-primary shadow-lg shadow-ip-primary/20' 
                    : 'bg-ip-surface text-ip-text-secondary border-ip-border hover:bg-ip-surface-hover hover:text-ip-text shadow-sm'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  {showWidgetLibrary ? t('close_library') : t('add_widget')}
                </button>
              </>
            )}
            {hasEdit && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`ip-btn flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold shadow-md transition-colors border ${
                  isEditing 
                  ? 'bg-ip-primary text-white border-ip-primary shadow-ip-primary/20' 
                  : 'bg-ip-surface text-ip-text-secondary border-ip-border hover:bg-ip-surface-hover hover:text-ip-text shadow-slate-900/5'
                }`}
              >
                <PencilLine size={14} />
                {t('edit')}
              </button>
            )}
          </div>
        </div>
        
        <div className="-mx-4 sm:mx-0 relative flex gap-6">
          <div className={`flex-grow transition-all duration-300 ${showWidgetLibrary ? 'w-2/3' : 'w-full'}`}>
            <DashboardGrid 
              dashboard={currentDashboard} 
              isEditing={isEditing} 
              onLayoutChange={(layout) => {
                if (isEditing && Array.isArray(layout)) {
                  layout.forEach((item: { i: string; x: number; y: number; w: number; h: number }) => {
                    updateWidgetLayout(currentDashboard.id, item.i, {
                      position_x: item.x,
                      position_y: item.y,
                      width: item.w,
                      height: item.h,
                    });
                  });
                }
              }}
            />
          </div>

          {showWidgetLibrary && isEditing && (
            <div className="w-80 shrink-0 sticky top-4 h-[calc(100vh-200px)] ip-slide-in">
              <div className="ip-card h-full flex flex-col overflow-hidden">
                <WidgetLibrary dashboardId={currentDashboard.id} onClose={() => setShowWidgetLibrary(false)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AppDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title={t('create_dashboard')}
        description={t('create_dashboard_desc')}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAddDialog(false)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleAddDashboard}
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {t('create_dashboard')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm text-ip-text-secondary">
            {t('dashboard_name')}
            <input
              value={dashboardForm.dashboard_name}
              onChange={(event) =>
                setDashboardForm((currentForm) => ({
                  ...currentForm,
                  dashboard_name: event.target.value,
                }))
              }
              className="ip-input mt-1"
              placeholder="operations_clone"
            />
          </label>
          <label className="block text-sm text-ip-text-secondary">
            {t('display_name')}
            <input
              value={dashboardForm.display_name}
              onChange={(event) =>
                setDashboardForm((currentForm) => ({
                  ...currentForm,
                  display_name: event.target.value,
                }))
              }
              className="ip-input mt-1"
              placeholder="Operations Clone"
            />
          </label>
          <label className="block text-sm text-ip-text-secondary">
            {t('description')}
            <textarea
              value={dashboardForm.description}
              onChange={(event) =>
                setDashboardForm((currentForm) => ({
                  ...currentForm,
                  description: event.target.value,
                }))
              }
              className="ip-input mt-1 min-h-24 resize-none"
              placeholder={t('description')}
            />
          </label>
        </div>
        {dialogError ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dialogError}
          </div>
        ) : null}
      </AppDialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteDashboard}
        title={t('delete_dashboard_confirm').replace('{name}', currentDashboard.display_name)}
        description={t('delete_dashboard_desc')}
        confirmLabel={t('delete')}
        tone="danger"
      >
        {dialogError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dialogError}
          </div>
        ) : null}
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('delete_dashboard_warning')}
        </div>
      </ConfirmDialog>

      {/* Clear Widgets Confirmation */}
      <AppDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={t('delete_all_widgets_confirm')}
        description={t('delete_all_widgets_desc')}
        tone="danger"
        icon={<Trash2 size={24} />}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-ip-text-secondary hover:text-ip-text"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleClearAllWidgets}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20"
            >
              {t('delete_all')}
            </button>
          </div>
        }
      />
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

