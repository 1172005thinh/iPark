'use client';

import { create } from 'zustand';
import { STAFF_DB } from '@/data/mock-staffs';
import type { Staff } from '@/types/database';
import {
  cloneSeed,
  failure,
  nextId,
  normalizeStaff,
  now,
  success,
  type StoreMutationResult,
  validateMoney,
  validateObjectName,
  validatePosInt,
  validateTime,
} from '@/lib/ipark-store-helpers';
import { useParkStore } from '@/stores/park-store';

type CreateStaffInput = Omit<
  Staff,
  'id' | 'created_at' | 'last_modified_at' | 'last_active'
>;

type UpdateStaffInput = Partial<
  Omit<Staff, 'id' | 'created_at' | 'last_modified_at' | 'last_active'>
>;

interface StaffStore {
  staffs: Staff[];
  getStaff: (id: number) => Staff | undefined;
  getStaffByName: (staffName: string) => Staff | undefined;
  getStaffsByPark: (parkId: number) => Staff[];
  getEnabledStaffs: () => Staff[];
  addStaff: (staff: CreateStaffInput) => StoreMutationResult<Staff>;
  updateStaff: (id: number, updates: UpdateStaffInput) => StoreMutationResult<Staff>;
  deleteStaff: (id: number) => StoreMutationResult<number>;
  setStaffEnabled: (id: number, isEnable: boolean) => StoreMutationResult<Staff>;
  setStaffShift: (id: number, isOnShift: boolean) => StoreMutationResult<Staff>;
  touchStaffActivity: (id: number) => void;
}

const initialStaffs = cloneSeed(STAFF_DB).map((staff) => normalizeStaff(staff));

const validateStaff = (staffs: Staff[], candidate: Staff) => {
  const staffNameError = validateObjectName(candidate.staff_name, 'staff_name');
  if (staffNameError) {
    return staffNameError;
  }

  const duplicate = staffs.find(
    (staff) =>
      staff.staff_name === candidate.staff_name && staff.id !== candidate.id,
  );
  if (duplicate) {
    return `Staff name "${candidate.staff_name}" already exists.`;
  }

  if (!candidate.display_name.trim()) {
    return 'display_name is required.';
  }

  if (!candidate.description.trim()) {
    return 'description is required.';
  }

  const parkIdError = validatePosInt(candidate.at_park_id, 'at_park_id');
  if (parkIdError) {
    return parkIdError;
  }

  const park = useParkStore.getState().getPark(candidate.at_park_id);
  if (!park) {
    return `Park ${candidate.at_park_id} does not exist.`;
  }

  if (!park.is_enable) {
    return `Park ${candidate.at_park_id} is disabled and can not receive staff assignments.`;
  }

  const startTimeError = validateTime(candidate.start_time, 'start_time');
  if (startTimeError) {
    return startTimeError;
  }

  const endTimeError = validateTime(candidate.end_time, 'end_time');
  if (endTimeError) {
    return endTimeError;
  }

  const paymentError = validateMoney(candidate.payment, 'payment');
  if (paymentError) {
    return paymentError;
  }

  if (!candidate.role.trim()) {
    return 'role is required.';
  }

  if (!candidate.is_enable && candidate.is_on_shift) {
    return 'Disabled staff can not remain on shift.';
  }

  if (candidate.is_on_shift && !park.is_operating) {
    return `Park ${candidate.at_park_id} is not operating, so staff can not be put on shift.`;
  }

  return null;
};

export const useStaffStore = create<StaffStore>((set, get) => ({
  staffs: initialStaffs,

  getStaff: (id) => get().staffs.find((staff) => staff.id === id),

  getStaffByName: (staffName) =>
    get().staffs.find((staff) => staff.staff_name === staffName),

  getStaffsByPark: (parkId) =>
    get().staffs.filter((staff) => staff.at_park_id === parkId),

  getEnabledStaffs: () => get().staffs.filter((staff) => staff.is_enable),

  addStaff: (staff) => {
    const timestamp = now();
    const candidate = normalizeStaff({
      ...staff,
      id: nextId(get().staffs),
      created_at: timestamp,
      last_modified_at: timestamp,
      last_active: timestamp,
    });
    const error = validateStaff(get().staffs, candidate);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      staffs: [...state.staffs, candidate],
    }));

    return success(candidate);
  },

  updateStaff: (id, updates) => {
    const currentStaff = get().getStaff(id);
    if (!currentStaff) {
      return failure(`Staff ${id} was not found.`);
    }

    const nextStaff = normalizeStaff({
      ...currentStaff,
      ...updates,
      last_modified_at: now(),
    });
    const error = validateStaff(get().staffs, nextStaff);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      staffs: state.staffs.map((staff) => (staff.id === id ? nextStaff : staff)),
    }));

    return success(nextStaff);
  },

  deleteStaff: (id) => {
    const staff = get().getStaff(id);
    if (!staff) {
      return failure(`Staff ${id} was not found.`);
    }

    set((state) => ({
      staffs: state.staffs.filter((item) => item.id !== id),
    }));

    return success(id);
  },

  setStaffEnabled: (id, isEnable) =>
    get().updateStaff(id, {
      is_enable: isEnable,
      is_on_shift: isEnable ? get().getStaff(id)?.is_on_shift ?? false : false,
    }),

  setStaffShift: (id, isOnShift) => {
    const staff = get().getStaff(id);
    if (!staff) {
      return failure(`Staff ${id} was not found.`);
    }

    if (isOnShift && !staff.is_enable) {
      return failure('Disabled staff can not be put on shift.');
    }

    return get().updateStaff(id, { is_on_shift: isOnShift });
  },

  touchStaffActivity: (id) => {
    const staff = get().getStaff(id);
    if (!staff) {
      return;
    }

    const timestamp = now();
    set((state) => ({
      staffs: state.staffs.map((item) =>
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
}));

const syncStaffsFromParks = () => {
  const parkMap = new Map(
    useParkStore.getState().parks.map((park) => [park.id, park]),
  );
  const state = useStaffStore.getState();
  const timestamp = now();
  let changed = false;

  const nextStaffs = state.staffs.flatMap((staff) => {
    const park = parkMap.get(staff.at_park_id);

    if (!park) {
      changed = true;
      return [];
    }

    if (!park.is_enable && staff.is_on_shift) {
      changed = true;
      return [
        {
          ...staff,
          is_on_shift: false,
          last_modified_at: timestamp,
        },
      ];
    }

    return [staff];
  });

  if (changed) {
    useStaffStore.setState({ staffs: nextStaffs });
  }
};

useParkStore.subscribe(() => {
  syncStaffsFromParks();
});
