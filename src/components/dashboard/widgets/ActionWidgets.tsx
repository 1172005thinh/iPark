import React, { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { AppDialog, type DialogTone } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { ActionDataSource } from '@/types/database';
import { useSystemStateStore } from '@/stores/system-state-store';
import { useTranslation } from '@/lib/i18n';

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: DialogTone;
  onConfirm: () => void;
};

type PasswordState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: DialogTone;
  value: string;
  error: string;
  onSubmit: (value: string) => string | void;
};

type StatusState = {
  title: string;
  description: string;
  tone: DialogTone;
};

export function ActionWidgets({ ds }: { ds: ActionDataSource }) {
  const { t } = useTranslation();
  const {
    getGlobalState,
    getParkState,
    toggleMaintenanceMode,
    toggleEmergencyMode,
    toggleLights,
    toggleCameras,
    toggleSensors,
  } = useSystemStateStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [passwordState, setPasswordState] = useState<PasswordState | null>(null);
  const [statusState, setStatusState] = useState<StatusState | null>(null);

  const showStatus = (
    title: string,
    description: string,
    tone: DialogTone = 'success'
  ) => {
    setStatusState({ title, description, tone });
  };

  const promptForAdminPassword = ({
    title,
    description,
    confirmLabel,
    tone = 'warning',
    onApproved,
  }: {
    title: string;
    description: string;
    confirmLabel: string;
    tone?: DialogTone;
    onApproved: () => void;
  }) => {
    setPasswordState({
      title,
      description,
      confirmLabel,
      tone,
      value: '',
      error: '',
      onSubmit: (value) => {
        if (value !== 'Admin@123') {
          return t('incorrect_admin_password');
        }

        onApproved();
      },
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordState) return;

    const result = passwordState.onSubmit(passwordState.value);
    if (typeof result === 'string') {
      setPasswordState((current) =>
        current ? { ...current, error: result } : current
      );
      return;
    }

    setPasswordState(null);
  };

  const renderDialogs = () => (
    <>
      <ConfirmDialog
        open={confirmState !== null}
        onClose={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
        title={confirmState?.title ?? t('confirm')}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? t('confirm')}
        tone={confirmState?.tone ?? 'default'}
      />

      <AppDialog
        open={passwordState !== null}
        onClose={() => setPasswordState(null)}
        title={passwordState?.title ?? t('admin_password')}
        description={passwordState?.description}
        icon={<KeyRound size={22} />}
        tone={passwordState?.tone ?? 'warning'}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPasswordState(null)}
              className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              form="action-password-form"
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {passwordState?.confirmLabel ?? t('confirm')}
            </button>
          </div>
        }
      >
        <form
          id="action-password-form"
          onSubmit={handlePasswordSubmit}
          className="space-y-4"
        >
          <label className="block" htmlFor="action-password-input">
            <span className="mb-1.5 block text-sm font-medium text-ip-text">
              {t('admin_password')}
            </span>
            <input
              id="action-password-input"
              type="password"
              value={passwordState?.value ?? ''}
              onChange={(event) =>
                setPasswordState((current) =>
                  current
                    ? { ...current, value: event.target.value, error: '' }
                    : current
                )
              }
              className="ip-input"
              placeholder="Admin@123"
              autoComplete="current-password"
            />
          </label>

          {passwordState?.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {passwordState.error}
            </div>
          ) : null}
        </form>
      </AppDialog>

      <AppDialog
        open={statusState !== null}
        onClose={() => setStatusState(null)}
        title={statusState?.title ?? t('action_executed')}
        description={statusState?.description}
        icon={
          statusState?.tone === 'danger' ? (
            <ShieldAlert size={22} />
          ) : (
            <CheckCircle2 size={22} />
          )
        }
        tone={statusState?.tone ?? 'success'}
        size="sm"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStatusState(null)}
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {t('close')}
            </button>
          </div>
        }
      />
    </>
  );

  const handleAction = () => {
    const rawActionLabel = getActionLabel(ds.action_id ?? 'trigger_action', t);
    const isDangerous =
      ds.action_id === 'fire_alarms' || ds.action_id === 'restart_system';

    setConfirmState({
      title: t('confirm_action_now').replace('{action}', rawActionLabel),
      description: isDangerous
        ? t('dangerous_action_desc')
        : t('standard_action_desc'),
      confirmLabel: rawActionLabel,
      tone: isDangerous ? 'danger' : 'info',
      onConfirm: () => {
        setConfirmState(null);
        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
          showStatus(t('action_executed'), t('completed_successfully').replace('{action}', rawActionLabel));
        }, 1000);
      },
    });
  };

  if (ds.type === 'action') {
    const isDangerous =
      ds.action_id === 'fire_alarms' || ds.action_id === 'restart_system';

    return (
      <>
        <div className="flex h-full items-center justify-center">
          <button
            onClick={handleAction}
            disabled={isProcessing}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isDangerous
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                : 'bg-ip-primary text-white shadow-lg shadow-ip-primary/30 hover:bg-ip-primary/90'
            } ${isProcessing ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              getActionLabel(ds.action_id ?? 'trigger_action', t)
            )}
          </button>
        </div>
        {renderDialogs()}
      </>
    );
  }

  if (ds.type === 'switch') {
    const parkId = ds.park ? parseInt(ds.park) : 0;
    const globalState = getGlobalState();
    const parkState = getParkState(parkId);

    let isOn = false;
    let label = '';
    let handleToggle: (val: boolean) => void;

    switch (ds.switch_id) {
      case 'enable_maintenance_mode':
        isOn = globalState?.maintenance_mode ?? false;
        label = t('widget_maintenance_mode');
        handleToggle = (val) => {
          if (val) {
            setConfirmState({
              title: t('enable_maintenance_mode_confirm'),
              description: t('maintenance_mode_warning'),
              confirmLabel: t('enable_mode'),
              tone: 'warning',
              onConfirm: () => {
                toggleMaintenanceMode(val);
                setConfirmState(null);
                showStatus(
                  t('maintenance_mode_enabled_title'),
                  t('maintenance_mode_enabled_desc'),
                  'warning'
                );
              },
            });
          } else {
            promptForAdminPassword({
              title: t('disable_maintenance_mode'),
              description: t('restore_access_desc'),
              confirmLabel: t('disable_mode'),
              onApproved: () => {
                toggleMaintenanceMode(val);
                showStatus(
                  t('maintenance_mode_disabled_title'),
                  t('maintenance_mode_disabled_desc')
                );
              },
            });
          }
        };
        break;
      case 'enable_emergency_mode':
        isOn = globalState?.emergency_mode ?? false;
        label = t('widget_emergency_mode');
        handleToggle = (val) => {
          if (val) {
            setConfirmState({
              title: t('enable_emergency_mode_confirm'),
              description: t('emergency_mode_warning'),
              confirmLabel: t('enable_emergency'),
              tone: 'danger',
              onConfirm: () => {
                toggleEmergencyMode(val);
                setConfirmState(null);
                showStatus(
                  t('emergency_mode_enabled_title'),
                  t('emergency_mode_enabled_desc'),
                  'danger'
                );
              },
            });
          } else {
            promptForAdminPassword({
              title: t('disable_emergency_mode'),
              description: t('return_normal_desc'),
              confirmLabel: t('disable_emergency'),
              tone: 'danger',
              onApproved: () => {
                toggleEmergencyMode(val);
                showStatus(
                  t('emergency_mode_disabled_title'),
                  t('emergency_mode_disabled_desc')
                );
              },
            });
          }
        };
        break;
      case 'turn_onoff_lights':
        isOn = parkState?.lights_on ?? false;
        label = t('lights');
        handleToggle = (val) => toggleLights(parkId, val);
        break;
      case 'turn_onoff_cameras':
        isOn = parkState?.cameras_on ?? false;
        label = t('cameras');
        handleToggle = (val) => {
          if (!val) {
            promptForAdminPassword({
              title: t('turn_off_cameras'),
              description: t('turn_off_cameras_desc'),
              confirmLabel: t('turn_off_cameras'),
              onApproved: () => {
                toggleCameras(parkId, val);
                showStatus(
                  t('cameras_turned_off_title'),
                  t('cameras_turned_off_desc').replace('{id}', String(parkId)),
                  'warning'
                );
              },
            });
          } else {
            toggleCameras(parkId, val);
          }
        };
        break;
      case 'turn_onoff_sensors':
        isOn = parkState?.sensors_on ?? false;
        label = t('sensors');
        handleToggle = (val) => {
          if (!val) {
            promptForAdminPassword({
              title: t('turn_off_sensors'),
              description: t('turn_off_sensors_desc'),
              confirmLabel: t('turn_off_sensors'),
              onApproved: () => {
                toggleSensors(parkId, val);
                showStatus(
                  t('sensors_turned_off_title'),
                  t('sensors_turned_off_desc').replace('{id}', String(parkId)),
                  'warning'
                );
              },
            });
          } else {
            toggleSensors(parkId, val);
          }
        };
        break;
      default:
        isOn = false;
        label = t((ds.switch_id as any) || 'unknown');
        handleToggle = () => {};
    }

    const btnColor =
      ds.switch_id === 'enable_emergency_mode'
        ? 'bg-red-500'
        : ds.switch_id === 'enable_maintenance_mode'
          ? 'bg-ip-warning'
          : 'bg-ip-success';

    return (
      <>
        <div className="flex w-full items-center justify-between gap-2 px-2">
          <span className="truncate text-sm font-medium text-ip-text">{label}</span>
          <button
            onClick={() => handleToggle(!isOn)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus:outline-none ${
              isOn ? `${btnColor} border-transparent` : 'bg-ip-bg border-ip-border'
            }`}
          >
            <span className="sr-only">Toggle {label}</span>
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {renderDialogs()}
      </>
    );
  }

  return (
    <div className="text-center text-xs text-ip-text-muted">
      {t('unknown_widget')}
    </div>
  );
}

function getActionLabel(value: string, t: (key: any) => string) {
  return t(value as any).toUpperCase();
}
