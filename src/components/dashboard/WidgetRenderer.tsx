import React from 'react';
import { WidgetConfig } from '@/types/database';
import { ParkWidgets } from '@/components/dashboard/widgets/ParkWidgets';
import { FeeWidgets } from '@/components/dashboard/widgets/FeeWidgets';
import { MiscWidgets } from '@/components/dashboard/widgets/MiscWidgets';
import { StaffWidgets } from '@/components/dashboard/widgets/StaffWidgets';
import { WorkingTimeWidgets } from '@/components/dashboard/widgets/WorkingTimeWidgets';
import { EventWidgets } from '@/components/dashboard/widgets/EventWidgets';
import { ActionWidgets } from '@/components/dashboard/widgets/ActionWidgets';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useParkStore } from '@/stores/park-store';
import { useTranslation } from '@/lib/i18n';
import { Lock, Unlock, X } from 'lucide-react';

interface WidgetRendererProps {
  config: WidgetConfig;
  isEditing?: boolean;
  dashboardId?: number;
}

export function WidgetRenderer({ config, isEditing, dashboardId }: WidgetRendererProps) {
  const { t } = useTranslation();
  const ds = config.data_source;
  const updateWidget = useDashboardStore((state) => state.updateWidget);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const parks = useParkStore((state) => state.parks);

  const handleUpdateDataSource = (updates: any) => {
    if (!dashboardId) return;
    updateWidget(dashboardId, config.id, {
      data_source: {
        ...config.data_source,
        ...updates,
      } as any,
    });
  };

  const toggleFixed = () => {
    if (!dashboardId) return;
    updateWidget(dashboardId, config.id, { is_fixed: !config.is_fixed });
  };

  const handleDelete = () => {
    if (!dashboardId) return;
    removeWidget(dashboardId, config.id);
  };

  // Only show interval if the type actually supports it (referencing iPark.md)
  const intervalSupportedTypes = [
    'stats_curr_slot', 'chart_curr_slot',
    'estimate_income', 'chart_estimate_income',
    'stats_curr_staff', 'chart_curr_staff', 'estimate_payment', 'chart_estimate_payment',
    'stats_curr_total_working_time', 'chart_curr_total_working_time',
    'count_type_event'
  ];
  
  const showIntervalSelect = 'interval' in ds && intervalSupportedTypes.includes(ds.type as string);
  const showParkSelect = 'park' in ds;

  return (
    <div className="flex flex-col h-full w-full p-4 overflow-hidden relative">
      {isEditing && (
        <>
          {/* Top Right Controls: Lock, Drag, Delete */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleFixed}
              className={`flex items-center justify-center p-1 rounded ip-edit-control transition-all shadow-sm ${
                config.is_fixed 
                  ? 'bg-ip-primary text-white border-ip-primary' 
                  : 'text-ip-text-secondary hover:text-ip-text'
              }`}
              title={config.is_fixed ? t('unlock_position') : t('lock_position')}
            >
              {config.is_fixed ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <div className="text-[10px] font-bold bg-ip-surface border border-ip-border px-2 py-1 rounded text-ip-text-secondary cursor-move shadow-sm uppercase tracking-tighter">
              {t('drag')}
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center p-1 rounded ip-edit-control ip-btn-delete-glow transition-all shadow-sm"
              title={t('delete_widget')}
            >
              <X size={12} />
            </button>
          </div>
          
          {/* Bottom Left: Park, Interval, and Format Selectors (Blended) */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-4 whitespace-nowrap">
            {showParkSelect && (
              <select
                value={ds.park}
                onChange={(e) => handleUpdateDataSource({ park: e.target.value })}
                className="text-[10px] ip-dropdown-blend focus:outline-none"
              >
                <option value="ALL">{t('all_parks')}</option>
                {parks.map((park) => (
                  <option key={park.id} value={String(park.id)}>
                    {park.display_name}
                  </option>
                ))}
              </select>
            )}

            {showIntervalSelect && (
              <select
                value={(ds as any).interval}
                onChange={(e) => handleUpdateDataSource({ interval: e.target.value })}
                className="text-[10px] ip-dropdown-blend focus:outline-none"
              >
                <option value="hour">{t('hour')}</option>
                <option value="day">{t('day')}</option>
                <option value="week">{t('week')}</option>
                <option value="month">{t('month')}</option>
              </select>
            )}

            {'format' in ds && (
              <select
                value={(ds as any).format || 'default'}
                onChange={(e) => handleUpdateDataSource({ format: e.target.value })}
                className="text-[10px] ip-dropdown-blend focus:outline-none"
              >
                <option value="default">{t('default')}</option>
                <option value="HH:mm">{t('format_hh_mm')}</option>
                <option value="HH:mm:ss">{t('format_hh_mm_ss')}</option>
                <option value="hh:mm A">{t('format_hh_mm_a')}</option>
              </select>
            )}
          </div>
        </>
      )}

      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-ip-text truncate" title={config.label}>{config.label}</h3>
        <p className="text-[10px] text-ip-text-muted truncate" title={config.description}>{config.description}</p>
      </div>
      <div className="flex-grow flex flex-col justify-center relative">
        {renderWidgetContent(ds)}
      </div>
    </div>
  );
}

function renderWidgetContent(ds: WidgetConfig['data_source']) {
  switch (ds.category) {
    case 'PARK':
      return <ParkWidgets ds={ds} />;
    case 'FEE':
      return <FeeWidgets ds={ds} />;
    case 'MISC':
      return <MiscWidgets ds={ds} />;
    case 'STAFF':
      return <StaffWidgets ds={ds} />;
    case 'WORKING_TIME':
      return <WorkingTimeWidgets ds={ds} />;
    case 'EVENT':
      return <EventWidgets ds={ds} />;
    case 'ACTION':
      return <ActionWidgets ds={ds} />;
    default:
      return (
        <div className="text-xs text-ip-warning text-center">
          Widget type {(ds as any).category} not implemented
        </div>
      );
  }
}
