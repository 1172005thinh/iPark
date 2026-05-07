'use client';

import { create } from 'zustand';
import type { User, Permission, LoginAttemptTracker, AuthSession } from '@/types/database';
import { GROUP_DB } from '@/data/mock-groups';

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
}

const BLOCK_DURATION_MS = 1 * 60 * 1000; // 1 minute for demo (docs say 30 min, but demo = shorter)
const MAX_ATTEMPTS = 5;

const now = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const getPermissions = (groupName: string): Permission[] => {
  const group = GROUP_DB.find((g) => g.group_name === groupName && g.is_enable);
  return group ? group.permissions_list : [];
};

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

  login: (userName, password, getUserByName, setOnline, logEvent) => {
    const state = get();

    // Check if IP is blocked
    if (state.loginTracker.blockedUntil && Date.now() < state.loginTracker.blockedUntil) {
      return { success: false, error: 'Too many failed attempts. Please try again later.', blocked: true };
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
        extra_info: `Username: ${userName}, Attempt: ${newAttempts}/${MAX_ATTEMPTS}`,
        sent_time: now(),
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
          description: `IP blocked after ${MAX_ATTEMPTS} failed login attempts`,
          at_park_id: 1,
          extra_info: `Username: ${userName}, Blocked for ${BLOCK_DURATION_MS / 60000} minute(s)`,
          sent_time: now(),
          is_acknowledged: false,
        });

        set({ loginTracker: { attempts: newAttempts, blockedUntil } });
        return { success: false, error: 'Too many failed attempts. IP blocked for 1 minute.', blocked: true };
      }

      set({ loginTracker: { ...get().loginTracker, attempts: newAttempts } });
      return { success: false, error: 'Invalid username or password' };
    }

    // Check if user is disabled
    if (!user.is_enable) {
      return { success: false, error: 'This account has been disabled. Contact an administrator.' };
    }

    // Successful login
    const permissions = getPermissions(user.group);
    setOnline(user.id, true);

    // Log successful login event
    logEvent({
      event_code: '007',
      event_name: 'User Logged In',
      event_type: 'info',
      error_code: '0x0000',
      description: `User ${user.display_name} logged in successfully`,
      at_park_id: 1,
      extra_info: `User ID: ${user.id}`,
      sent_time: now(),
      is_acknowledged: false,
    });

    set({
      session: { user, permissions, isAuthenticated: true },
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
    return get().session.permissions.includes(permission);
  },
}));
