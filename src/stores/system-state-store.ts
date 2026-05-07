'use client';

import { create } from 'zustand';
import type { SystemState } from '@/types/database';

const now = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface SystemStateStore {
  states: SystemState[];
  getGlobalState: () => SystemState | undefined;
  getParkState: (parkId: number) => SystemState | undefined;
  toggleMaintenanceMode: (value: boolean) => void;
  toggleEmergencyMode: (value: boolean) => void;
  toggleLights: (parkId: number, value: boolean) => void;
  toggleCameras: (parkId: number, value: boolean) => void;
  toggleSensors: (parkId: number, value: boolean) => void;
}

const initialStates: SystemState[] = [
  {
    id: 1,
    park_id: 0, // Global system state
    maintenance_mode: false,
    emergency_mode: false,
    lights_on: false,
    cameras_on: false,
    sensors_on: false,
    last_modified_at: '2026-03-01 12:00:00',
  },
  {
    id: 2,
    park_id: 1, // Central Park
    maintenance_mode: false,
    emergency_mode: false,
    lights_on: true,
    cameras_on: true,
    sensors_on: true,
    last_modified_at: '2026-03-01 12:00:00',
  },
  {
    id: 3,
    park_id: 2, // North Park
    maintenance_mode: false,
    emergency_mode: false,
    lights_on: false,
    cameras_on: true,
    sensors_on: true,
    last_modified_at: '2026-03-01 12:00:00',
  },
  {
    id: 4,
    park_id: 3, // South Park
    maintenance_mode: false,
    emergency_mode: false,
    lights_on: true,
    cameras_on: true,
    sensors_on: false,
    last_modified_at: '2026-03-01 12:00:00',
  },
];

export const useSystemStateStore = create<SystemStateStore>((set, get) => ({
  states: initialStates,

  getGlobalState: () => get().states.find((s) => s.park_id === 0),

  getParkState: (parkId) => get().states.find((s) => s.park_id === parkId),

  toggleMaintenanceMode: (value) =>
    set((state) => ({
      states: state.states.map((s) =>
        s.park_id === 0
          ? { ...s, maintenance_mode: value, last_modified_at: now() }
          : s
      ),
    })),

  toggleEmergencyMode: (value) =>
    set((state) => ({
      states: state.states.map((s) =>
        s.park_id === 0
          ? { ...s, emergency_mode: value, last_modified_at: now() }
          : s
      ),
    })),

  toggleLights: (parkId, value) =>
    set((state) => ({
      states: state.states.map((s) =>
        s.park_id === parkId
          ? { ...s, lights_on: value, last_modified_at: now() }
          : s
      ),
    })),

  toggleCameras: (parkId, value) =>
    set((state) => ({
      states: state.states.map((s) =>
        s.park_id === parkId
          ? { ...s, cameras_on: value, last_modified_at: now() }
          : s
      ),
    })),

  toggleSensors: (parkId, value) =>
    set((state) => ({
      states: state.states.map((s) =>
        s.park_id === parkId
          ? { ...s, sensors_on: value, last_modified_at: now() }
          : s
      ),
    })),
}));
