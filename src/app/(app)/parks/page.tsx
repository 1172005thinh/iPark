'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  Eye,
  MapPin,
  PencilLine,
  Plus,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { AppDialog } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useParkStore } from '@/stores/park-store';
import type { Park } from '@/types/database';
import { useDataTable } from '@/hooks/useDataTable';
import { Pagination } from '@/components/shared/Pagination';
import { useTranslation } from '@/lib/i18n';
import {
  isObjectName,
  toInputTime,
  toStoredTime,
} from '@/lib/ipark-utils';

type ParkFormState = {
  park_name: string;
  display_name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  fee: string;
  max_slot: string;
  is_enable: boolean;
  is_operating: boolean;
};

export default function ParksPage() {
  const { session } = useAuthStore();
  const { parks, addPark, updatePark, deletePark } = useParkStore();
  const { t } = useTranslation();
  const hasView = session.permissions.includes('view_parks');
  const hasEdit = session.permissions.includes('edit_parks');
  const hasAdd = session.permissions.includes('add_parks');
  const hasDelete = session.permissions.includes('delete_parks');

  const {
    paginatedData: pagedParks,
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
    isSelected,
    allSelected,
    someSelected,
    selectedIds,
    clearSelection,
  } = useDataTable({
    data: parks,
    initialSortKey: 'id',
  });

  const [selectedParkId, setSelectedParkId] = useState<number | null>(null);
  const [parkToDeleteId, setParkToDeleteId] = useState<number | null>(null);
  const [formDialog, setFormDialog] = useState<{
    mode: 'create' | 'edit';
    parkId?: number;
  } | null>(null);
  const [formState, setFormState] = useState<ParkFormState>(getEmptyParkForm());
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const selectedPark = selectedParkId
    ? parks.find((park) => park.id === selectedParkId) ?? null
    : null;
  const parkToDelete = parkToDeleteId
    ? parks.find((park) => park.id === parkToDeleteId) ?? null
    : null;

  if (!hasView) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="ip-card max-w-md p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-ip-text">{t('access_denied')}</h2>
          <p className="text-sm text-ip-text-secondary">
            {t('no_permission_view')}
          </p>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'id', label: t('id') },
    { key: 'display_name', label: t('name') },
    { key: 'location', label: t('location') },
    { key: 'fee', label: t('fee_vnd') },
    { key: 'max_slot', label: t('max_slots') },
    { key: 'is_enable', label: t('enabled') },
    { key: 'is_operating', label: t('operating') },
  ];

  const showActions = hasView || hasEdit || hasDelete;

  const openCreateDialog = () => {
    setFormDialog({ mode: 'create' });
    setFormState(getEmptyParkForm());
    setFormError('');
  };

  const openEditDialog = (park: Park) => {
    setFormDialog({ mode: 'edit', parkId: park.id });
    setFormState(getParkFormState(park));
    setFormError('');
  };

  const updateForm = <K extends keyof ParkFormState>(
    key: K,
    value: ParkFormState[K]
  ) => {
    setFormError('');
    setFormState((current) => {
      if (key === 'is_enable' && value === false) {
        return { ...current, is_enable: false, is_operating: false };
      }

      return { ...current, [key]: value };
    });
  };

  const closeFormDialog = () => {
    setFormDialog(null);
    setFormError('');
  };

  const handleSavePark = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const editingId = formDialog?.mode === 'edit' ? formDialog.parkId : undefined;
    const validationError = validateParkForm(formState, parks, editingId);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const nextParkData = {
      park_name: formState.park_name.trim(),
      display_name: formState.display_name.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      start_time: toStoredTime(formState.start_time),
      end_time: toStoredTime(formState.end_time),
      fee: Number(formState.fee),
      max_slot: Number(formState.max_slot),
      is_enable: formState.is_enable,
      is_operating: formState.is_enable ? formState.is_operating : false,
    };

    if (formDialog?.mode === 'edit' && formDialog.parkId) {
      const result = updatePark(formDialog.parkId, nextParkData);

      if (!result.ok) {
        setFormError(result.error || 'Unable to save park changes.');
        return;
      }

      setSelectedParkId(formDialog.parkId);
    } else {
      const result = addPark(nextParkData);

      if (!result.ok) {
        setFormError(result.error || 'Unable to create park.');
        return;
      }
    }

    closeFormDialog();
  };

  const handleDeletePark = () => {
    if (!parkToDelete) return;

    const result = deletePark(parkToDelete.id);

    if (!result.ok) {
      setDeleteError(result.error || 'Unable to delete this park.');
      return;
    }

    if (selectedParkId === parkToDelete.id) {
      setSelectedParkId(null);
    }

    setDeleteError('');
    setParkToDeleteId(null);
  };

  return (
    <div className="ip-fade-in">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">{t('parks')}</h1>
          <p className="mt-1 text-sm text-ip-text-secondary">
            {parks.length === 1 
              ? t('park_registered_single').replace('{count}', parks.length.toString())
              : t('park_registered').replace('{count}', parks.length.toString())}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-ip-surface border border-ip-border px-3 py-1.5 shadow-sm ip-fade-in">
              <span className="text-xs font-medium text-ip-text-secondary">
                {t('selected')} {selectedIds.size} {t('items')}
              </span>
              <div className="h-4 w-[1px] bg-ip-border mx-1" />
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="ip-btn rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                title={t('delete')}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-medium text-ip-primary hover:underline ml-1"
              >
                {t('clear')}
              </button>
            </div>
          ) : (
            <>
              <span className="rounded-full bg-ip-bg px-3 py-1 text-xs text-ip-text-muted">
                {t('editable_store')}
              </span>
              {hasAdd ? (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="ip-btn flex items-center gap-2 rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/25 hover:bg-ip-primary/90"
                >
                  <Plus size={16} />
                  {t('add_park')}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

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
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none px-5 py-3.5 text-left font-semibold text-ip-text-secondary hover:text-ip-text"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key ? (
                        <span className="text-ip-primary">{sortAsc ? '↑' : '↓'}</span>
                      ) : null}
                    </span>
                  </th>
                ))}
                {showActions ? (
                  <th className="px-5 py-3.5 text-right font-semibold text-ip-text-secondary">
                    {t('actions')}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedParks.length > 0 ? (
                pagedParks.map((park) => (
                  <tr
                    key={park.id}
                    className={`border-b border-ip-border transition-colors last:border-0 hover:bg-ip-surface-hover ${isSelected(park.id) ? 'bg-ip-primary/5' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(park.id)}
                        onChange={() => toggleSelectRow(park.id)}
                        className="h-4 w-4 rounded border-ip-border bg-ip-surface text-ip-primary focus:ring-ip-primary/20"
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">{park.id}</td>
                    <td className="px-5 py-4 font-medium text-ip-text">
                      {park.display_name}
                    </td>
                    <td className="px-5 py-4 text-ip-text-secondary">
                      {park.location}
                    </td>
                    <td className="px-5 py-4">
                      {park.fee.toLocaleString()} VND
                    </td>
                    <td className="px-5 py-4">{park.max_slot}</td>
                    <td className="px-5 py-4">
                      <StatusBadge active={park.is_enable} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={park.is_operating} />
                    </td>
                    {showActions ? (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasView ? (
                            <button
                              type="button"
                              onClick={() => setSelectedParkId(park.id)}
                              className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-text-secondary hover:bg-ip-bg hover:text-ip-text"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          ) : null}
                          {hasEdit ? (
                            <button
                              type="button"
                              onClick={() => openEditDialog(park)}
                              disabled={selectedIds.size > 0}
                              className={`ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-primary hover:bg-ip-primary/10 ${selectedIds.size > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                              <PencilLine size={14} />
                              Edit
                            </button>
                          ) : null}
                          {hasDelete ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError('');
                                setParkToDeleteId(park.id);
                              }}
                              disabled={selectedIds.size > 0}
                              className={`ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 ${selectedIds.size > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={showActions ? columns.length + 2 : columns.length + 1}
                    className="px-6 py-14 text-center text-sm text-ip-text-muted"
                  >
                    No parks available. Add a new park to begin.
                  </td>
                </tr>
              )}
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
        open={selectedPark !== null}
        onClose={() => setSelectedParkId(null)}
        title={selectedPark ? selectedPark.display_name : 'Park details'}
        description={
          selectedPark
            ? `Park #${selectedPark.id} profile and operational metadata.`
            : undefined
        }
        icon={<Warehouse size={22} />}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedParkId(null)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              Close
            </button>
            {hasEdit && selectedPark ? (
              <button
                type="button"
                disabled={selectedIds.size > 0}
                onClick={() => {
                  openEditDialog(selectedPark);
                  setSelectedParkId(null);
                }}
                className={`ip-btn rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  selectedIds.size > 0
                    ? 'bg-ip-bg border-ip-border text-ip-text-muted cursor-not-allowed grayscale'
                    : 'bg-ip-primary text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90'
                }`}
              >
                {selectedIds.size > 0 ? 'Edit Disabled' : 'Edit Park'}
              </button>
            ) : null}
          </div>
        }
      >
        {selectedPark ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Park Name" value={selectedPark.park_name} />
            <DetailItem label="Display Name" value={selectedPark.display_name} />
            <DetailItem
              label="Location"
              value={selectedPark.location}
              icon={<MapPin size={14} />}
            />
            <DetailItem label="Description" value={selectedPark.description} />
            <DetailItem label="Start Time" value={selectedPark.start_time} />
            <DetailItem label="End Time" value={selectedPark.end_time} />
            <DetailItem
              label="Fee"
              value={`${selectedPark.fee.toLocaleString()} VND`}
            />
            <DetailItem label="Max Slots" value={String(selectedPark.max_slot)} />
            <DetailItem
              label="Enabled"
              value={<StatusBadge active={selectedPark.is_enable} />}
            />
            <DetailItem
              label="Operating"
              value={<StatusBadge active={selectedPark.is_operating} />}
            />
            <DetailItem label="Created At" value={selectedPark.created_at} />
            <DetailItem
              label="Last Modified"
              value={selectedPark.last_modified_at}
            />
            <DetailItem
              label="Last Active"
              value={selectedPark.last_active}
              className="md:col-span-2"
            />
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={formDialog !== null}
        onClose={closeFormDialog}
        title={formDialog?.mode === 'edit' ? 'Edit Park' : 'Add Park'}
        description={
          formDialog?.mode === 'edit'
            ? 'Update park details, status, and operating schedule.'
            : 'Create a new park entry for this demo session.'
        }
        icon={
          formDialog?.mode === 'edit' ? (
            <PencilLine size={22} />
          ) : (
            <Plus size={22} />
          )
        }
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeFormDialog}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="park-form"
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {formDialog?.mode === 'edit' ? 'Save Changes' : 'Create Park'}
            </button>
          </div>
        }
      >
        <form id="park-form" onSubmit={handleSavePark} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Park Name" htmlFor="park_name" hint="Unique object name using letters, numbers, and underscores.">
              <input
                id="park_name"
                value={formState.park_name}
                onChange={(event) => updateForm('park_name', event.target.value)}
                className="ip-input"
                placeholder="central_park"
              />
            </FormField>
            <FormField label="Display Name" htmlFor="display_name">
              <input
                id="display_name"
                value={formState.display_name}
                onChange={(event) =>
                  updateForm('display_name', event.target.value)
                }
                className="ip-input"
                placeholder="Central Park"
              />
            </FormField>
            <FormField
              label="Location"
              htmlFor="location"
              className="md:col-span-2"
            >
              <input
                id="location"
                value={formState.location}
                onChange={(event) => updateForm('location', event.target.value)}
                className="ip-input"
                placeholder="District 10, HCMC"
              />
            </FormField>
            <FormField
              label="Description"
              htmlFor="description"
              className="md:col-span-2"
            >
              <textarea
                id="description"
                value={formState.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                rows={3}
                className="ip-input min-h-[104px] resize-y"
                placeholder="Short description for operators and admins"
              />
            </FormField>
            <FormField label="Start Time" htmlFor="start_time">
              <input
                id="start_time"
                type="time"
                value={formState.start_time}
                onChange={(event) =>
                  updateForm('start_time', event.target.value)
                }
                className="ip-input"
              />
            </FormField>
            <FormField label="End Time" htmlFor="end_time">
              <input
                id="end_time"
                type="time"
                value={formState.end_time}
                onChange={(event) => updateForm('end_time', event.target.value)}
                className="ip-input"
              />
            </FormField>
            <FormField label="Fee (VND)" htmlFor="fee">
              <input
                id="fee"
                type="number"
                min="0"
                step="1000"
                value={formState.fee}
                onChange={(event) => updateForm('fee', event.target.value)}
                className="ip-input"
                placeholder="2000"
              />
            </FormField>
            <FormField label="Max Slots" htmlFor="max_slot">
              <input
                id="max_slot"
                type="number"
                min="1"
                value={formState.max_slot}
                onChange={(event) => updateForm('max_slot', event.target.value)}
                className="ip-input"
                placeholder="200"
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormToggle
              label="Enabled"
              description="Disabled parks stay editable, but they cannot remain in operation."
              checked={formState.is_enable}
              onChange={(checked) => updateForm('is_enable', checked)}
            />
            <FormToggle
              label="Operating"
              description="Operating status automatically turns off when the park is disabled."
              checked={formState.is_operating}
              disabled={!formState.is_enable}
              onChange={(checked) => updateForm('is_operating', checked)}
            />
          </div>

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          ) : null}
        </form>
      </AppDialog>

      <ConfirmDialog
        open={parkToDelete !== null}
        onClose={() => {
          setDeleteError('');
          setParkToDeleteId(null);
        }}
        onConfirm={handleDeletePark}
        title={parkToDelete ? `Delete ${parkToDelete.display_name}?` : 'Delete park'}
        description={
          parkToDelete
            ? `Park #${parkToDelete.id} will be removed from the shared mock database layer for this running session.`
            : undefined
        }
        confirmLabel="Delete Park"
        tone="danger"
      >
        {deleteError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => {
          selectedIds.forEach((id) => deletePark(id as number));
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
  icon,
  className = '',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-ip-border bg-ip-bg/60 p-4 ${className}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-ip-text-muted">
        {icon}
        {label}
      </span>
      <div className="text-sm leading-6 text-ip-text">{value}</div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`} htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-medium text-ip-text">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-xs text-ip-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function FormToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ip-border bg-ip-bg/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ip-text">{label}</p>
          <p className="mt-1 text-xs leading-5 text-ip-text-muted">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!disabled) onChange(!checked);
          }}
          disabled={disabled}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
            checked
              ? 'border-transparent bg-ip-primary'
              : 'border-ip-border bg-ip-surface'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function getEmptyParkForm(): ParkFormState {
  return {
    park_name: '',
    display_name: '',
    description: '',
    location: '',
    start_time: '08:00',
    end_time: '18:00',
    fee: '2000',
    max_slot: '100',
    is_enable: true,
    is_operating: true,
  };
}

function getParkFormState(park: Park): ParkFormState {
  return {
    park_name: park.park_name,
    display_name: park.display_name,
    description: park.description,
    location: park.location,
    start_time: toInputTime(park.start_time),
    end_time: toInputTime(park.end_time),
    fee: String(park.fee),
    max_slot: String(park.max_slot),
    is_enable: park.is_enable,
    is_operating: park.is_operating,
  };
}

function validateParkForm(
  formState: ParkFormState,
  parks: Park[],
  editingId?: number
) {
  const parkName = formState.park_name.trim();
  const displayName = formState.display_name.trim();
  const location = formState.location.trim();
  const description = formState.description.trim();
  const fee = Number(formState.fee);
  const maxSlot = Number(formState.max_slot);

  if (!parkName || !displayName || !location || !description) {
    return 'Fill in all park details before saving.';
  }

  if (!isObjectName(parkName)) {
    return 'Park name must use letters, numbers, and underscores only.';
  }

  if (
    parks.some(
      (park) => park.park_name === parkName && park.id !== editingId
    )
  ) {
    return 'Park name must be unique.';
  }

  if (!Number.isInteger(fee) || fee < 0) {
    return 'Fee must be a positive whole number or zero.';
  }

  if (!Number.isInteger(maxSlot) || maxSlot < 1) {
    return 'Max slots must be a whole number greater than zero.';
  }

  if (!formState.start_time || !formState.end_time) {
    return 'Start and end times are required.';
  }

  return null;
}
