import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): JSX.Element {
  return (
    <div
      aria-hidden
      className={clsx(
        'rounded-lg bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] animate-shimmer',
        className,
      )}
    />
  );
}

export function ServiceCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl p-6 ring-1 ring-ink-100 shadow-card">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-5 w-32 mt-5" />
      <Skeleton className="h-3 w-full mt-3" />
      <Skeleton className="h-3 w-3/4 mt-2" />
      <Skeleton className="h-3 w-2/3 mt-2" />
      <Skeleton className="h-4 w-28 mt-5" />
    </div>
  );
}

export function BookingCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-ink-100 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mt-4" />
      <Skeleton className="h-3 w-1/2 mt-2" />
      <div className="mt-5 pt-4 border-t border-ink-100 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ReportCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink-100 shadow-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 border-t border-ink-100 flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function KpiCardSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-ink-100 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20 mt-4" />
      <Skeleton className="h-3 w-32 mt-3" />
    </div>
  );
}
