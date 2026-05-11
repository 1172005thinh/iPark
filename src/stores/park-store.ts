'use client';

import { create } from 'zustand';
import { PARK_DB } from '@/data/mock-parks';
import type { Park } from '@/types/database';
import {
  cloneSeed,
  failure,
  nextId,
  normalizePark,
  now,
  success,
  type StoreMutationResult,
  validateMoney,
  validateObjectName,
  validatePosInt,
  validateTime,
} from '@/lib/ipark-store-helpers';
import { useSystemStateStore } from '@/stores/system-state-store';

type CreateParkInput = Omit<
  Park,
  'id' | 'created_at' | 'last_modified_at' | 'last_active'
>;

type UpdateParkInput = Partial<
  Omit<Park, 'id' | 'created_at' | 'last_modified_at' | 'last_active'>
>;

interface ParkStore {
  parks: Park[];
  getPark: (id: number) => Park | undefined;
  getParkByName: (parkName: string) => Park | undefined;
  getEnabledParks: () => Park[];
  addPark: (park: CreateParkInput) => StoreMutationResult<Park>;
  updatePark: (id: number, updates: UpdateParkInput) => StoreMutationResult<Park>;
  deletePark: (id: number) => StoreMutationResult<number>;
  setParkEnabled: (id: number, isEnable: boolean) => StoreMutationResult<Park>;
  setParkOperating: (id: number, isOperating: boolean) => StoreMutationResult<Park>;
  touchParkActivity: (id: number) => void;
  refreshData: () => void;
}

const initialParks = cloneSeed(PARK_DB).map((park) => normalizePark(park));

const validatePark = (parks: Park[], candidate: Park) => {
  const parkNameError = validateObjectName(candidate.park_name, 'park_name');
  if (parkNameError) {
    return parkNameError;
  }

  const duplicate = parks.find(
    (park) => park.park_name === candidate.park_name && park.id !== candidate.id,
  );
  if (duplicate) {
    return `Park name "${candidate.park_name}" already exists.`;
  }

  if (!candidate.display_name.trim()) {
    return 'display_name is required.';
  }

  if (!candidate.description.trim()) {
    return 'description is required.';
  }

  if (!candidate.location.trim()) {
    return 'location is required.';
  }

  const startTimeError = validateTime(candidate.start_time, 'start_time');
  if (startTimeError) {
    return startTimeError;
  }

  const endTimeError = validateTime(candidate.end_time, 'end_time');
  if (endTimeError) {
    return endTimeError;
  }

  const feeError = validateMoney(candidate.fee, 'fee');
  if (feeError) {
    return feeError;
  }

  const maxSlotError = validatePosInt(candidate.max_slot, 'max_slot');
  if (maxSlotError) {
    return maxSlotError;
  }

  if (!candidate.is_enable && candidate.is_operating) {
    return 'Disabled parks can not remain operating.';
  }

  return null;
};

export const useParkStore = create<ParkStore>((set, get) => ({
  parks: initialParks,

  getPark: (id) => get().parks.find((park) => park.id === id),

  getParkByName: (parkName) =>
    get().parks.find((park) => park.park_name === parkName),

  getEnabledParks: () => get().parks.filter((park) => park.is_enable),

  addPark: (park) => {
    const timestamp = now();
    const candidate = normalizePark({
      ...park,
      id: nextId(get().parks),
      created_at: timestamp,
      last_modified_at: timestamp,
      last_active: timestamp,
    });
    const error = validatePark(get().parks, candidate);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      parks: [...state.parks, candidate],
    }));
    useSystemStateStore.getState().ensureParkState(candidate.id);

    return success(candidate);
  },

  updatePark: (id, updates) => {
    const currentPark = get().getPark(id);
    if (!currentPark) {
      return failure(`Park ${id} was not found.`);
    }

    const nextPark = normalizePark({
      ...currentPark,
      ...updates,
      last_modified_at: now(),
    });
    const error = validatePark(get().parks, nextPark);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      parks: state.parks.map((park) => (park.id === id ? nextPark : park)),
    }));

    useSystemStateStore.getState().ensureParkState(id);
    if (!nextPark.is_enable) {
      useSystemStateStore.getState().disableParkDevices(id);
    }

    return success(nextPark);
  },

  deletePark: (id) => {
    const park = get().getPark(id);
    if (!park) {
      return failure(`Park ${id} was not found.`);
    }

    set((state) => ({
      parks: state.parks.filter((item) => item.id !== id),
    }));
    useSystemStateStore.getState().removeParkState(id);

    return success(id);
  },

  setParkEnabled: (id, isEnable) =>
    get().updatePark(id, {
      is_enable: isEnable,
      is_operating: isEnable ? get().getPark(id)?.is_operating ?? false : false,
    }),

  setParkOperating: (id, isOperating) => {
    const park = get().getPark(id);
    if (!park) {
      return failure(`Park ${id} was not found.`);
    }

    if (isOperating && !park.is_enable) {
      return failure('Disabled parks can not be set to operating.');
    }

    return get().updatePark(id, { is_operating: isOperating });
  },

  touchParkActivity: (id) => {
    const park = get().getPark(id);
    if (!park) {
      return;
    }

    const timestamp = now();
    set((state) => ({
      parks: state.parks.map((item) =>
        item.id === id
          ? {
              ...item,
              last_active: timestamp,
              last_modified_at: timestamp,
            }
          : item,
      ),
    }));
  },

  refreshData: () => {
    const { parks } = get();
    const timestamp = now();
    const nextParks = parks.map(park => {
      if (!park.is_enable) return park;
      
      const shouldChangeOperating = Math.random() > 0.7;
      const feeChange = (Math.floor(Math.random() * 3) - 1) * 1000; // -1000, 0, +1000
      
      return {
        ...park,
        is_operating: shouldChangeOperating ? !park.is_operating : park.is_operating,
        fee: Math.max(1000, park.fee + feeChange),
        last_active: timestamp,
        last_modified_at: timestamp,
      };
    });

    set({ parks: nextParks });
  },
}));
