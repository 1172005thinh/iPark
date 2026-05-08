'use client';

export interface MutationResult<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export const nowTimestamp = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const dateKey = (value = new Date()) => {
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const isPositiveInteger = (value: number) => Number.isInteger(value) && value >= 1;

export const isMoneyValue = (value: number) =>
  Number.isInteger(value) && value >= 0 && value % 1000 === 0;

export const isValidObjectName = (value: string) =>
  /^[A-Za-z0-9_]{1,256}$/.test(value);

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 256;

export const isValidPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,256}$/.test(value);

export const isValidTime = (value: string) =>
  /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);

export const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const sameDay = (value: string, expectedDateKey: string) =>
  value.slice(0, 10) === expectedDateKey;

export const isObjectName = isValidObjectName;

export const toStoredTime = (value: string) =>
  value.length === 5 ? `${value}:00` : value;

export const toInputTime = (value: string) => value.slice(0, 5);

