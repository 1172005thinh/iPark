import type {
  Dashboard,
  EventDef,
  Group,
  Park,
  Permission,
  Staff,
  User,
  WidgetConfig,
} from '@/types/database';

export interface StoreMutationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

const OBJECT_NAME_RE = /^[A-Za-z0-9_]{1,256}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const ERR_CODE_RE = /^0x[0-9a-f]{4}$/;
const EVENT_CODE_RE = /^\d{3}$/;

export const cloneSeed = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

export const now = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const nextId = <T extends { id: number }>(items: T[]) =>
  items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

export const success = <T>(value: T): StoreMutationResult<T> => ({
  ok: true,
  value,
});

export const failure = <T = never>(error: string): StoreMutationResult<T> => ({
  ok: false,
  error,
});

export const validateObjectName = (value: string, fieldLabel: string) => {
  if (!OBJECT_NAME_RE.test(value)) {
    return `${fieldLabel} must be <= 256 characters and use only letters, numbers, or underscores.`;
  }

  return null;
};

export const validateEmail = (value: string, fieldLabel: string) => {
  if (!EMAIL_RE.test(value) || value.length > 256) {
    return `${fieldLabel} must be a valid email address.`;
  }

  return null;
};

export const validatePassword = (value: string, fieldLabel: string) => {
  if (!PASSWORD_RE.test(value)) {
    return `${fieldLabel} must include upper, lower, digit, and special characters with at least 8 characters.`;
  }

  return null;
};

export const validateTime = (value: string, fieldLabel: string) => {
  if (!TIME_RE.test(value)) {
    return `${fieldLabel} must use HH:mm:ss format.`;
  }

  return null;
};

export const validatePosInt = (value: number, fieldLabel: string) => {
  if (!Number.isInteger(value) || value < 1) {
    return `${fieldLabel} must be a positive integer.`;
  }

  return null;
};

export const validateMoney = (value: number, fieldLabel: string) => {
  if (!Number.isInteger(value) || value < 0 || value % 1000 !== 0) {
    return `${fieldLabel} must be a non-negative integer divisible by 1000.`;
  }

  return null;
};

export const validateErrCode = (value: string, fieldLabel: string) => {
  if (!ERR_CODE_RE.test(value)) {
    return `${fieldLabel} must match 0xhhhh with lowercase hex digits.`;
  }

  return null;
};

export const validateEventCode = (
  value: string,
  fieldLabel: string,
  previousValue?: string,
) => {
  if (previousValue === value) {
    return null;
  }

  if (!EVENT_CODE_RE.test(value)) {
    return `${fieldLabel} must be exactly 3 digits.`;
  }

  return null;
};

export const uniquePermissions = (permissions: Permission[]) =>
  Array.from(new Set(permissions));

export const normalizeUser = (user: User): User => ({
  ...user,
  is_online: user.is_enable ? user.is_online : false,
});

export const normalizeGroup = (group: Group): Group => ({
  ...group,
  permissions_list: uniquePermissions(group.permissions_list),
  is_active: group.is_enable ? group.is_active : false,
});

export const normalizePark = (park: Park): Park => ({
  ...park,
  is_operating: park.is_enable ? park.is_operating : false,
});

export const normalizeStaff = (staff: Staff): Staff => ({
  ...staff,
  is_on_shift: staff.is_enable ? staff.is_on_shift : false,
});

export const normalizeEventDef = (eventDef: EventDef): EventDef => ({
  ...eventDef,
});

export const normalizeWidget = (widget: WidgetConfig): WidgetConfig => ({
  ...widget,
  position_x: Math.max(0, Math.trunc(widget.position_x)),
  position_y: Math.max(0, Math.trunc(widget.position_y)),
  width: Math.max(1, Math.trunc(widget.width)),
  height: Math.max(1, Math.trunc(widget.height)),
});

export const normalizeDashboard = (dashboard: Dashboard): Dashboard => ({
  ...dashboard,
  widgets_list: dashboard.widgets_list.map((widget) => normalizeWidget(widget)),
});

export const getAutoWidgetId = (widgets: WidgetConfig[]) => {
  const maxWidgetOrdinal = widgets.reduce((maxValue, widget) => {
    const match = /^w(\d+)$/.exec(widget.id);
    if (!match) {
      return maxValue;
    }

    return Math.max(maxValue, Number(match[1]));
  }, 0);

  return `w${maxWidgetOrdinal + 1}`;
};
