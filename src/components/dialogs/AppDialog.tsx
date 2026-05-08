'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type DialogTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
} as const;

const toneClasses: Record<DialogTone, string> = {
  default: 'border-ip-border bg-ip-bg text-ip-text',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-600',
};

export interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  tone?: DialogTone;
  size?: keyof typeof sizeClasses;
  dismissible?: boolean;
  closeLabel?: string;
  panelClassName?: string;
}

export function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  icon,
  tone = 'default',
  size = 'md',
  dismissible = true,
  closeLabel = 'Close dialog',
  panelClassName = '',
}: AppDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !dismissible) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissible, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-ip-primary/12 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-ip-accent/12 blur-3xl" />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative w-full ${sizeClasses[size]} ${panelClassName}`}
      >
        <div className="ip-card overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/10 flex flex-col max-h-[92vh] sm:max-h-[90vh]">
          <div className="relative flex flex-col flex-1 min-h-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-ip-primary/8 via-transparent to-ip-accent/8" />
            <div className="relative p-6 sm:p-7 flex-1 overflow-y-auto">
              <div className="flex items-start gap-4 shrink-0 mb-6">
                {icon ? (
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${toneClasses[tone]}`}
                  >
                    {icon}
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <h2
                    id={titleId}
                    className="text-xl font-semibold tracking-tight text-ip-text"
                  >
                    {title}
                  </h2>
                  {description ? (
                    <p
                      id={descriptionId}
                      className="mt-1.5 text-sm leading-6 text-ip-text-secondary"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>

                {dismissible ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={closeLabel}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ip-border bg-ip-surface text-ip-text-secondary transition-colors hover:bg-ip-surface-hover hover:text-ip-text"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>

              {children ? <div>{children}</div> : null}
            </div>

            {footer ? (
              <div className="border-t border-ip-border/80 bg-ip-bg/70 px-6 py-4 sm:px-7 shrink-0">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
