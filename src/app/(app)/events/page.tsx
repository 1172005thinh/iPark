'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { PARK_DB } from '@/data/mock-parks';

export default function EventsPage() {
  const { session } = useAuthStore();
  const { events, acknowledgeEvent, deleteEvent } = useEventHistoryStore();
  const hasView = session.permissions.includes('view_events');
  const hasExport = session.permissions.includes('export_events');
  const hasDelete = session.permissions.includes('delete_events');

  const [sortKey, setSortKey] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!hasView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ip-text mb-2">Access Denied</h2>
          <p className="text-sm text-ip-text-secondary">You do not have permission to view events.</p>
        </div>
      </div>
    );
  }

  const parkMap: Record<number, string> = {};
  PARK_DB.forEach((p) => { parkMap[p.id] = p.display_name; });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleRowClick = (id: number) => {
    setSelectedId(id === selectedId ? null : id);
    acknowledgeEvent(id);
  };

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Are you sure you want to delete event ${id}?`)) {
      deleteEvent(id);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const sorted = [...events].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sortKey];
    const bv = (b as unknown as Record<string, unknown>)[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
  });

  const cols = [
    { key: 'id', label: 'ID' }, { key: 'event_code', label: 'Code' },
    { key: 'event_name', label: 'Event' }, { key: 'event_type', label: 'Type' },
    { key: 'at_park_id', label: 'Park' }, { key: 'received_time', label: 'Received' },
    { key: 'is_acknowledged', label: 'Ack' },
  ];

  const typeColors: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700', warning: 'bg-amber-50 text-amber-700', error: 'bg-red-50 text-red-600',
  };

  const selected = events.find((e) => e.id === selectedId);
  const showActions = hasDelete;

  return (
    <div className="ip-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Events</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            {events.length} events — {events.filter((e) => !e.is_acknowledged).length} unacknowledged
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasExport && (
            <button
              onClick={() => alert('Mock: Exporting events to CSV...')}
              className="px-4 py-2 bg-ip-surface-hover hover:bg-ip-border/50 text-ip-text text-sm font-semibold rounded-lg transition-colors border border-ip-border"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="ip-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip-border">
                {cols.map((c) => (
                  <th key={c.key} onClick={() => handleSort(c.key)} className="px-5 py-3.5 text-left font-semibold text-ip-text-secondary cursor-pointer hover:text-ip-text select-none">
                    <span className="flex items-center gap-1">{c.label}{sortKey === c.key && <span className="text-ip-primary">{sortAsc ? '↑' : '↓'}</span>}</span>
                  </th>
                ))}
                {showActions && (
                  <th className="px-5 py-3.5 text-right font-semibold text-ip-text-secondary">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((ev) => (
                <tr key={ev.id} onClick={() => handleRowClick(ev.id)} className={`border-b border-ip-border last:border-0 hover:bg-ip-surface-hover transition-colors cursor-pointer ${selectedId === ev.id ? 'bg-ip-surface-hover' : ''} ${!ev.is_acknowledged ? 'font-medium' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-xs">{ev.id}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{ev.event_code}</td>
                  <td className="px-5 py-3.5 text-ip-text">{ev.event_name}</td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[ev.event_type] || ''}`}>{ev.event_type}</span></td>
                  <td className="px-5 py-3.5 text-ip-text-secondary">{parkMap[ev.at_park_id] || `#${ev.at_park_id}`}</td>
                  <td className="px-5 py-3.5 text-ip-text-secondary text-xs">{ev.received_time}</td>
                  <td className="px-5 py-3.5">{ev.is_acknowledged ? <span className="text-green-500">✓</span> : <span className="text-ip-text-muted">—</span>}</td>
                  {showActions && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasDelete && (
                          <button
                            onClick={(e) => handleDelete(ev.id, e)}
                            className="text-red-500 hover:text-red-600 transition-colors text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="ip-card p-6 mt-4 ip-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ip-text">Event Detail</h3>
            <div className="flex items-center gap-3">
              {hasDelete && (
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded transition-colors"
                >
                  Delete Event
                </button>
              )}
              <button onClick={() => setSelectedId(null)} className="text-ip-text-muted hover:text-ip-text">✕</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Name</span><span className="text-ip-text">{selected.event_name}</span></div>
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Code</span><span className="text-ip-text">{selected.event_code}</span></div>
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Type</span><span className="text-ip-text">{selected.event_type}</span></div>
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Error Code</span><span className="text-ip-text">{selected.error_code}</span></div>
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Park</span><span className="text-ip-text">{parkMap[selected.at_park_id] || 'Unknown'}</span></div>
            <div><span className="text-ip-text-muted text-xs block mb-0.5">Received</span><span className="text-ip-text">{selected.received_time}</span></div>
            <div className="col-span-2"><span className="text-ip-text-muted text-xs block mb-0.5">Description</span><span className="text-ip-text">{selected.description}</span></div>
            {selected.extra_info && <div className="col-span-2"><span className="text-ip-text-muted text-xs block mb-0.5">Extra Info</span><span className="text-ip-text">{selected.extra_info}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
