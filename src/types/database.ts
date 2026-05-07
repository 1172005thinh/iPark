// iPark Database Type Definitions
// Strict adherence to docs/iPark.md Section 7 data types

// ─── Branded/Alias Types ───────────────────────────────────────────────

/** Positive integer >= 1 */
export type PosInt = number;

/** Positive integer >= 0, must be divisible by 1000 */
export type Money = number;

/** String formatted as `0xhhhh` where h is hex digit (0-9, a-f) */
export type ErrCode = string;

/** String formatted as `ddd` (3 digits) for event codes */
export type EventCodeId = string;

/** String, <= 256 chars, no spaces, only alphanumeric and _ */
export type ObjectName = string;

/** String, >= 8 chars, 1 upper, 1 lower, 1 digit, 1 special char */
export type Password = string;

/** Email format string, <= 256 chars */
export type Email = string;

/** Datetime in format YYYY-MM-DD HH:mm:ss */
export type DateTime = string;

/** Time in format HH:mm:ss */
export type Time = string;

/** Date in format YYYY-MM-DD */
export type DateStr = string;

// ─── USER_DB ───────────────────────────────────────────────────────────

export interface User {
  id: PosInt;
  user_name: ObjectName;
  display_name: string;
  description: string;
  email: Email;
  password: Password;
  group: ObjectName;
  language: string;
  theme: string;
  pinned_dashboard_id: PosInt;
  is_enable: boolean;
  created_at: DateTime;
  last_modified_at: DateTime;
  last_active: DateTime;
  is_online: boolean;
}

// ─── GROUP_DB ──────────────────────────────────────────────────────────

export type Permission =
  | 'view_dashboard'
  | 'edit_dashboard'
  | 'add_dashboard'
  | 'delete_dashboard'
  | 'view_parks'
  | 'edit_parks'
  | 'add_parks'
  | 'delete_parks'
  | 'view_staffs'
  | 'edit_staffs'
  | 'add_staffs'
  | 'delete_staffs'
  | 'view_events'
  | 'export_events'
  | 'delete_events'
  | 'view_settings'
  | 'edit_settings';

export interface Group {
  id: PosInt;
  group_name: ObjectName;
  display_name: string;
  description: string;
  permissions_list: Permission[];
  is_enable: boolean;
  created_at: DateTime;
  last_modified_at: DateTime;
  last_active: DateTime;
  is_active: boolean;
}

// ─── PARK_DB ───────────────────────────────────────────────────────────

export interface Park {
  id: PosInt;
  park_name: ObjectName;
  display_name: string;
  description: string;
  location: string;
  start_time: Time;
  end_time: Time;
  fee: Money;
  max_slot: PosInt;
  is_enable: boolean;
  created_at: DateTime;
  last_modified_at: DateTime;
  last_active: DateTime;
  is_operating: boolean;
}

// ─── STAFF_DB ──────────────────────────────────────────────────────────

export interface Staff {
  id: PosInt;
  staff_name: ObjectName;
  display_name: string;
  description: string;
  at_park_id: PosInt;
  start_time: Time;
  end_time: Time;
  role: string;
  payment: Money;
  is_enable: boolean;
  created_at: DateTime;
  last_modified_at: DateTime;
  last_active: DateTime;
  is_on_shift: boolean;
}

// ─── EVENT_DB ──────────────────────────────────────────────────────────

export interface EventDef {
  id: PosInt;
  event_code: EventCodeId;
  event_name: string;
  event_type: 'info' | 'warning' | 'error';
  error_code: ErrCode;
  description: string;
  is_enable: boolean;
}

// ─── EVENT_HISTORY_DB ──────────────────────────────────────────────────

export interface EventHistory {
  id: PosInt;
  event_code: EventCodeId;
  event_name: string;
  event_type: 'info' | 'warning' | 'error';
  error_code: ErrCode;
  description: string;
  at_park_id: PosInt;
  extra_info: string;
  sent_time: DateTime;
  received_time: DateTime;
  is_acknowledged: boolean;
}

// ─── DASHBOARD_DB ──────────────────────────────────────────────────────

export interface WidgetConfig {
  id: string;
  label: string;
  description: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_fixed: boolean;
  is_enable: boolean;
  data_source: WidgetDataSource;
}

export type WidgetDataSource =
  | ParkDataSource
  | FeeDataSource
  | StaffDataSource
  | WorkingTimeDataSource
  | EventDataSource
  | ActionDataSource
  | MiscDataSource;

export interface ParkDataSource {
  category: 'PARK';
  type: 'curr_slot_max_slot' | 'stats_curr_slot' | 'chart_curr_slot';
  park: string; // park id or 'ALL'
  unit: 'slot' | '%';
  interval: 'hour' | 'day' | 'week' | 'month';
}

export interface FeeDataSource {
  category: 'FEE';
  type: 'curr_fee' | 'estimate_income' | 'chart_estimate_income';
  park: string;
  unit: 'VND' | 'đ';
  interval: 'hour' | 'day' | 'week' | 'month';
}

export interface StaffDataSource {
  category: 'STAFF';
  type:
    | 'curr_staff_max_staff'
    | 'stats_curr_staff'
    | 'chart_curr_staff'
    | 'estimate_payment'
    | 'chart_estimate_payment';
  park: string;
  unit: 'person' | '%';
  interval: 'hour' | 'day' | 'week' | 'month';
}

export interface WorkingTimeDataSource {
  category: 'WORKING_TIME';
  type:
    | 'start_end_time'
    | 'curr_total_working_time'
    | 'stats_curr_total_working_time'
    | 'chart_curr_total_working_time';
  park: string;
  unit: 's' | 'm' | 'h' | 'd' | 'w' | 'mo' | 'y';
}

export interface EventDataSource {
  category: 'EVENT';
  type: 'curr_event' | 'list_event' | 'count_type_event';
  park: string; // Must be specific park ID, not ALL
  event_type?: 'warning' | 'info' | 'error' | 'all';
  interval?: 'hour' | 'day' | 'week' | 'month';
}

export interface ActionDataSource {
  category: 'ACTION';
  type: 'action' | 'switch';
  action_id?:
    | 'fire_alarms'
    | 'open_gates'
    | 'restart_system';
  switch_id?:
    | 'enable_maintenance_mode'
    | 'enable_emergency_mode'
    | 'turn_onoff_lights'
    | 'turn_onoff_cameras'
    | 'turn_onoff_sensors';
  park?: string;
}

export interface MiscDataSource {
  category: 'MISC';
  type: 'curr_time' | 'curr_weather';
  park: string; // Must be specific park ID
  format?: string;
}

export interface Dashboard {
  id: PosInt;
  dashboard_name: ObjectName;
  display_name: string;
  description: string;
  widgets_list: WidgetConfig[];
  is_enable: boolean;
  created_at: DateTime;
  last_modified_at: DateTime;
}

// ─── SYSTEM_STATE_DB ───────────────────────────────────────────────────

export interface SystemState {
  id: PosInt;
  park_id: PosInt; // 0 for global system states
  maintenance_mode: boolean;
  emergency_mode: boolean;
  lights_on: boolean;
  cameras_on: boolean;
  sensors_on: boolean;
  last_modified_at: DateTime;
}

// ─── Auth / Session Types ──────────────────────────────────────────────

export interface AuthSession {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
}

export interface LoginAttemptTracker {
  attempts: number;
  blockedUntil: number | null; // timestamp or null
}
