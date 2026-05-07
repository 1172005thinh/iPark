'use client';

import { create } from 'zustand';
import type { User } from '@/types/database';

const now = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface UserStore {
  users: User[];
  getUser: (id: number) => User | undefined;
  getUserByName: (userName: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  updateUser: (id: number, updates: Partial<User>) => void;
  addUser: (user: Omit<User, 'id' | 'created_at' | 'last_modified_at' | 'last_active'>) => void;
  deleteUser: (id: number) => void;
  setOnline: (id: number, online: boolean) => void;
  disableUser: (id: number) => void;
  enableUser: (id: number) => void;
}

const initialUsers: User[] = [
  {
    id: 1,
    user_name: 'admin',
    display_name: 'Administrator',
    description: 'Administrator of the iPark web-application',
    email: 'admin@ipark.com',
    password: 'Admin@123',
    group: 'admins',
    language: 'English',
    theme: 'System',
    pinned_dashboard_id: 1,
    is_enable: true,
    created_at: '2026-01-01 00:00:00',
    last_modified_at: '2026-02-01 12:59:59',
    last_active: '2026-03-01 17:45:00',
    is_online: false,
  },
  {
    id: 2,
    user_name: 'user1',
    display_name: 'User 1',
    description: 'Regular user of the iPark',
    email: 'user1@ipark.com',
    password: 'User1@123',
    group: 'users',
    language: 'Vietnamese',
    theme: 'Dark',
    pinned_dashboard_id: 2,
    is_enable: true,
    created_at: '2026-01-01 00:00:00',
    last_modified_at: '2026-02-01 12:59:59',
    last_active: '2026-03-01 17:45:00',
    is_online: false,
  },
  {
    id: 3,
    user_name: 'manager1',
    display_name: 'Manager One',
    description: 'Park operations manager',
    email: 'manager1@ipark.com',
    password: 'Manager@1',
    group: 'managers',
    language: 'English',
    theme: 'Light',
    pinned_dashboard_id: 3,
    is_enable: true,
    created_at: '2026-01-15 00:00:00',
    last_modified_at: '2026-02-15 10:30:00',
    last_active: '2026-03-01 16:00:00',
    is_online: false,
  },
  {
    id: 4,
    user_name: 'disabled_user',
    display_name: 'Disabled User',
    description: 'A disabled user account for testing',
    email: 'disabled@ipark.com',
    password: 'Disabled@1',
    group: 'users',
    language: 'English',
    theme: 'System',
    pinned_dashboard_id: 2,
    is_enable: false,
    created_at: '2026-01-01 00:00:00',
    last_modified_at: '2026-03-01 09:00:00',
    last_active: '2026-02-28 15:00:00',
    is_online: false, // cascade: is_enable=false → is_online=false
  },
];

export const useUserStore = create<UserStore>((set, get) => ({
  users: initialUsers,

  getUser: (id) => get().users.find((u) => u.id === id),

  getUserByName: (userName) => get().users.find((u) => u.user_name === userName),

  getUserByEmail: (email) => get().users.find((u) => u.email === email),

  updateUser: (id, updates) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, ...updates, last_modified_at: now() } : u
      ),
    })),

  addUser: (user) =>
    set((state) => {
      const maxId = state.users.reduce((max, u) => Math.max(max, u.id), 0);
      const newUser: User = {
        ...user,
        id: maxId + 1,
        created_at: now(),
        last_modified_at: now(),
        last_active: now(),
      };
      return { users: [...state.users, newUser] };
    }),

  deleteUser: (id) =>
    set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

  setOnline: (id, online) =>
    set((state) => ({
      users: state.users.map((u) => {
        if (u.id !== id) return u;
        // Cascade: disabled users cannot be online
        if (!u.is_enable && online) return u;
        return { ...u, is_online: online, last_active: now(), last_modified_at: now() };
      }),
    })),

  disableUser: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? { ...u, is_enable: false, is_online: false, last_modified_at: now() }
          : u
      ),
    })),

  enableUser: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id
          ? { ...u, is_enable: true, last_modified_at: now() }
          : u
      ),
    })),
}));
