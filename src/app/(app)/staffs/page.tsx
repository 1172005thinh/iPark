'use client';

import { useState } from 'react';
import { STAFF_DB } from '@/data/mock-staffs';
import { PARK_DB } from '@/data/mock-parks';
import { useAuthStore } from '@/stores/auth-store';

export default function StaffsPage() {
  const { session } = useAuthStore();
  const hasView = session.permissions.includes('view_staffs');
  const hasEdit = session.permissions.includes('edit_staffs');
  const hasAdd = session.permissions.includes('add_staffs');
  const hasDelete = session.permissions.includes('delete_staffs');

  const [sortKey, setSortKey] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState(true);

  if (!hasView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="ip-card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ip-text mb-2">Access Denied</h2>
          <p className="text-sm text-ip-text-secondary">
            You do not have permission to view staffs.
          </p>
        </div>
      </div>
    );
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const parkNameMap: Record<number, string> = {};
  for (const p of PARK_DB) {
    parkNameMap[p.id] = p.display_name;
  }

  const sorted = [...STAFF_DB].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortKey];
    const bVal = (b as unknown as Record<string, unknown>)[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'display_name', label: 'Name' },
    { key: 'at_park_id', label: 'Park' },
    { key: 'role', label: 'Role' },
    { key: 'payment', label: 'Payment (VND)' },
    { key: 'is_enable', label: 'Enabled' },
    { key: 'is_on_shift', label: 'On Shift' },
  ];

  const showActions = hasView || hasEdit || hasDelete;

  return (
    <div className="ip-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Staffs</h1>
          <p className="text-sm text-ip-text-secondary mt-1">
            {STAFF_DB.length} staff members registered in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ip-text-muted px-3 py-1 bg-ip-bg rounded-full">
            Read-only mock
          </span>
          {hasAdd && (
            <button
              onClick={() => alert('Mock: Add new staff dialog would open here')}
              className="px-4 py-2 bg-ip-primary hover:bg-ip-primary/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-ip-primary/30"
            >
              + Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="ip-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-5 py-3.5 text-left font-semibold text-ip-text-secondary cursor-pointer hover:text-ip-text select-none"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-ip-primary">
                          {sortAsc ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
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
              {sorted.map((staff) => (
                <tr
                  key={staff.id}
                  className="border-b border-ip-border last:border-0 hover:bg-ip-surface-hover transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs">{staff.id}</td>
                  <td className="px-5 py-3.5 font-medium text-ip-text">
                    {staff.display_name}
                  </td>
                  <td className="px-5 py-3.5 text-ip-text-secondary">
                    {parkNameMap[staff.at_park_id] || `Park #${staff.at_park_id}`}
                  </td>
                  <td className="px-5 py-3.5">{staff.role}</td>
                  <td className="px-5 py-3.5">
                    {staff.payment.toLocaleString()} VND
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge active={staff.is_enable} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge active={staff.is_on_shift} />
                  </td>
                  {showActions && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasView && (
                          <button
                            onClick={() => alert(`Mock: View details for staff ${staff.id}`)}
                            className="text-ip-text-secondary hover:text-ip-text transition-colors text-xs font-medium"
                          >
                            View
                          </button>
                        )}
                        {hasEdit && (
                          <button
                            onClick={() => alert(`Mock: Edit staff ${staff.id}`)}
                            className="text-ip-primary hover:text-ip-primary/80 transition-colors text-xs font-medium px-2 border-l border-ip-border"
                          >
                            Edit
                          </button>
                        )}
                        {hasDelete && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete staff ${staff.id}?`)) {
                                alert(`Mock: Delete staff ${staff.id}`);
                              }
                            }}
                            className="text-red-500 hover:text-red-600 transition-colors text-xs font-medium pl-2 border-l border-ip-border"
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
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        active
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-600'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-green-500' : 'bg-red-400'
        }`}
      />
      {active ? 'Yes' : 'No'}
    </span>
  );
}
