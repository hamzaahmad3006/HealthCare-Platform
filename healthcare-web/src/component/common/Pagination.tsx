import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { PaginationMeta } from '../../types/api.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps): JSX.Element {
  const { total, page, limit } = meta;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-3">
      <p className="text-sm text-ink-500">
        Showing <span className="font-medium text-ink-800">{start}</span>–
        <span className="font-medium text-ink-800">{end}</span> of{' '}
        <span className="font-medium text-ink-800">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={clsx(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ring-ink-200',
            'hover:bg-ink-50 transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNext}
          className={clsx(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ring-1 ring-ink-200',
            'hover:bg-ink-50 transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
