'use client';

import { create } from 'zustand';
import { GROUP_DB } from '@/data/mock-groups';
import type { Group, Permission } from '@/types/database';
import {
  cloneSeed,
  failure,
  nextId,
  normalizeGroup,
  now,
  success,
  type StoreMutationResult,
  validateObjectName,
} from '@/lib/ipark-store-helpers';
import { useUserStore } from '@/stores/user-store';

type CreateGroupInput = Omit<
  Group,
  'id' | 'created_at' | 'last_modified_at' | 'last_active'
>;

type UpdateGroupInput = Partial<
  Omit<Group, 'id' | 'created_at' | 'last_modified_at' | 'last_active'>
>;

interface GroupStore {
  groups: Group[];
  getGroup: (id: number) => Group | undefined;
  getGroupByName: (groupName: string) => Group | undefined;
  getEnabledGroups: () => Group[];
  getPermissionsForGroup: (groupName: string) => Permission[];
  addGroup: (group: CreateGroupInput) => StoreMutationResult<Group>;
  updateGroup: (id: number, updates: UpdateGroupInput) => StoreMutationResult<Group>;
  deleteGroup: (id: number) => StoreMutationResult<number>;
  setGroupEnabled: (id: number, isEnable: boolean) => StoreMutationResult<Group>;
  setGroupActive: (id: number, isActive: boolean) => StoreMutationResult<Group>;
  touchGroupActivity: (groupName: string) => void;
}

const initialGroups = cloneSeed(GROUP_DB).map((group) => normalizeGroup(group));

const validateGroup = (
  groups: Group[],
  candidate: Group,
  previousGroupName?: string,
) => {
  const nameError = validateObjectName(candidate.group_name, 'group_name');
  if (nameError) {
    return nameError;
  }

  const duplicate = groups.find(
    (group) =>
      group.group_name === candidate.group_name &&
      group.id !== candidate.id,
  );

  if (duplicate) {
    return `Group name "${candidate.group_name}" already exists.`;
  }

  if (!candidate.display_name.trim()) {
    return 'display_name is required.';
  }

  if (!candidate.description.trim()) {
    return 'description is required.';
  }

  if (!candidate.is_enable && candidate.is_active) {
    return 'Disabled groups can not remain active.';
  }

  if (
    previousGroupName &&
    previousGroupName !== candidate.group_name &&
    useUserStore.getState().users.some((user) => user.group === candidate.group_name)
  ) {
    return `Users are already assigned to "${candidate.group_name}".`;
  }

  return null;
};

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: initialGroups,

  getGroup: (id) => get().groups.find((group) => group.id === id),

  getGroupByName: (groupName) =>
    get().groups.find((group) => group.group_name === groupName),

  getEnabledGroups: () => get().groups.filter((group) => group.is_enable),

  getPermissionsForGroup: (groupName) => {
    const group = get().groups.find(
      (item) => item.group_name === groupName && item.is_enable,
    );

    return group ? [...group.permissions_list] : [];
  },

  addGroup: (group) => {
    const timestamp = now();
    const candidate = normalizeGroup({
      ...group,
      id: nextId(get().groups),
      created_at: timestamp,
      last_modified_at: timestamp,
      last_active: timestamp,
    });
    const error = validateGroup(get().groups, candidate);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      groups: [...state.groups, candidate],
    }));

    return success(candidate);
  },

  updateGroup: (id, updates) => {
    const currentGroup = get().getGroup(id);
    if (!currentGroup) {
      return failure(`Group ${id} was not found.`);
    }

    const timestamp = now();
    const nextGroup = normalizeGroup({
      ...currentGroup,
      ...updates,
      last_modified_at: timestamp,
      last_active:
        updates.is_active === true && currentGroup.last_active
          ? timestamp
          : currentGroup.last_active,
    });

    const error = validateGroup(get().groups, nextGroup, currentGroup.group_name);
    if (error) {
      return failure(error);
    }

    set((state) => ({
      groups: state.groups.map((group) => (group.id === id ? nextGroup : group)),
    }));

    if (currentGroup.group_name !== nextGroup.group_name) {
      useUserStore
        .getState()
        .renameUsersGroup(currentGroup.group_name, nextGroup.group_name);
    }

    return success(nextGroup);
  },

  deleteGroup: (id) => {
    const group = get().getGroup(id);
    if (!group) {
      return failure(`Group ${id} was not found.`);
    }

    const assignedUsers = useUserStore
      .getState()
      .users.filter((user) => user.group === group.group_name);

    if (assignedUsers.length > 0) {
      return failure(
        `Can not delete "${group.group_name}" while ${assignedUsers.length} user(s) are still assigned to it.`,
      );
    }

    set((state) => ({
      groups: state.groups.filter((item) => item.id !== id),
    }));

    return success(id);
  },

  setGroupEnabled: (id, isEnable) =>
    get().updateGroup(id, {
      is_enable: isEnable,
      is_active: isEnable ? get().getGroup(id)?.is_active ?? false : false,
    }),

  setGroupActive: (id, isActive) => {
    const group = get().getGroup(id);
    if (!group) {
      return failure(`Group ${id} was not found.`);
    }

    if (isActive && !group.is_enable) {
      return failure('Disabled groups can not be marked active.');
    }

    return get().updateGroup(id, {
      is_active: isActive,
    });
  },

  touchGroupActivity: (groupName) => {
    const group = get().getGroupByName(groupName);
    if (!group || !group.is_enable) {
      return;
    }

    const timestamp = now();
    set((state) => ({
      groups: state.groups.map((item) =>
        item.id === group.id
          ? {
              ...item,
              is_active: true,
              last_active: timestamp,
              last_modified_at: timestamp,
            }
          : item,
      ),
    }));
  },
}));
