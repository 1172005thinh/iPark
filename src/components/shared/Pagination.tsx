'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const [jumpValue, setJumpValue] = useState(String(currentPage));

  useEffect(() => {
    setJumpValue(String(currentPage));
  }, [currentPage]);

  const handleJump = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(jumpValue, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      } else {
        setJumpValue(String(currentPage));
      }
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-t border-ip-border">
      <div className="flex items-center gap-4 text-sm text-ip-text-secondary">
        <div className="flex items-center gap-2">
          <span>{t('showing')}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-ip-border bg-ip-surface px-2 py-1 text-xs font-medium text-ip-text focus:border-ip-primary focus:outline-none"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>{t('items_per_page')}</span>
        </div>
        <div className="hidden h-4 w-px bg-ip-border sm:block" />
        <p>
          {t('showing')} <span className="font-medium text-ip-text">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> {t('to')}{' '}
          <span className="font-medium text-ip-text">{Math.min(totalItems, currentPage * pageSize)}</span> {t('of')}{' '}
          <span className="font-medium text-ip-text">{totalItems}</span> {t('results')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-ip-text-secondary">
          <span>{t('go_to_page')}</span>
          <input
            type="text"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={handleJump}
            className="w-12 rounded-lg border border-ip-border bg-ip-surface px-2 py-1 text-center text-xs font-medium text-ip-text focus:border-ip-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ip-border bg-ip-surface text-ip-text-secondary transition-colors hover:bg-ip-surface-hover hover:text-ip-text disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium text-ip-text">{currentPage}</span>
            <span className="text-sm text-ip-text-muted">/</span>
            <span className="text-sm text-ip-text-secondary">{totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ip-border bg-ip-surface text-ip-text-secondary transition-colors hover:bg-ip-surface-hover hover:text-ip-text disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
