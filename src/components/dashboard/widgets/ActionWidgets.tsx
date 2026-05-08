import React, { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { AppDialog, type DialogTone } from '@/components/dialogs/AppDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { ActionDataSource } from '@/types/database';
import { useSystemStateStore } from '@/stores/system-state-store';

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
          return 'Incorrect admin password.';
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
        title={confirmState?.title ?? 'Confirm action'}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        tone={confirmState?.tone ?? 'default'}
      />

      <AppDialog
        open={passwordState !== null}
        onClose={() => setPasswordState(null)}
        title={passwordState?.title ?? 'Protected action'}
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
              Cancel
            </button>
            <button
              type="submit"
              form="action-password-form"
              className="ip-btn rounded-xl bg-ip-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90"
            >
              {passwordState?.confirmLabel ?? 'Confirm'}
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
              Admin Password
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
        title={statusState?.title ?? 'Action completed'}
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
              Close
            </button>
          </div>
        }
      />
    </>
  );

  const handleAction = () => {
    const actionLabel = getActionLabel(ds.action_id ?? 'trigger_action');
    const isDangerous =
      ds.action_id === 'fire_alarms' || ds.action_id === 'restart_system';

    setConfirmState({
      title: `${actionLabel} now?`,
      description: isDangerous
        ? 'This action executes immediately across the system and should only be used for live operational scenarios.'
        : 'This action executes immediately for the current dashboard session.',
      confirmLabel: actionLabel,
      tone: isDangerous ? 'danger' : 'info',
      onConfirm: () => {
        setConfirmState(null);
        setIsProcessing(true);

        setTimeout(() => {
          setIsProcessing(false);
          showStatus('Action executed', `${actionLabel} completed successfully.`);
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
                Processing...
              </span>
            ) : (
              getActionLabel(ds.action_id ?? 'trigger_action')
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
        label = 'Maintenance Mode';
        handleToggle = (val) => {
          if (val) {
            setConfirmState({
              title: 'Enable maintenance mode?',
              description:
                'All non-admin users will be logged out and kept off the system until maintenance mode is disabled.',
              confirmLabel: 'Enable Mode',
              tone: 'warning',
              onConfirm: () => {
                toggleMaintenanceMode(val);
                setConfirmState(null);
                showStatus(
                  'Maintenance mode enabled',
                  'Non-admin sessions will now be forced out by AuthGuard.',
                  'warning'
                );
              },
            });
          } else {
            promptForAdminPassword({
              title: 'Disable maintenance mode',
              description:
                'Enter the admin password to restore standard access.',
              confirmLabel: 'Disable Mode',
              onApproved: () => {
                toggleMaintenanceMode(val);
                showStatus(
                  'Maintenance mode disabled',
                  'Standard access has been restored for non-admin users.'
                );
              },
            });
          }
        };
        break;
      case 'enable_emergency_mode':
        isOn = globalState?.emergency_mode ?? false;
        label = 'Emergency Mode';
        handleToggle = (val) => {
          if (val) {
            setConfirmState({
              title: 'Enable emergency mode?',
              description:
                'All alarms will activate and the system will shift into emergency response mode.',
              confirmLabel: 'Enable Emergency',
              tone: 'danger',
              onConfirm: () => {
                toggleEmergencyMode(val);
                setConfirmState(null);
                showStatus(
                  'Emergency mode enabled',
                  'Emergency responses are active across the system.',
                  'danger'
                );
              },
            });
          } else {
            promptForAdminPassword({
              title: 'Disable emergency mode',
              description:
                'Enter the admin password to return the system to normal operation.',
              confirmLabel: 'Disable Emergency',
              tone: 'danger',
              onApproved: () => {
                toggleEmergencyMode(val);
                showStatus(
                  'Emergency mode disabled',
                  'The system has returned to normal operating mode.'
                );
              },
            });
          }
        };
        break;
      case 'turn_onoff_lights':
        isOn = parkState?.lights_on ?? false;
        label = 'Lights';
        handleToggle = (val) => toggleLights(parkId, val);
        break;
      case 'turn_onoff_cameras':
        isOn = parkState?.cameras_on ?? false;
        label = 'Cameras';
        handleToggle = (val) => {
          if (!val) {
            promptForAdminPassword({
              title: 'Turn off cameras',
              description:
                'Enter the admin password before disabling visual monitoring for this park.',
              confirmLabel: 'Turn Off Cameras',
              onApproved: () => {
                toggleCameras(parkId, val);
                showStatus(
                  'Cameras turned off',
                  `Camera coverage is now disabled for park #${parkId}.`,
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
        label = 'Sensors';
        handleToggle = (val) => {
          if (!val) {
            promptForAdminPassword({
              title: 'Turn off sensors',
              description:
                'Enter the admin password before disabling sensor coverage for this park.',
              confirmLabel: 'Turn Off Sensors',
              onApproved: () => {
                toggleSensors(parkId, val);
                showStatus(
                  'Sensors turned off',
                  `Sensor coverage is now disabled for park #${parkId}.`,
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
        label = String(ds.switch_id ?? '').replace(/_/g, ' ') || 'Unknown';
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
      Unknown Action Widget
    </div>
  );
}

function getActionLabel(value: string) {
  return value.replace(/_/g, ' ').toUpperCase();
}
