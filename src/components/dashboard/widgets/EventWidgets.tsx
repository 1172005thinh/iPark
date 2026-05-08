import React from 'react';
import { EventDataSource } from '@/types/database';
import { useEventHistoryStore } from '@/stores/event-history-store';

export function EventWidgets({ ds }: { ds: EventDataSource }) {
  const { events } = useEventHistoryStore();
  
  const filteredEvents = [...events].filter(e => {
    if (ds.park !== 'ALL' && e.at_park_id.toString() !== ds.park) return false;
    if (ds.event_type && ds.event_type !== 'all' && e.event_type !== ds.event_type) return false;
    return true;
  }).sort((left, right) => right.received_time.localeCompare(left.received_time));

  if (ds.type === 'curr_event') {
    const latestEvent = filteredEvents[0];
    if (!latestEvent) {
      return <div className="text-center text-ip-text-muted text-sm mt-4">No recent events</div>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center text-center p-2">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
          latestEvent.event_type === 'error' ? 'bg-ip-error/10 text-ip-error' :
          latestEvent.event_type === 'warning' ? 'bg-ip-warning/10 text-ip-warning' :
          'bg-ip-success/10 text-ip-success'
        }`}>
          {latestEvent.event_type.toUpperCase()}
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
      <div className="flex flex-col w-full h-full overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-ip-text-muted text-sm mt-4">No events found</div>
        ) : (
          filteredEvents.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-ip-border/50 last:border-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  e.event_type === 'error' ? 'bg-ip-error' :
                  e.event_type === 'warning' ? 'bg-ip-warning' : 'bg-ip-success'
                }`} />
                <span className="text-xs text-ip-text truncate">{e.event_name}</span>
              </div>
              <span className="text-[10px] text-ip-text-muted shrink-0 ml-2">
                {new Date(e.received_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
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
          <span className="text-[10px] text-ip-error uppercase mb-1">Error</span>
          <span className="text-2xl font-bold text-ip-error">{errorCount}</span>
        </div>
        <div className="flex flex-col items-center border-x border-ip-border px-4">
          <span className="text-[10px] text-ip-warning uppercase mb-1">Warning</span>
          <span className="text-2xl font-bold text-ip-warning">{warningCount}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-ip-success uppercase mb-1">Info</span>
          <span className="text-2xl font-bold text-ip-success">{infoCount}</span>
        </div>
      </div>
    );
  }

  return <div>Unknown Event Widget</div>;
}
