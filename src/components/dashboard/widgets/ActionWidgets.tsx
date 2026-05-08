import React, { useState } from 'react';
import { ActionDataSource } from '@/types/database';
import { useSystemStateStore } from '@/stores/system-state-store';

export function ActionWidgets({ ds }: { ds: ActionDataSource }) {
  const { getGlobalState, getParkState, toggleMaintenanceMode, toggleEmergencyMode, toggleLights, toggleCameras, toggleSensors } = useSystemStateStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = () => {
    const confirmed = window.confirm(`Confirm: ${ds.action_id?.replace(/_/g, ' ').toUpperCase()}?`);
    if (!confirmed) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Action "${ds.action_id?.replace(/_/g, ' ')}" executed successfully!`);
    }, 1000);
  };

  if (ds.type === 'action') {
    const isDangerous = ds.action_id === 'fire_alarms' || ds.action_id === 'restart_system';
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={handleAction}
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isDangerous
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-ip-primary hover:bg-ip-primary/90 text-white shadow-lg shadow-ip-primary/30'
          } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            ds.action_id?.replace(/_/g, ' ').toUpperCase() || 'TRIGGER ACTION'
          )}
        </button>
      </div>
    );
  }

  if (ds.type === 'switch') {
    const parkId = ds.park ? parseInt(ds.park) : 0;
    // Read actual state from SYSTEM_STATE_DB
    const globalState = getGlobalState();
    const parkState = getParkState(parkId);

    let isOn = false;
    let label = '';
    let handleToggle: (val: boolean) => void;
    const requiresConfirm = ds.switch_id === 'enable_maintenance_mode' || ds.switch_id === 'enable_emergency_mode' || ds.switch_id === 'turn_onoff_cameras' || ds.switch_id === 'turn_onoff_sensors';

    switch (ds.switch_id) {
      case 'enable_maintenance_mode':
        isOn = globalState?.maintenance_mode ?? false;
        label = 'Maintenance Mode';
        handleToggle = (val) => {
          if (val) {
            if (window.confirm('Enable maintenance mode? All non-admin users will be logged out.')) {
              toggleMaintenanceMode(val);
            }
          } else {
            const pwd = window.prompt('Disable maintenance mode? (Admin password: Admin@123)');
            if (pwd === 'Admin@123') toggleMaintenanceMode(val);
            else if (pwd !== null) alert('Incorrect password.');
          }
        };
        break;
      case 'enable_emergency_mode':
        isOn = globalState?.emergency_mode ?? false;
        label = 'Emergency Mode';
        handleToggle = (val) => {
          if (val) {
            if (window.confirm('⚠️ Enable EMERGENCY mode? All alarms will activate!')) toggleEmergencyMode(val);
          } else {
            const pwd = window.prompt('Disable emergency mode? (Admin password: Admin@123)');
            if (pwd === 'Admin@123') toggleEmergencyMode(val);
            else if (pwd !== null) alert('Incorrect password.');
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
            const pwd = window.prompt('Turn OFF cameras? (Admin password: Admin@123)');
            if (pwd === 'Admin@123') toggleCameras(parkId, val);
            else if (pwd !== null) alert('Incorrect password.');
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
            const pwd = window.prompt('Turn OFF sensors? (Admin password: Admin@123)');
            if (pwd === 'Admin@123') toggleSensors(parkId, val);
            else if (pwd !== null) alert('Incorrect password.');
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

    const btnColor = ds.switch_id === 'enable_emergency_mode' ? 'bg-red-500' :
                     ds.switch_id === 'enable_maintenance_mode' ? 'bg-ip-warning' : 'bg-ip-success';

    return (
      <div className="flex items-center justify-between w-full px-2 gap-2">
        <span className="text-sm font-medium text-ip-text truncate">{label}</span>
        <button
          onClick={() => handleToggle(!isOn)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none border ${
            isOn ? `${btnColor} border-transparent` : 'bg-ip-bg border-ip-border'
          }`}
        >
          <span className="sr-only">Toggle {label}</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">Unknown Action Widget</div>;
}

