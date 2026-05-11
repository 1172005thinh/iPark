import React from 'react';
import { EventDataSource } from '@/types/database';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { useTranslation } from '@/lib/i18n';

export function EventWidgets({ ds }: { ds: EventDataSource }) {
  const { t } = useTranslation();
  const { events } = useEventHistoryStore();
  
  const filteredEvents = [...events].filter(e => {
    if (ds.park !== 'ALL' && e.at_park_id.toString() !== ds.park) return false;
    if (ds.event_type && ds.event_type !== 'all' && e.event_type !== ds.event_type) return false;
    return true;
  }).sort((left, right) => right.received_time.localeCompare(left.received_time));

  if (ds.type === 'curr_event') {
    const latestEvent = filteredEvents[0];
    if (!latestEvent) {
      return <div className="text-center text-ip-text-muted text-sm mt-4">{t('no_recent_events')}</div>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center text-center p-2">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
          latestEvent.event_type === 'error' ? 'bg-ip-error/10 text-ip-error' :
          latestEvent.event_type === 'warning' ? 'bg-ip-warning/10 text-ip-warning' :
          'bg-ip-success/10 text-ip-success'
        }`}>
          {latestEvent.event_type === 'error' ? t('error_lc') : 
           latestEvent.event_type === 'warning' ? t('warning_lc') : t('info_lc')}
        </div>
        <div className="text-base font-semibold text-ip-text truncate w-full">
          {latestEvent.event_name}
        </div>
        <div className="text-xs text-ip-text-muted mt-1">
          {new Date(latestEvent.received_time).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  if (ds.type === 'list_event') {
    return (
      <div className="flex flex-col w-full h-full relative group/list">
        <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden pr-1 pb-24">
          {filteredEvents.length === 0 ? (
            <div className="text-center text-ip-text-muted text-sm mt-4">{t('no_events_found')}</div>
          ) : (
            filteredEvents.slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-ip-border/40 last:border-0 hover:bg-ip-surface-hover/50 transition-colors px-1 rounded-lg overflow-x-auto scrollbar-thin">
                <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                    e.event_type === 'error' ? 'bg-[#ef4444] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]' :
                    e.event_type === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                  }`} />
                  <span className="text-[11px] font-medium text-ip-text whitespace-nowrap overflow-visible">
                    {e.event_name}
                  </span>
                </div>
                <span className="text-[9px] text-ip-text-muted shrink-0 ml-4 font-mono whitespace-nowrap bg-ip-surface/80 px-1 rounded">
                  {new Date(e.received_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
        {/* Shadow Overlay at the bottom to signify fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ip-surface via-ip-surface/80 to-transparent pointer-events-none z-10" />
      </div>
    );
  }

  if (ds.type === 'count_type_event') {
    const errorCount = filteredEvents.filter(e => e.event_type === 'error').length;
    const warningCount = filteredEvents.filter(e => e.event_type === 'warning').length;
    const infoCount = filteredEvents.filter(e => e.event_type === 'info').length;

    return (
      <div className="flex justify-between items-center w-full px-2 h-full">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-ip-error uppercase mb-1">{t('error_lc')}</span>
          <span className="text-2xl font-bold text-ip-error">{errorCount}</span>
        </div>
        <div className="flex flex-col items-center border-x border-ip-border px-4">
          <span className="text-[10px] text-ip-warning uppercase mb-1">{t('warning_lc')}</span>
          <span className="text-2xl font-bold text-ip-warning">{warningCount}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-ip-success uppercase mb-1">{t('info_lc')}</span>
          <span className="text-2xl font-bold text-ip-success">{infoCount}</span>
        </div>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">Unknown Event Widget</div>;
}
