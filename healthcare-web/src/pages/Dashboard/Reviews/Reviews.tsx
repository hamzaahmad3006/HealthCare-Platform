import clsx from 'clsx';
import { Star, AlertTriangle, MessageSquare } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Badge } from '../../../constant/Badge';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { useReviews } from './useReviews';

export function Reviews(): JSX.Element {
  const r = useReviews();

  return (
    <SidebarLayout
      title="Reviews"
      description="Customer feedback — low ratings are flagged for follow-up"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => r.setOnlyLowRating(!r.onlyLowRating)}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-semibold ring-1 transition-all inline-flex items-center gap-2',
            r.onlyLowRating
              ? 'bg-danger-50 text-danger-700 ring-danger-500/30'
              : 'bg-white text-ink-700 ring-ink-200 hover:ring-ink-300',
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          {r.onlyLowRating ? 'Showing low ratings only' : 'Show low ratings only (≤ 2 stars)'}
        </button>
      </div>

      {r.error ? (
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {r.error}
        </div>
      ) : null}

      {r.isLoading ? (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] animate-shimmer"
            />
          ))}
        </div>
      ) : r.reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No reviews yet"
          description="Customer reviews after completed bookings will appear here."
          action={
            r.onlyLowRating ? (
              <button
                onClick={() => r.setOnlyLowRating(false)}
                className="text-sm font-semibold text-brand-700"
              >
                Show all reviews
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {r.reviews.map((review) => (
              <Card
                key={review.id}
                padding="md"
                hover
                className={clsx(
                  'animate-slide-up',
                  review.isLowRating && 'ring-2 ring-danger-500/30 bg-danger-50/30',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1 text-warning-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={clsx(
                          'h-4 w-4',
                          i < review.rating ? 'text-warning-500' : 'text-ink-200',
                        )}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {review.isLowRating ? (
                      <Badge tone="danger" size="sm" leftIcon={<AlertTriangle className="h-3 w-3" />}>
                        Needs follow-up
                      </Badge>
                    ) : null}
                    {review.adminFollowedUp ? <Badge tone="success" size="sm" dot>Resolved</Badge> : null}
                  </div>
                </div>

                {review.reviewText ? (
                  <p className="mt-4 text-ink-700 text-sm leading-relaxed">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>
                ) : (
                  <p className="mt-4 text-ink-400 italic text-sm">No comment provided.</p>
                )}

                <div className="mt-4 pt-4 border-t border-ink-100 text-xs text-ink-500 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono">Booking {review.bookingId.slice(0, 8)}…</p>
                  <p>{formatDateTime(review.createdAt)}</p>
                </div>
              </Card>
            ))}
          </div>
          {r.meta ? <Pagination meta={r.meta} onPageChange={r.setPage} /> : null}
        </>
      )}
    </SidebarLayout>
  );
}
