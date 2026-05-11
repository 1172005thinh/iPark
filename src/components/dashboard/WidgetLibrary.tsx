import React from 'react';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useTranslation } from '@/lib/i18n';
import { X, Plus, PieChart, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

interface WidgetLibraryProps {
  dashboardId: number;
  onClose: () => void;
}

export function WidgetLibrary({ dashboardId, onClose }: WidgetLibraryProps) {
  const { t } = useTranslation();
  const updateDashboard = useDashboardStore(state => state.updateDashboard);
  const dashboards = useDashboardStore(state => state.dashboards);
  
  const addWidget = (template: any) => {
     const d = dashboards.find(db => db.id === dashboardId);
     if (d) {
       const newWidget = {
          ...template,
          id: 'w_' + Math.random().toString(36).substr(2, 9),
          position_x: 0,
          position_y: 0,
          is_fixed: false,
          is_enable: true,
       };
       updateDashboard(dashboardId, { widgets_list: [...d.widgets_list, newWidget as any] });
     }
  };

  const templates = [
    { label: t('widget_slot_usage'), description: t('widget_slot_usage_desc'), width: 2, height: 2, icon: <PieChart size={20} />, data_source: { category: 'PARK', type: 'curr_slot_max_slot', park: 'ALL', unit: 'slot' } },
    { label: t('widget_income_chart'), description: t('widget_income_chart_desc'), width: 4, height: 2, icon: <TrendingUp size={20} />, data_source: { category: 'FEE', type: 'chart_estimate_income', park: 'ALL', unit: 'VND', interval: 'day' } },
    { label: t('widget_staff_count'), description: t('widget_staff_count_desc'), width: 2, height: 2, icon: <Users size={20} />, data_source: { category: 'STAFF', type: 'curr_staff_max_staff', park: 'ALL', unit: 'person' } },
    { label: t('widget_recent_events'), description: t('widget_recent_events_desc'), width: 2, height: 2, icon: <AlertTriangle size={20} />, data_source: { category: 'EVENT', type: 'list_event', park: '1' } },
    { label: t('widget_working_time'), description: t('widget_working_time_desc'), width: 2, height: 2, icon: <Clock size={20} />, data_source: { category: 'WORKING_TIME', type: 'start_end_time', park: '1', unit: 'h' } },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-ip-border flex items-center justify-between bg-ip-surface">
        <h3 className="font-bold text-ip-text">{t('widget_library')}</h3>
        <button onClick={onClose} className="p-1 hover:bg-ip-surface-hover rounded-lg text-ip-text-muted">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-ip-bg/50">
        <p className="text-xs text-ip-text-muted mb-4">{t('library_description')}</p>
        
        {templates.map((template, idx) => (
          <button 
            key={idx}
            onClick={() => addWidget(template)}
            className="w-full text-left ip-card p-4 hover:border-ip-primary/50 transition-all group relative pr-16 overflow-hidden flex items-center"
          >
            {/* Prominent Add Button (Central Right, slides in from right edge) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-ip-primary text-white flex items-center justify-center shadow-lg shadow-ip-primary/20 transition-all transform translate-x-20 group-hover:translate-x-0">
              <Plus size={20} />
            </div>

            <div className="flex items-center gap-3 transition-transform duration-300 group-hover:-translate-x-2">
              <div className="p-2 rounded-xl bg-ip-primary/10 text-ip-primary transition-colors shrink-0">
                {template.icon}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-ip-text truncate">{template.label}</p>
                <p className="text-[10px] text-ip-text-muted truncate">{template.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-4 bg-ip-surface border-t border-ip-border">
        <div className="text-[10px] text-ip-text-muted text-center italic">
          {t('library_tip')}
        </div>
      </div>
    </div>
  );
}
