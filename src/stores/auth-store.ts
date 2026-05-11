'use client';

import { create } from 'zustand';
import type { User, Permission, LoginAttemptTracker, AuthSession } from '@/types/database';
import { useGroupStore } from '@/stores/group-store';
import { useUserStore } from '@/stores/user-store';
import { nowTimestamp } from '@/lib/ipark-utils';

interface AuthStore {
  session: AuthSession;
  loginTracker: LoginAttemptTracker;
  login: (
    userName: string,
    password: string,
    getUserByName: (name: string) => User | undefined,
    setOnline: (id: number, online: boolean) => void,
    logEvent: (event: { event_code: string; event_name: string; event_type: 'info' | 'warning' | 'error'; error_code: string; description: string; at_park_id: number; extra_info: string; sent_time: string; is_acknowledged: boolean }) => void,
  ) => { success: boolean; error?: string; blocked?: boolean };
  logout: (setOnline: (id: number, online: boolean) => void) => void;
  isBlocked: () => boolean;
  hasPermission: (permission: Permission) => boolean;
  guestSettings: {
    language: string;
    theme: 'Light' | 'Dark' | 'System';
  };
  setGuestSettings: (settings: Partial<AuthStore['guestSettings']>) => void;
  refreshSessionFromStores: () => void;
}

const BLOCK_DURATION_MS = 1 * 60 * 1000; // 1 minute for demo (docs say 30 min, but demo = shorter)
const MAX_ATTEMPTS = 5;

const getPermissions = (groupName: string): Permission[] => {
  return useGroupStore.getState().getPermissionsForGroup(groupName);
};

const samePermissions = (left: Permission[], right: Permission[]) =>
  left.length === right.length &&
  left.every((permission, index) => permission === right[index]);

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: {
    user: null,
    permissions: [],
    isAuthenticated: false,
  },
  loginTracker: {
    attempts: 0,
    blockedUntil: null,
  },
  guestSettings: {
    language: 'English',
    theme: 'System',
  },

  setGuestSettings: (settings) =>
    set((state) => ({
      guestSettings: { ...state.guestSettings, ...settings },
    })),

  login: (userName, password, getUserByName, setOnline, logEvent) => {
    const state = get();

    // Check if IP is blocked
    if (state.loginTracker.blockedUntil && Date.now() < state.loginTracker.blockedUntil) {
      return { success: false, error: 'error_too_many_attempts', blocked: true };
    }

    // Clear block if expired
    if (state.loginTracker.blockedUntil && Date.now() >= state.loginTracker.blockedUntil) {
      set({ loginTracker: { attempts: 0, blockedUntil: null } });
    }

    const user = getUserByName(userName);

    if (!user || user.password !== password) {
      const newAttempts = get().loginTracker.attempts + 1;

      // Log failed login event
      logEvent({
        event_code: '005',
        event_name: 'Login Failed',
        event_type: 'warning',
        error_code: '0x0010',
        description: `Login attempt failed for username: ${userName}`,
        at_park_id: 1,
        extra_info: `Username: ${userName}, Attempt: ${newAttempts}/5`,
        sent_time: nowTimestamp(),
        is_acknowledged: false,
      });

      if (newAttempts >= MAX_ATTEMPTS) {
        const blockedUntil = Date.now() + BLOCK_DURATION_MS;

        // Log IP blocked event
        logEvent({
          event_code: '006',
          event_name: 'IP Blocked',
          event_type: 'warning',
          error_code: '0x0011',
          description: `IP blocked after 5 failed login attempts`,
          at_park_id: 1,
          extra_info: `Username: ${userName}, Blocked for 1 minute(s)`,
          sent_time: nowTimestamp(),
          is_acknowledged: false,
        });

        set({ loginTracker: { attempts: newAttempts, blockedUntil } });
        return { success: false, error: 'error_ip_blocked', blocked: true };
      }

      set({ loginTracker: { ...get().loginTracker, attempts: newAttempts } });
      return { success: false, error: 'error_invalid_credentials' };
    }

    // Check if user is disabled
    if (!user.is_enable) {
      return { success: false, error: 'error_account_disabled' };
    }

    // Successful login
    const assignedGroup = useGroupStore.getState().getGroupByName(user.group);
    if (!assignedGroup || !assignedGroup.is_enable) {
      return {
        success: false,
        error: 'error_group_disabled',
      };
    }

    const permissions = getPermissions(user.group);
    setOnline(user.id, true);
    useGroupStore.getState().touchGroupActivity(user.group);

    // Log successful login event
    logEvent({
      event_code: '007',
      event_name: 'User Logged In',
      event_type: 'info',
      error_code: '0x0000',
      description: `User ${user.display_name} logged in successfully`,
      at_park_id: 1,
      extra_info: `User ID: ${user.id}`,
      sent_time: nowTimestamp(),
      is_acknowledged: false,
    });

    const currentUser = useUserStore.getState().getUser(user.id) ?? user;
    
    // Parse guest settings to main application
    useUserStore.getState().updateUser(user.id, { 
      language: get().guestSettings.language as any, 
      theme: get().guestSettings.theme as any 
    });

    set({
      session: { 
        user: useUserStore.getState().getUser(user.id) ?? currentUser, 
        permissions, 
        isAuthenticated: true 
      },
      loginTracker: { attempts: 0, blockedUntil: null },
    });

    return { success: true };
  },

  logout: (setOnline) => {
    const { session } = get();
    if (session.user) {
      setOnline(session.user.id, false);
    }
    set({
      session: { user: null, permissions: [], isAuthenticated: false },
    });
  },

  isBlocked: () => {
    const { blockedUntil } = get().loginTracker;
    if (!blockedUntil) return false;
    if (Date.now() >= blockedUntil) {
      set({ loginTracker: { attempts: 0, blockedUntil: null } });
      return false;
    }
    return true;
  },

  hasPermission: (permission) => {
    const sessionUser = get().session.user;
    if (!sessionUser) {
      return false;
    }

    return getPermissions(sessionUser.group).includes(permission);
  },

  refreshSessionFromStores: () => {
    const { session } = get();
    if (!session.user) {
      return;
    }

    const currentUser = useUserStore.getState().getUser(session.user.id);
    if (!currentUser || !currentUser.is_enable || !currentUser.is_online) {
      set({
        session: { user: null, permissions: [], isAuthenticated: false },
      });
      return;
    }

    const assignedGroup = useGroupStore.getState().getGroupByName(currentUser.group);
    if (!assignedGroup || !assignedGroup.is_enable) {
      set({
        session: {
          user: currentUser,
          permissions: [],
          isAuthenticated: true,
        },
      });
      return;
    }

    const permissions = getPermissions(currentUser.group);
    const shouldUpdate =
      session.user !== currentUser ||
      !samePermissions(session.permissions, permissions) ||
      !session.isAuthenticated;

    if (shouldUpdate) {
      set({
        session: {
          user: currentUser,
          permissions,
          isAuthenticated: true,
        },
      });
    }
  },
}));

const refreshSession = () => {
  useAuthStore.getState().refreshSessionFromStores();
};

useGroupStore.subscribe(() => {
  refreshSession();
});

useUserStore.subscribe(() => {
  refreshSession();
});
