'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  BriefcaseBusiness,
  Eye,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AppDialog } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useParkStore } from '@/stores/park-store';
import { useStaffStore } from '@/stores/staff-store';
import type { Staff } from '@/types/database';
import { useDataTable } from '@/hooks/useDataTable';
import { Pagination } from '@/components/shared/Pagination';
import {
  isObjectName,
  toInputTime,
  toStoredTime,
} from '@/lib/ipark-utils';

type StaffFormState = {
  staff_name: string;
  display_name: string;
  description: string;
  at_park_id: string;
  start_time: string;
  end_time: string;
  role: string;
  payment: string;
  is_enable: boolean;
  is_on_shift: boolean;
};

export default function StaffsPage() {
  const { session } = useAuthStore();
  const { parks } = useParkStore();
  const { staffs, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const hasView = session.permissions.includes('view_staffs');
  const hasEdit = session.permissions.includes('edit_staffs');
  const hasAdd = session.permissions.includes('add_staffs');
  const hasDelete = session.permissions.includes('delete_staffs');

  const {
    paginatedData: pagedStaffs,
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
    data: staffs,
    initialSortKey: 'id',
  });

  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffToDeleteId, setStaffToDeleteId] = useState<number | null>(null);
  const [formDialog, setFormDialog] = useState<{
    mode: 'create' | 'edit';
    staffId?: number;
  } | null>(null);
  const [formState, setFormState] = useState<StaffFormState>(getEmptyStaffForm());
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const selectedStaff = selectedStaffId
    ? staffs.find((staff) => staff.id === selectedStaffId) ?? null
    : null;
  const staffToDelete = staffToDeleteId
    ? staffs.find((staff) => staff.id === staffToDeleteId) ?? null
    : null;

  if (!hasView) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="ip-card max-w-md p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-ip-text">Access Denied</h2>
          <p className="text-sm text-ip-text-secondary">
            You do not have permission to view staffs.
          </p>
        </div>
      </div>
    );
  }

  const parkNameMap: Record<number, string> = {};
  for (const park of parks) {
    parkNameMap[park.id] = park.display_name;
  }

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

  const openCreateDialog = () => {
    setFormDialog({ mode: 'create' });
    setFormState(getEmptyStaffForm());
    setFormError('');
  };

  const openEditDialog = (staff: Staff) => {
    setFormDialog({ mode: 'edit', staffId: staff.id });
    setFormState(getStaffFormState(staff));
    setFormError('');
  };

  const updateForm = <K extends keyof StaffFormState>(
    key: K,
    value: StaffFormState[K]
  ) => {
    setFormError('');
    setFormState((current) => {
      if (key === 'is_enable' && value === false) {
        return { ...current, is_enable: false, is_on_shift: false };
      }

      return { ...current, [key]: value };
    });
  };

  const closeFormDialog = () => {
    setFormDialog(null);
    setFormError('');
  };

  const handleSaveStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const editingId = formDialog?.mode === 'edit' ? formDialog.staffId : undefined;
    const validationError = validateStaffForm(formState, staffs, parks, editingId);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const nextStaffData = {
      staff_name: formState.staff_name.trim(),
      display_name: formState.display_name.trim(),
      description: formState.description.trim(),
      at_park_id: Number(formState.at_park_id),
      start_time: toStoredTime(formState.start_time),
      end_time: toStoredTime(formState.end_time),
      role: formState.role.trim(),
      payment: Number(formState.payment),
      is_enable: formState.is_enable,
      is_on_shift: formState.is_enable ? formState.is_on_shift : false,
    };

    if (formDialog?.mode === 'edit' && formDialog.staffId) {
      const result = updateStaff(formDialog.staffId, nextStaffData);

      if (!result.ok) {
        setFormError(result.error || 'Unable to save staff changes.');
        return;
      }

      setSelectedStaffId(formDialog.staffId);
    } else {
      const result = addStaff(nextStaffData);

      if (!result.ok) {
        setFormError(result.error || 'Unable to create staff.');
        return;
      }
    }

    closeFormDialog();
  };

  const handleDeleteStaff = () => {
    if (!staffToDelete) return;

    const result = deleteStaff(staffToDelete.id);

    if (!result.ok) {
      setDeleteError(result.error || 'Unable to delete this staff member.');
      return;
    }

    if (selectedStaffId === staffToDelete.id) {
      setSelectedStaffId(null);
    }

    setDeleteError('');
    setStaffToDeleteId(null);
  };

  const availableParks = parks.filter(
    (park) => park.is_enable || park.id === Number(formState.at_park_id)
  );

  return (
    <div className="ip-fade-in">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ip-text">Staffs</h1>
          <p className="mt-1 text-sm text-ip-text-secondary">
            {staffs.length} staff member{staffs.length === 1 ? '' : 's'} registered
            in the system
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-ip-surface border border-ip-border px-3 py-1.5 shadow-sm ip-fade-in">
              <span className="text-xs font-medium text-ip-text-secondary">
                Selected {selectedIds.size} items
              </span>
              <div className="h-4 w-[1px] bg-ip-border mx-1" />
              <button
                type="button"
                onClick={() => {
                  setDeleteError('');
                  const firstId = Array.from(selectedIds)[0];
                  setStaffToDeleteId(firstId as number);
                }}
                className="ip-btn rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                title="Delete selected"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-medium text-ip-primary hover:underline ml-1"
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              <span className="rounded-full bg-ip-bg px-3 py-1 text-xs text-ip-text-muted">
                Editable Store
              </span>
              {hasAdd ? (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="ip-btn flex items-center gap-2 rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/25 hover:bg-ip-primary/90"
                >
                  <Plus size={16} />
                  Add Staff
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
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pagedStaffs.length > 0 ? (
                pagedStaffs.map((staff) => (
                  <tr
                    key={staff.id}
                    className={`border-b border-ip-border transition-colors last:border-0 hover:bg-ip-surface-hover ${isSelected(staff.id) ? 'bg-ip-primary/5' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(staff.id)}
                        onChange={() => toggleSelectRow(staff.id)}
                        className="h-4 w-4 rounded border-ip-border bg-ip-surface text-ip-primary focus:ring-ip-primary/20"
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">{staff.id}</td>
                    <td className="px-5 py-4 font-medium text-ip-text">
                      {staff.display_name}
                    </td>
                    <td className="px-5 py-4 text-ip-text-secondary">
                      {parkNameMap[staff.at_park_id] || `Park #${staff.at_park_id}`}
                    </td>
                    <td className="px-5 py-4">{staff.role}</td>
                    <td className="px-5 py-4">
                      {staff.payment.toLocaleString()} VND
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={staff.is_enable} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={staff.is_on_shift} />
                    </td>
                    {showActions ? (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasView ? (
                            <button
                              type="button"
                              onClick={() => setSelectedStaffId(staff.id)}
                              className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-text-secondary hover:bg-ip-bg hover:text-ip-text"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          ) : null}
                          {hasEdit ? (
                            <button
                              type="button"
                              onClick={() => openEditDialog(staff)}
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
                                setStaffToDeleteId(staff.id);
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
                    No staff members available. Add a new staff record to begin.
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
        open={selectedStaff !== null}
        onClose={() => setSelectedStaffId(null)}
        title={selectedStaff ? selectedStaff.display_name : 'Staff details'}
        description={
          selectedStaff
            ? `Staff #${selectedStaff.id} profile, assignment, and shift metadata.`
            : undefined
        }
        icon={<ShieldCheck size={22} />}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedStaffId(null)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              Close
            </button>
            {hasEdit && selectedStaff ? (
              <button
                type="button"
                disabled={selectedIds.size > 0}
                onClick={() => {
                  openEditDialog(selectedStaff);
                  setSelectedStaffId(null);
                }}
                className={`ip-btn rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  selectedIds.size > 0
                    ? 'bg-ip-bg border-ip-border text-ip-text-muted cursor-not-allowed grayscale'
                    : 'bg-ip-primary text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90'
                }`}
              >
                {selectedIds.size > 0 ? 'Edit Disabled' : 'Edit Staff'}
              </button>
            ) : null}
          </div>
        }
      >
        {selectedStaff ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Staff Name" value={selectedStaff.staff_name} />
            <DetailItem label="Display Name" value={selectedStaff.display_name} />
            <DetailItem label="Role" value={selectedStaff.role} />
            <DetailItem
              label="Assigned Park"
              value={parkNameMap[selectedStaff.at_park_id] || `Park #${selectedStaff.at_park_id}`}
              icon={<BriefcaseBusiness size={14} />}
            />
            <DetailItem label="Description" value={selectedStaff.description} />
            <DetailItem label="Payment" value={`${selectedStaff.payment.toLocaleString()} VND`} />
            <DetailItem label="Start Time" value={selectedStaff.start_time} />
            <DetailItem label="End Time" value={selectedStaff.end_time} />
            <DetailItem
              label="Enabled"
              value={<StatusBadge active={selectedStaff.is_enable} />}
            />
            <DetailItem
              label="On Shift"
              value={<StatusBadge active={selectedStaff.is_on_shift} />}
            />
            <DetailItem label="Created At" value={selectedStaff.created_at} />
            <DetailItem
              label="Last Modified"
              value={selectedStaff.last_modified_at}
            />
            <DetailItem
              label="Last Active"
              value={selectedStaff.last_active}
              className="md:col-span-2"
            />
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={formDialog !== null}
        onClose={closeFormDialog}
        title={formDialog?.mode === 'edit' ? 'Edit Staff' : 'Add Staff'}
        description={
          formDialog?.mode === 'edit'
            ? 'Update staff assignment, shift details, and account status.'
            : 'Create a new staff record for this demo session.'
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
              form="staff-form"
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {formDialog?.mode === 'edit' ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        }
      >
        <form id="staff-form" onSubmit={handleSaveStaff} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Staff Name" htmlFor="staff_name" hint="Unique object name using letters, numbers, and underscores.">
              <input
                id="staff_name"
                value={formState.staff_name}
                onChange={(event) => updateForm('staff_name', event.target.value)}
                className="ip-input"
                placeholder="john_doe"
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
                placeholder="John Doe"
              />
            </FormField>
            <FormField label="Assigned Park" htmlFor="at_park_id">
              <select
                id="at_park_id"
                value={formState.at_park_id}
                onChange={(event) =>
                  updateForm('at_park_id', event.target.value)
                }
                className="ip-input"
              >
                {availableParks.map((park) => (
                  <option key={park.id} value={park.id}>
                    {park.display_name}
                    {park.is_enable ? '' : ' (disabled)'}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Role" htmlFor="role">
              <input
                id="role"
                value={formState.role}
                onChange={(event) => updateForm('role', event.target.value)}
                className="ip-input"
                placeholder="Attendant"
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
                placeholder="Short description for operations context"
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
            <FormField label="Payment (VND)" htmlFor="payment">
              <input
                id="payment"
                type="number"
                min="0"
                step="1000"
                value={formState.payment}
                onChange={(event) => updateForm('payment', event.target.value)}
                className="ip-input"
                placeholder="200000"
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormToggle
              label="Enabled"
              description="Disabled staff remain editable, but they cannot stay on shift."
              checked={formState.is_enable}
              onChange={(checked) => updateForm('is_enable', checked)}
            />
            <FormToggle
              label="On Shift"
              description="On-shift status automatically turns off when the staff member is disabled."
              checked={formState.is_on_shift}
              disabled={!formState.is_enable}
              onChange={(checked) => updateForm('is_on_shift', checked)}
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
        open={staffToDelete !== null}
        onClose={() => {
          setDeleteError('');
          setStaffToDeleteId(null);
        }}
        onConfirm={handleDeleteStaff}
        title={staffToDelete ? `Delete ${staffToDelete.display_name}?` : 'Delete staff'}
        description={
          staffToDelete
            ? `Staff #${staffToDelete.id} will be removed from the shared mock database layer for this running session.`
            : undefined
        }
        confirmLabel="Delete Staff"
        tone="danger"
      >
        {deleteError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>
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

function getEmptyStaffForm(): StaffFormState {
  return {
    staff_name: '',
    display_name: '',
    description: '',
    at_park_id: '1',
    start_time: '08:00',
    end_time: '16:00',
    role: '',
    payment: '200000',
    is_enable: true,
    is_on_shift: true,
  };
}

function getStaffFormState(staff: Staff): StaffFormState {
  return {
    staff_name: staff.staff_name,
    display_name: staff.display_name,
    description: staff.description,
    at_park_id: String(staff.at_park_id),
    start_time: toInputTime(staff.start_time),
    end_time: toInputTime(staff.end_time),
    role: staff.role,
    payment: String(staff.payment),
    is_enable: staff.is_enable,
    is_on_shift: staff.is_on_shift,
  };
}

function validateStaffForm(
  formState: StaffFormState,
  staffs: Staff[],
  parks: { id: number; is_enable: boolean }[],
  editingId?: number
) {
  const staffName = formState.staff_name.trim();
  const displayName = formState.display_name.trim();
  const description = formState.description.trim();
  const role = formState.role.trim();
  const payment = Number(formState.payment);
  const parkId = Number(formState.at_park_id);
  const selectedPark = parks.find((park) => park.id === parkId);

  if (!staffName || !displayName || !description || !role) {
    return 'Fill in all staff details before saving.';
  }

  if (!isObjectName(staffName)) {
    return 'Staff name must use letters, numbers, and underscores only.';
  }

  if (
    staffs.some(
      (staff) => staff.staff_name === staffName && staff.id !== editingId
    )
  ) {
    return 'Staff name must be unique.';
  }

  if (!selectedPark || !selectedPark.is_enable) {
    return 'Assign staff only to enabled parks.';
  }

  if (!Number.isInteger(payment) || payment < 0) {
    return 'Payment must be a positive whole number or zero.';
  }

  if (!formState.start_time || !formState.end_time) {
    return 'Start and end times are required.';
  }

  return null;
}
