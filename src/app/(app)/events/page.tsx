'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { Download, Eye, Trash2, Info } from 'lucide-react';
import { AppDialog } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { useParkStore } from '@/stores/park-store';
import { useDataTable } from '@/hooks/useDataTable';
import { Pagination } from '@/components/shared/Pagination';
import { useTranslation } from '@/lib/i18n';

export default function EventsPage() {
  const { session } = useAuthStore();
  const { events, acknowledgeEvent, deleteEvent } = useEventHistoryStore();
  const parks = useParkStore((state) => state.parks);
  const { t } = useTranslation();
  const hasView = session.permissions.includes('view_events');
  const hasExport = session.permissions.includes('export_events');
  const hasDelete = session.permissions.includes('delete_events');

  const {
    paginatedData: pagedEvents,
    handleSort,
    sortKey,
    sortAsc,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
    toggleSelectAll,
    toggleSelectRow,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    isSelectionMode,
    selectedIds,
  } = useDataTable({
    data: events,
    initialSortKey: 'id',
    initialSortAsc: false,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  if (!hasView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ip-text mb-2">{t('access_denied')}</h2>
          <p className="text-sm text-ip-text-secondary">{t('no_permission_view')}</p>
        </div>
      </div>
    );
  }

  const parkMap: Record<number, string> = {};
  parks.forEach((park) => {
    parkMap[park.id] = park.display_name;
  });

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    acknowledgeEvent(id);
  };

  const handleDeleteRequest = (id: number, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setEventToDelete(id);
  };

  const cols = [
    { key: 'id', label: t('id') }, { key: 'event_code', label: t('code') },
    { key: 'event_name', label: t('events') }, { key: 'event_type', label: t('type') },
    { key: 'at_park_id', label: t('park') }, { key: 'received_time', label: t('received') },
    { key: 'is_acknowledged', label: t('ack') },
  ];

  const typeColors: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700', warning: 'bg-amber-50 text-amber-700', error: 'bg-red-50 text-red-600',
  };

  const selected = events.find((e) => e.id === selectedId);
  const deleteTarget = events.find((e) => e.id === eventToDelete) ?? null;
  const showActions = hasView || hasDelete;

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
      {isSelectionMode && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-ip-primary px-6 py-3 text-white shadow-lg ip-fade-in">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {t('selected')} {selectedIds.size} {t('items')}
            </span>
            <button 
              onClick={clearSelection}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              {t('clear')}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {hasDelete && (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/30"
              >
                <Trash2 size={16} />
                {t('delete')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="ip-card overflow-hidden rounded-[2rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip-border">
                <th className="px-5 py-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-ip-border bg-ip-surface text-ip-primary focus:ring-ip-primary/20"
                  />
                </th>
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
              {pagedEvents.map((ev) => (
                <tr key={ev.id} className={`border-b border-ip-border last:border-0 hover:bg-ip-surface-hover transition-colors ${selectedId === ev.id ? 'bg-ip-surface-hover' : ''} ${isSelected(ev.id) ? 'bg-ip-primary/5' : ''} ${!ev.is_acknowledged ? 'font-medium' : ''}`}>
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected(ev.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectRow(ev.id);
                      }}
                      className="h-4 w-4 rounded border-ip-border bg-ip-surface text-ip-primary focus:ring-ip-primary/20"
                    />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{ev.id}</td>
                  <td className="px-5 py-4 font-mono text-xs">{ev.event_code}</td>
                  <td className="px-5 py-4 text-ip-text">{ev.event_name}</td>
                  <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[ev.event_type] || ''}`}>{ev.event_type}</span></td>
                  <td className="px-5 py-4 text-ip-text-secondary">{parkMap[ev.at_park_id] || `#${ev.at_park_id}`}</td>
                  <td className="px-5 py-4 text-ip-text-secondary text-xs">{ev.received_time}</td>
                  <td className="px-5 py-4">{ev.is_acknowledged ? <span className="text-green-500">✓</span> : <span className="text-ip-text-muted">—</span>}</td>
                  {showActions && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasView && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(ev.id);
                            }}
                            className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-text-secondary hover:bg-ip-bg hover:text-ip-text"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        )}
                        {hasDelete && (
                          <button
                            disabled={isSelectionMode}
                            onClick={(e) => handleDeleteRequest(ev.id, e)}
                            className={`ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isSelectionMode ? 'text-ip-text-muted cursor-not-allowed' : 'text-red-500 hover:bg-red-50 hover:text-red-600'}`}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <AppDialog
        open={selected !== undefined}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.event_name : 'Event details'}
        description={
          selected
            ? `Event #${selected.id} captured on ${selected.received_time}.`
            : undefined
        }
        icon={<Info size={22} />}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              Close
            </button>
            {hasDelete && selected ? (
              <button
                type="button"
                disabled={isSelectionMode}
                onClick={() => {
                  handleDeleteRequest(selected.id);
                  setSelectedId(null);
                }}
                className={`ip-btn rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${isSelectionMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                Delete Event
              </button>
            ) : null}
          </div>
        }
      >
        {selected ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Event Name" value={selected.event_name} />
            <DetailItem label="Event Code" value={selected.event_code} />
            <DetailItem 
              label="Type" 
              value={<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[selected.event_type] || ''}`}>{selected.event_type}</span>} 
            />
            <DetailItem label="Error Code" value={selected.error_code} />
            <DetailItem label="Park" value={parkMap[selected.at_park_id] || 'Unknown'} />
            <DetailItem label="Received Time" value={selected.received_time} />
            <DetailItem label="Sent Time" value={selected.sent_time} />
            <DetailItem label="Acknowledged" value={<StatusBadge active={selected.is_acknowledged} />} />
            <DetailItem label="Description" value={selected.description} className="md:col-span-2" />
            {selected.extra_info && <DetailItem label="Extra Info" value={selected.extra_info} className="md:col-span-2" />}
          </div>
        ) : null}
      </AppDialog>

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

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => {
          selectedIds.forEach((id) => deleteEvent(id as number));
          clearSelection();
          setShowBulkDeleteConfirm(false);
        }}
        title={t('delete')}
        description={t('bulk_delete_confirm').replace(
          '{count}',
          String(selectedIds.size)
        )}
        tone="danger"
        confirmLabel={t('delete')}
      />
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-green-500' : 'bg-red-400'
        }`}
      />
      {active ? 'Yes' : 'No'}
    </span>
  );
}

function DetailItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-ip-border bg-ip-bg/60 p-4 ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-ip-text-muted">
        {label}
      </span>
      <div className="text-sm leading-6 text-ip-text">{value}</div>
    </div>
  );
}
