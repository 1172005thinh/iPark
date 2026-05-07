'use client';

import { create } from 'zustand';
import type { EventHistory } from '@/types/database';

const now = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface EventHistoryStore {
  events: EventHistory[];
  addEvent: (event: Omit<EventHistory, 'id' | 'received_time'>) => void;
  acknowledgeEvent: (id: number) => void;
  deleteEvent: (id: number) => void;
  getEventsByPark: (parkId: number) => EventHistory[];
  getEventsByType: (type: string) => EventHistory[];
}

const initialEvents: EventHistory[] = [
  {
    id: 1,
    event_code: '001',
    event_name: 'System Startup',
    event_type: 'info',
    error_code: '0x0000',
    description: 'The system has started successfully',
    at_park_id: 1,
    extra_info: '',
    sent_time: '2026-03-01 08:00:00',
    received_time: '2026-03-01 08:00:05',
    is_acknowledged: true,
  },
  {
    id: 2,
    event_code: '010',
    event_name: 'Staff Enter Shift',
    event_type: 'info',
    error_code: '0x0000',
    description: 'A staff member has entered the working shift',
    at_park_id: 1,
    extra_info: 'Staff: John Doe (ID: 1)',
    sent_time: '2026-03-01 08:15:00',
    received_time: '2026-03-01 08:15:05',
    is_acknowledged: false,
  },
  {
    id: 3,
    event_code: '020',
    event_name: 'Client Enter Park',
    event_type: 'info',
    error_code: '0x0000',
    description: 'A client has entered the park',
    at_park_id: 1,
    extra_info: 'Vehicle ID: 51A-12345',
    sent_time: '2026-03-01 08:30:00',
    received_time: '2026-03-01 08:30:05',
    is_acknowledged: false,
  },
  {
    id: 4,
    event_code: '008',
    event_name: 'Park Nearly Full',
    event_type: 'warning',
    error_code: '0x0000',
    description: 'The park is nearly full',
    at_park_id: 1,
    extra_info: 'Occupancy: 92%',
    sent_time: '2026-03-01 17:00:00',
    received_time: '2026-03-01 17:00:05',
    is_acknowledged: false,
  },
  {
    id: 5,
    event_code: '00c',
    event_name: 'System Execution Failed',
    event_type: 'error',
    error_code: '0x0003',
    description: 'The system failed to execute a specific function due to an unknown error',
    at_park_id: 1,
    extra_info: 'Module: gate_controller',
    sent_time: '2026-03-01 17:30:00',
    received_time: '2026-03-01 17:30:05',
    is_acknowledged: false,
  },
  {
    id: 6,
    event_code: '010',
    event_name: 'Staff Enter Shift',
    event_type: 'info',
    error_code: '0x0000',
    description: 'A staff member has entered the working shift',
    at_park_id: 2,
    extra_info: 'Staff: Jane Smith (ID: 2)',
    sent_time: '2026-03-01 09:00:00',
    received_time: '2026-03-01 09:00:05',
    is_acknowledged: true,
  },
  {
    id: 7,
    event_code: '001',
    event_name: 'System Startup',
    event_type: 'info',
    error_code: '0x0000',
    description: 'The system has started successfully',
    at_park_id: 2,
    extra_info: '',
    sent_time: '2026-03-01 07:00:00',
    received_time: '2026-03-01 07:00:05',
    is_acknowledged: true,
  },
  {
    id: 8,
    event_code: '020',
    event_name: 'Client Enter Park',
    event_type: 'info',
    error_code: '0x0000',
    description: 'A client has entered the park',
    at_park_id: 3,
    extra_info: 'Vehicle ID: 59C-67890',
    sent_time: '2026-03-01 06:30:00',
    received_time: '2026-03-01 06:30:05',
    is_acknowledged: false,
  },
  {
    id: 9,
    event_code: '005',
    event_name: 'Login Failed',
    event_type: 'warning',
    error_code: '0x0010',
    description: 'A user login attempt has failed',
    at_park_id: 1,
    extra_info: 'Username: unknown_user, IP: 192.168.1.100',
    sent_time: '2026-03-01 10:00:00',
    received_time: '2026-03-01 10:00:02',
    is_acknowledged: false,
  },
  {
    id: 10,
    event_code: '010',
    event_name: 'Staff Enter Shift',
    event_type: 'info',
    error_code: '0x0000',
    description: 'A staff member has entered the working shift',
    at_park_id: 3,
    extra_info: 'Staff: Anna Nguyen (ID: 4)',
    sent_time: '2026-03-01 06:00:00',
    received_time: '2026-03-01 06:00:05',
    is_acknowledged: false,
  },
];

export const useEventHistoryStore = create<EventHistoryStore>((set, get) => ({
  events: initialEvents,

  addEvent: (event) =>
    set((state) => {
      const maxId = state.events.reduce((max, e) => Math.max(max, e.id), 0);
      const newEvent: EventHistory = {
        ...event,
        id: maxId + 1,
        received_time: now(),
      };
      return { events: [...state.events, newEvent] };
    }),

  acknowledgeEvent: (id) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, is_acknowledged: true } : e
      ),
    })),

  deleteEvent: (id) =>
    set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

  getEventsByPark: (parkId) =>
    get().events.filter((e) => e.at_park_id === parkId),

  getEventsByType: (type) =>
    type === 'all'
      ? get().events
      : get().events.filter((e) => e.event_type === type),
}));
