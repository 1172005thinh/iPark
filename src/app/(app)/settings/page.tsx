'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import {
  Bell,
  Eye,
  EyeOff,
  Code,
  Globe,
  Heart,
  HelpCircle,
  Info,
  LockKeyhole,
  Palette,
  PencilLine,
  Plus,
  ShieldUser,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { AppDialog } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useGroupStore } from '@/stores/group-store';
import { useUserStore } from '@/stores/user-store';
import { useDataTable } from '@/hooks/useDataTable';
import { Pagination } from '@/components/shared/Pagination';
import { useTranslation } from '@/lib/i18n';
import type { User } from '@/types/database';

type NotificationSettings = {
  notificationsEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

type UserFormState = {
  user_name: string;
  display_name: string;
  description: string;
  email: string;
  password: string;
  group: string;
  language: string;
  theme: string;
  pinned_dashboard_id: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const groups = useGroupStore((state) => state.groups);
  const enabledDashboardIds = useDashboardStore(
    useShallow((state) =>
      state.dashboards
        .filter((dashboard) => dashboard.is_enable)
        .map((dashboard) => dashboard.id)
    )
  );
  const hasView = session.permissions.includes('view_settings');
  const hasEdit = session.permissions.includes('edit_settings');
  const {
    users,
    addUser,
    enableUser,
    disableUser,
    setOnline,
    updateUser,
    deleteUser,
  } = useUserStore();
  const { t } = useTranslation();
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    notificationsEnabled: true,
    inAppEnabled: true,
    emailEnabled: false,
  });
  const {
    paginatedData: pagedUsers,
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
    isSelectionMode,
    clearSelection,
  } = useDataTable({
    data: users,
    initialSortKey: 'id',
  });

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userToToggleStatusId, setUserToToggleStatusId] = useState<number | null>(null);
  const [userToRevokeId, setUserToRevokeId] = useState<number | null>(null);
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formDialog, setFormDialog] = useState<{
    mode: 'create' | 'edit';
    userId?: number;
  } | null>(null);
  const [formState, setFormState] = useState<UserFormState>(getEmptyUserForm());
  const [formError, setFormError] = useState('');
  const currentUser = session.user ? users.find((user) => user.id === session.user?.id) ?? session.user : null;
  const enabledGroups = groups.filter((group) => group.is_enable);
  const groupLabelMap = Object.fromEntries(
    groups.map((group) => [group.group_name, group.display_name])
  );
  const selectedUser = selectedUserId
    ? users.find((user) => user.id === selectedUserId) ?? null
    : null;
  const userToToggleStatus = userToToggleStatusId
    ? users.find((user) => user.id === userToToggleStatusId) ?? null
    : null;
  const userToRevoke = userToRevokeId
    ? users.find((user) => user.id === userToRevokeId) ?? null
    : null;
  const userToDelete = userToDeleteId
    ? users.find((user) => user.id === userToDeleteId) ?? null
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


  const openCreateDialog = () => {
    setFormDialog({ mode: 'create' });
    setFormState(
      getEmptyUserForm(
        currentUser,
        enabledGroups[0]?.group_name ?? 'users',
        enabledDashboardIds[0] ?? 1
      )
    );
    setFormError('');
  };

  const openEditDialog = (user: User) => {
    setFormDialog({ mode: 'edit', userId: user.id });
    setFormState(getUserFormState(user));
    setFormError('');
  };

  const closeFormDialog = () => {
    setFormDialog(null);
    setFormError('');
  };

  const updateForm = <K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K]
  ) => {
    setFormError('');
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const editingUser =
    formDialog?.mode === 'edit' && formDialog.userId
      ? users.find((user) => user.id === formDialog.userId) ?? null
      : null;
  const canEditEmail = !editingUser || currentUser?.id === editingUser.id;

  const handleSaveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateUserForm(
      formState,
      users,
      enabledGroups.map((group) => group.group_name),
      enabledDashboardIds,
      editingUser,
      t,
      currentUser?.id
    );

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const nextUserData = {
      user_name: formState.user_name.trim(),
      display_name: formState.display_name.trim(),
      description: formState.description.trim(),
      email: canEditEmail && !editingUser ? formState.email.trim() : formState.email.trim(),
      password: formState.password,
      group: formState.group,
      language: formState.language,
      theme: formState.theme,
      pinned_dashboard_id: Number(formState.pinned_dashboard_id),
    };

    if (editingUser && formDialog?.userId) {
      updateUser(formDialog.userId, {
        ...nextUserData,
        email: canEditEmail ? nextUserData.email : editingUser.email,
      });
      setSelectedUserId(formDialog.userId);
    } else {
      addUser({
        ...nextUserData,
        is_enable: true,
        is_online: false,
      });
    }

    closeFormDialog();
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    if (!hasEdit) return;

    setNotifications((current) => {
      if (key === 'notificationsEnabled') {
        return { ...current, notificationsEnabled: !current.notificationsEnabled };
      }

      if (!current.notificationsEnabled) {
        return current;
      }

      return { ...current, [key]: !current[key] };
    });
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    deleteUser(userToDelete.id);
    if (selectedUserId === userToDelete.id) {
      setSelectedUserId(null);
    }
    if (currentUser?.id === userToDelete.id) {
      logout(setOnline);
      router.replace('/login');
    }
    setUserToDeleteId(null);
  };

    return (
      <div className="ip-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ip-text">{t('settings')}</h1>
        <p className="mt-1 text-sm text-ip-text-secondary">
          {t('settings_subtitle')}
        </p>
      </div>

      <div className="grid gap-6">
        <div className="ip-card rounded-[2rem] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ip-text">{t('notifications')}</h2>
              <p className="text-sm text-ip-text-secondary">
                {t('notifications_desc')}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <SettingRow
              label={t('enable_notifications')}
              sublabel={t('enable_notifications_desc')}
              checked={notifications.notificationsEnabled}
              onToggle={() => handleNotificationToggle('notificationsEnabled')}
              disabled={!hasEdit}
            />
            <SettingRow
              label={t('in_app_notifications')}
              sublabel={t('in_app_notifications_desc')}
              checked={notifications.inAppEnabled}
              onToggle={() => handleNotificationToggle('inAppEnabled')}
              disabled={!hasEdit || !notifications.notificationsEnabled}
            />
            <SettingRow
              label={t('email_notifications')}
              sublabel={t('email_notifications_desc')}
              checked={notifications.emailEnabled}
              onToggle={() => handleNotificationToggle('emailEnabled')}
              disabled={!hasEdit || !notifications.notificationsEnabled}
            />
          </div>
        </div>

        <div className="ip-card rounded-[2rem] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ip-text">{t('language')} & {t('theme')}</h2>
              <p className="text-sm text-ip-text-secondary">
                {t('appearance_desc')}
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm text-ip-text-secondary">
                {t('language')}
              </span>
              <div className="flex flex-wrap gap-3">
                <RadioPill
                  label={t('english')}
                  checked={currentUser?.language === 'English'}
                  disabled={!currentUser}
                  onClick={() =>
                    currentUser && updateUser(currentUser.id, { language: 'English' })
                  }
                />
                <RadioPill
                  label={t('vietnamese')}
                  checked={currentUser?.language === 'Vietnamese'}
                  disabled={!currentUser}
                  onClick={() =>
                    currentUser &&
                    updateUser(currentUser.id, { language: 'Vietnamese' })
                  }
                />
              </div>
            </div>
            <div>
              <span className="mb-2 block text-sm text-ip-text-secondary">
                {t('theme')}
              </span>
              <div className="flex flex-wrap gap-3">
                <RadioPill
                  label={t('light')}
                  checked={currentUser?.theme === 'Light'}
                  disabled={!currentUser}
                  onClick={() =>
                    currentUser && updateUser(currentUser.id, { theme: 'Light' })
                  }
                />
                <RadioPill
                  label={t('dark')}
                  checked={currentUser?.theme === 'Dark'}
                  disabled={!currentUser}
                  onClick={() =>
                    currentUser && updateUser(currentUser.id, { theme: 'Dark' })
                  }
                />
                <RadioPill
                  label={t('system')}
                  checked={currentUser?.theme === 'System'}
                  disabled={!currentUser}
                  onClick={() =>
                    currentUser && updateUser(currentUser.id, { theme: 'System' })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ip-card rounded-[2rem] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ip-text">
                {t('account_management')}
              </h2>
              <p className="mt-1 text-sm text-ip-text-secondary">
                {t('account_management_desc')}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div />
            <div className="flex flex-wrap gap-2">
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
                  <span className="flex items-center rounded-full bg-ip-bg px-3 py-1 text-xs text-ip-text-muted">
                    {t('live_user_store')}
                  </span>
                  {hasEdit ? (
                    <button
                      type="button"
                      onClick={openCreateDialog}
                      className="ip-btn flex items-center gap-2 rounded-xl bg-ip-primary px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
                    >
                      <Plus size={14} />
                      {t('add')} {t('user' as any)}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-ip-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ip-border bg-ip-bg/50 text-ip-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
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
                  {[
                    { key: 'id', label: t('id') },
                    { key: 'user_name', label: t('username') },
                    { key: 'email', label: t('email') },
                    { key: 'group', label: t('group') },
                    { key: 'is_enable', label: t('status') },
                    { key: 'is_online', label: t('online') },
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="cursor-pointer select-none px-4 py-3 font-semibold hover:text-ip-text"
                    >
                      <span className="flex items-center gap-1">
                        {column.label}
                        {sortKey === column.key ? (
                          <span className="text-ip-primary">
                            {sortAsc ? '↑' : '↓'}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  ))}
                  {hasEdit ? (
                    <th className="px-4 py-3 text-right font-semibold">{t('actions')}</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-ip-border transition-colors last:border-0 hover:bg-ip-surface-hover ${isSelected(user.id) ? 'bg-ip-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(user.id)}
                        onChange={() => toggleSelectRow(user.id)}
                        className="h-4 w-4 rounded border-ip-border bg-ip-surface text-ip-primary focus:ring-ip-primary/20"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-ip-text">
                      <div className="flex items-center gap-2">
                        <span>{user.user_name}</span>
                        {currentUser?.id === user.id ? (
                          <span className="rounded-full bg-ip-primary/10 px-2 py-0.5 text-[11px] font-medium text-ip-primary">
                            {t('you')}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ip-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-ip-bg px-2.5 py-1 text-xs font-medium text-ip-text-secondary">
                        {groupLabelMap[user.group] ?? user.group}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => hasEdit && setUserToToggleStatusId(user.id)}
                        disabled={!hasEdit}
                        className={`${hasEdit ? 'cursor-pointer hover:opacity-85' : 'cursor-default'} rounded-full`}
                      >
                        <StatusPill active={user.is_enable} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <OnlinePill active={user.is_online} />
                    </td>
                    {hasEdit ? (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-text-secondary hover:bg-ip-bg hover:text-ip-text"
                          >
                            <Eye size={14} />
                            {t('view')}
                          </button>
                          {user.is_online ? (
                            <button
                              type="button"
                              onClick={() => setUserToRevokeId(user.id)}
                              className="ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <UserRoundX size={14} />
                              {t('revoke')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openEditDialog(user)}
                            disabled={selectedIds.size > 0}
                            className={`ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-primary hover:bg-ip-primary/10 ${selectedIds.size > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                          >
                            <PencilLine size={14} />
                            {t('edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDeleteId(user.id)}
                            disabled={selectedIds.size > 0}
                            className={`ip-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ip-error hover:bg-red-50 hover:text-ip-error ${selectedIds.size > 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                          >
                            <Trash2 size={14} />
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    ) : null}
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

        {/* About Section */}
        <div className="ip-card rounded-[2rem] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 text-purple-700">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ip-text">{t('about_ipark')}</h2>
              <p className="text-sm text-ip-text-secondary">
                {t('about_ipark_desc')}
              </p>
            </div>
          </div>
          <div className="grid gap-x-12 gap-y-2 md:grid-cols-2">
            <div className="flex items-center justify-between py-2 border-b border-ip-border/50">
              <span className="text-sm text-ip-text-secondary">{t('version')}</span>
              <span className="text-sm font-medium text-ip-text">v1.4.1 (Stable)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-ip-border/50">
              <span className="text-sm text-ip-text-secondary">{t('release_type')}</span>
              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border border-amber-100">
                DEMO Release
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-ip-border/50">
              <span className="text-sm text-ip-text-secondary">{t('developers')}</span>
              <span className="text-sm font-medium text-ip-text text-right">TICSMTC - HCMUT 3rd CSE Group</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-ip-border/50">
              <span className="text-sm text-ip-text-secondary">{t('source_code')}</span>
              <Link 
                href="https://github.com/1172005thinh/iPark" 
                target="_blank" 
                className="text-sm font-medium text-ip-primary hover:underline flex items-center gap-1.5"
              >
                <Code size={14} />
                {t('github_repo')}
              </Link>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button className="ip-btn flex-1 flex items-center justify-center gap-2 rounded-xl border border-ip-border bg-ip-surface py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover">
              <HelpCircle size={16} />
              {t('help_document')}
            </button>
            <button className="ip-btn flex-1 flex items-center justify-center gap-2 rounded-xl border border-ip-border bg-ip-surface py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover">
              <Heart size={16} className="text-red-500" />
              {t('donate')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => {
          selectedIds.forEach(id => deleteUser(id as number));
          clearSelection();
          setShowBulkDeleteConfirm(false);
        }}
        title={t('delete')}
        description={t('bulk_delete_confirm').replace('{count}', String(selectedIds.size))}
        tone="danger"
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />

      <AppDialog
        open={selectedUser !== null}
        onClose={() => setSelectedUserId(null)}
        title={selectedUser ? selectedUser.display_name : t('user_details')}
        description={
          selectedUser
            ? t('user_profile_desc').replace('{id}', String(selectedUser.id))
            : undefined
        }
        icon={<ShieldUser size={22} />}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              {t('close')}
            </button>
            {hasEdit && selectedUser ? (
              <button
                type="button"
                onClick={() => {
                  openEditDialog(selectedUser);
                  setSelectedUserId(null);
                }}
                className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
              >
                {t('edit')} {t('user')}
              </button>
            ) : null}
          </div>
        }
      >
        {selectedUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label={t('username')} value={selectedUser.user_name} />
            <DetailItem label={t('display_name')} value={selectedUser.display_name} />
            <DetailItem label={t('email')} value={selectedUser.email} />
            <DetailItem
              label={t('group')}
              value={groupLabelMap[selectedUser.group] ?? selectedUser.group}
            />
            <DetailItem label={t('description')} value={selectedUser.description} />
            <DetailItem
              label={t('pinned_dashboard')}
              value={String(selectedUser.pinned_dashboard_id)}
            />
            <DetailItem label={t('language')} value={selectedUser.language} />
            <DetailItem label={t('theme')} value={selectedUser.theme} />
            <DetailItem
              label={t('status')}
              value={<StatusPill active={selectedUser.is_enable} />}
            />
            <DetailItem
              label={t('online')}
              value={<OnlinePill active={selectedUser.is_online} />}
            />
            <DetailItem label={t('created_at')} value={selectedUser.created_at} />
            <DetailItem
              label={t('last_modified')}
              value={selectedUser.last_modified_at}
            />
            <DetailItem
              label={t('last_active')}
              value={selectedUser.last_active}
              className="md:col-span-2"
            />
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={formDialog !== null}
        onClose={closeFormDialog}
        title={formDialog?.mode === 'edit' ? `${t('edit')} ${t('user')}` : `${t('add')} ${t('user')}`}
        description={
          formDialog?.mode === 'edit'
            ? t('edit_user_desc')
            : t('create_user_desc')
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              form="user-form"
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {formDialog?.mode === 'edit' ? t('save_changes') : `${t('add')} ${t('user' as any)}`}
            </button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleSaveUser} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t('username')} htmlFor="user_name" hint={t('obj_name_hint' as any)}>
              <input
                id="user_name"
                value={formState.user_name}
                onChange={(event) => updateForm('user_name', event.target.value)}
                className="ip-input"
                placeholder={t('username')}
              />
            </FormField>
            <FormField label={t('display_name')} htmlFor="display_name">
              <input
                id="display_name"
                value={formState.display_name}
                onChange={(event) =>
                  updateForm('display_name', event.target.value)
                }
                className="ip-input"
                placeholder={t('display_name')}
              />
            </FormField>
            <FormField
              label={t('description')}
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
                placeholder={t('description')}
              />
            </FormField>
            <FormField
              label="Email"
              htmlFor="email"
              hint={
                editingUser && !canEditEmail
                  ? 'Only the account owner can change this email.'
                  : undefined
              }
            >
              <input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => updateForm('email', event.target.value)}
                className="ip-input"
                disabled={Boolean(editingUser && !canEditEmail)}
                placeholder="user@ipark.com"
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              hint="At least 8 characters with upper, lower, number, and special character."
            >
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formState.password}
                  onChange={(event) => updateForm('password', event.target.value)}
                  className="ip-input pr-10"
                  placeholder="Password@123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ip-text-muted hover:text-ip-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>
            <FormField label="Group" htmlFor="group">
              <select
                id="group"
                value={formState.group}
                onChange={(event) => updateForm('group', event.target.value)}
                className="ip-input"
              >
                {enabledGroups.map((group) => (
                  <option key={group.id} value={group.group_name}>
                    {group.display_name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Pinned Dashboard" htmlFor="pinned_dashboard_id">
              <select
                id="pinned_dashboard_id"
                value={formState.pinned_dashboard_id}
                onChange={(event) =>
                  updateForm('pinned_dashboard_id', event.target.value)
                }
                className="ip-input"
              >
                {enabledDashboardIds.map((dashboardId) => (
                  <option key={dashboardId} value={dashboardId}>
                    Dashboard #{dashboardId}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Language" htmlFor="language">
              <select
                id="language"
                value={formState.language}
                onChange={(event) => updateForm('language', event.target.value)}
                className="ip-input"
              >
                <option value="English">English</option>
                <option value="Vietnamese">Vietnamese</option>
              </select>
            </FormField>
            <FormField label="Theme" htmlFor="theme">
              <select
                id="theme"
                value={formState.theme}
                onChange={(event) => updateForm('theme', event.target.value)}
                className="ip-input"
              >
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
                <option value="System">System</option>
              </select>
            </FormField>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          ) : null}
        </form>
      </AppDialog>

      <ConfirmDialog
        open={userToToggleStatus !== null}
        onClose={() => setUserToToggleStatusId(null)}
        onConfirm={() => {
          if (!userToToggleStatus) return;

          if (userToToggleStatus.is_enable) {
            disableUser(userToToggleStatus.id);
          } else {
            enableUser(userToToggleStatus.id);
          }
          setUserToToggleStatusId(null);
        }}
        title={
          userToToggleStatus
            ? `${userToToggleStatus.is_enable ? 'Disable' : 'Enable'} ${userToToggleStatus.user_name}?`
            : 'Update status'
        }
        description={
          userToToggleStatus?.is_enable
            ? 'Disabling the account also forces the user offline in the live store.'
            : 'Enabled accounts can sign back in immediately.'
        }
        confirmLabel={userToToggleStatus?.is_enable ? 'Disable User' : 'Enable User'}
        tone={userToToggleStatus?.is_enable ? 'warning' : 'success'}
      />

      <ConfirmDialog
        open={userToRevoke !== null}
        onClose={() => setUserToRevokeId(null)}
        onConfirm={() => {
          if (!userToRevoke) return;

          setOnline(userToRevoke.id, false);
          setUserToRevokeId(null);
        }}
        title={userToRevoke ? `Revoke ${userToRevoke.user_name}?` : 'Revoke user'}
        description="This ends the current session immediately and lets AuthGuard handle the lockout message."
        confirmLabel="Revoke Session"
        tone="warning"
      />

      <ConfirmDialog
        open={userToDelete !== null}
        onClose={() => setUserToDeleteId(null)}
        onConfirm={handleDeleteUser}
        title={userToDelete ? `Delete ${userToDelete.user_name}?` : 'Delete user'}
        description={
          userToDelete
            ? currentUser?.id === userToDelete.id
              ? 'This deletes your current account from the live store. You will be signed out after confirmation.'
              : 'This removes the account from the live session store immediately.'
            : undefined
        }
        confirmLabel="Delete User"
        tone="danger"
      />
    </div>
  );
}

function SettingRow({
  label,
  sublabel,
  checked,
  onToggle,
  disabled = false,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ip-border bg-ip-bg/60 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ip-text">{label}</p>
          <p className="mt-1 text-xs leading-5 text-ip-text-muted">{sublabel}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
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

function RadioPill({
  label,
  checked,
  onClick,
  disabled = false,
}: {
  label: string;
  checked?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`ip-btn rounded-full border px-4 py-2 text-xs font-medium transition-all ${
        checked
          ? 'border-ip-primary bg-ip-primary text-white shadow-md shadow-ip-primary/20'
          : 'border-ip-border bg-ip-surface text-ip-text-secondary hover:border-ip-primary/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {label}
    </button>
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

function StatusPill({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {active ? <UserRoundCheck size={13} /> : <UserRoundX size={13} />}
      {active ? t('enabled') : t('disabled')}
    </span>
  );
}

function OnlinePill({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? <UserRoundCheck size={13} /> : <LockKeyhole size={13} />}
      {active ? t('online') : t('offline')}
    </span>
  );
}

function getEmptyUserForm(
  currentUser: User | null = null,
  defaultGroup = 'users',
  defaultDashboardId = 1
): UserFormState {
  return {
    user_name: '',
    display_name: '',
    description: '',
    email: '',
    password: 'Password@123',
    group: defaultGroup,
    language: currentUser?.language ?? 'English',
    theme: currentUser?.theme ?? 'System',
    pinned_dashboard_id: String(currentUser?.pinned_dashboard_id ?? defaultDashboardId),
  };
}

function getUserFormState(user: User): UserFormState {
  return {
    user_name: user.user_name,
    display_name: user.display_name,
    description: user.description,
    email: user.email,
    password: user.password,
    group: user.group,
    language: user.language,
    theme: user.theme,
    pinned_dashboard_id: String(user.pinned_dashboard_id),
  };
}

function validateUserForm(
  formState: UserFormState,
  users: User[],
  enabledGroups: string[],
  enabledDashboardIds: number[],
  editingUser: User | null,
  t: (key: any) => string,
  currentUserId?: number
) {
  const userName = formState.user_name.trim();
  const displayName = formState.display_name.trim();
  const description = formState.description.trim();
  const email = formState.email.trim();
  const pinnedDashboardId = Number(formState.pinned_dashboard_id);

  if (
    !userName ||
    !displayName ||
    !description ||
    !email ||
    !formState.password
  ) {
    return t('fill_all_user_details');
  }

  if (!/^[A-Za-z0-9_]+$/.test(userName)) {
    return t('username_format_error');
  }

  if (
    users.some(
      (user) => user.user_name === userName && user.id !== editingUser?.id
    )
  ) {
    return t('username_unique_error');
  }

  if (
    editingUser &&
    currentUserId !== editingUser.id &&
    email !== editingUser.email
  ) {
    return t('email_owner_error');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return t('email_format_error');
  }

  if (
    users.some((user) => user.email === email && user.id !== editingUser?.id)
  ) {
    return t('email_unique_error');
  }

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
      formState.password
    )
  ) {
    return t('password_format_error');
  }

  if (!enabledGroups.includes(formState.group)) {
    return t('select_valid_group');
  }

  if (!Number.isInteger(pinnedDashboardId) || pinnedDashboardId < 1) {
    return t('pinned_dashboard_number_error');
  }

  if (!enabledDashboardIds.includes(pinnedDashboardId)) {
    return t('pinned_dashboard_exists_error');
  }

  return null;
}
