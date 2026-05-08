'use client';

import { useState, useMemo } from 'react';

interface UseDataTableOptions<T> {
  data: T[];
  initialSortKey?: keyof T | string;
  initialSortAsc?: boolean;
  initialPageSize?: number;
}

export function useDataTable<T extends { id: number | string }>({
  data,
  initialSortKey = 'id',
  initialSortAsc = true,
  initialPageSize = 10,
}: UseDataTableOptions<T>) {
  // Sorting state
  const [sortKey, setSortKey] = useState<keyof T | string>(initialSortKey);
  const [sortAsc, setSortAsc] = useState(initialSortAsc);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<T['id']>>(new Set());

  // Reset pagination when data changes or sort changes
  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Derived data: Sorted
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortAsc
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });
  }, [data, sortKey, sortAsc]);

  // Derived data: Paginated
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item.id)));
    }
  };

  const toggleSelectRow = (id: T['id']) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isSelected = (id: T['id']) => selectedIds.has(id);
  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return {
    // Data
    paginatedData,
    sortedData, // useful for export etc.
    
    // Sorting
    sortKey,
    sortAsc,
    handleSort,
    
    // Pagination
    currentPage,
    pageSize,
    totalPages,
    totalItems: data.length,
    handlePageChange,
    handlePageSizeChange,
    
    // Selection
    selectedIds,
    isSelectionMode: selectedIds.size > 0,
    toggleSelectAll,
    toggleSelectRow,
    clearSelection: () => setSelectedIds(new Set()),
    isSelected,
    allSelected,
    someSelected,
  };
}
