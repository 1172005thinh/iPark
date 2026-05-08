'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from 'lucide-react';
import { AppDialog, type DialogTone } from './AppDialog';

const confirmButtonClasses: Record<DialogTone, string> = {
  default:
    'bg-ip-primary text-white shadow-lg shadow-ip-primary/20 hover:bg-ip-primary/90',
  info: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600',
  success:
    'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600',
  warning:
    'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600',
  danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600',
};

const toneIcons: Record<DialogTone, ReactNode> = {
  default: <Info size={22} />,
  info: <Info size={22} />,
  success: <CheckCircle2 size={22} />,
  warning: <AlertTriangle size={22} />,
  danger: <Trash2 size={22} />,
};

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  isProcessing?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isProcessing = false,
  children,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      icon={toneIcons[tone]}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="ip-btn rounded-xl border border-ip-border bg-ip-surface px-4 py-2.5 text-sm font-medium text-ip-text-secondary hover:bg-ip-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`ip-btn rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClasses[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {children}
    </AppDialog>
  );
}
