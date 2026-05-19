import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)} role="status">
      <div
        className={clsx(
          'rounded-full border-brand-200 border-t-brand-600 animate-spin',
          SIZE[size],
        )}
      />
      {label ? <p className="text-sm text-ink-500">{label}</p> : null}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PageSpinner(): JSX.Element {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" label="Loading…" />
    </div>
  );
}
