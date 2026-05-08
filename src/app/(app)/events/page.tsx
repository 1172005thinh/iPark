'use client';

import { useState, type MouseEvent } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { useParkStore } from '@/stores/park-store';

export default function EventsPage() {
  const { session } = useAuthStore();
  const { events, acknowledgeEvent, deleteEvent } = useEventHistoryStore();
  const parks = useParkStore((state) => state.parks);
  const hasView = session.permissions.includes('view_events');
  const hasExport = session.permissions.includes('export_events');
  const hasDelete = session.permissions.includes('delete_events');

  const [sortKey, setSortKey] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
  parks.forEach((park) => {
    parkMap[park.id] = park.display_name;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleRowClick = (id: number) => {
    setSelectedId(id === selectedId ? null : id);
    acknowledgeEvent(id);
  };

  const handleDeleteRequest = (id: number, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setEventToDelete(id);
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
  const deleteTarget = events.find((e) => e.id === eventToDelete) ?? null;
  const showActions = hasDelete;

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteEvent(deleteTarget.id);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setEventToDelete(null);
  };

  const handleExport = () => {
    setIsExporting(true);

    const csvRows = [
      [
        'id',
        'event_code',
        'event_name',
        'event_type',
        'error_code',
        'description',
        'park_name',
        'extra_info',
        'sent_time',
        'received_time',
        'is_acknowledged',
      ],
      ...events.map((event) => [
        String(event.id),
        event.event_code,
        event.event_name,
        event.event_type,
        event.error_code,
        event.description,
        parkMap[event.at_park_id] || `Park #${event.at_park_id}`,
        event.extra_info,
        event.sent_time,
        event.received_time,
        event.is_acknowledged ? 'true' : 'false',
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const filename = `ipark-events-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${events.length} events to ${filename}.`);
    setIsExporting(false);
  };

  return (
    <div className="ip-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Events</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            {events.length} events — {events.filter((e) => !e.is_acknowledged).length} unacknowledged
          </p>
          {exportNotice && (
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {exportNotice}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasExport && (
            <button
              onClick={handleExport}
              className="ip-btn flex items-center gap-2 rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-semibold text-ip-text transition-colors hover:bg-ip-surface-hover"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
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
                            onClick={(e) => handleDeleteRequest(ev.id, e)}
                            className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
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
                  onClick={() => handleDeleteRequest(selected.id)}
                  className="ip-btn flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={14} />
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget ? `Delete event ${deleteTarget.id}?` : 'Delete event'}
        description={
          deleteTarget
            ? `${deleteTarget.event_name} will be removed from the live event history store immediately.`
            : undefined
        }
        confirmLabel="Delete Event"
        tone="danger"
      />
    </div>
  );
}
