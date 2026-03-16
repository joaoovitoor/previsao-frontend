'use client';

import type { ReactNode } from 'react';
import { LoadingOverlay } from './loading-overlay';
import { EmptyState } from './empty-state';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyIcon,
  emptyMessage = 'Nenhum item encontrado',
  keyExtractor,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('relative bg-white rounded shadow-sm border border-gray-200 overflow-hidden', className)}>
      {loading && (
        <LoadingOverlay isLoading inline message="Carregando..." />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-semibold text-sm',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    (!col.align || col.align === 'left') && 'text-left',
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={emptyIcon} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'border-b border-gray-100 hover:bg-blue-50/50 transition-colors',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                      )}
                    >
                      {col.render(item, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {loading && data.length === 0 && (
        <div className="h-48" />
      )}
    </div>
  );
}

export type { Column };
