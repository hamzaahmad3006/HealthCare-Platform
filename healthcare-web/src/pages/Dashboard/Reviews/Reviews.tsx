import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  Heart,
  ShieldCheck,
  ArrowUpRight,
  X,
  Filter,
  Check,
  Loader2,
  User,
  ExternalLink,
  Smile,
  Frown,
  Meh,
  Activity,
  Award,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { formatDateTime } from '../../../helper/format';
import { useReviews } from './useReviews';
import type { Review } from '../../../types/review.types';

export function Reviews(): JSX.Element {
  const r = useReviews();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Compute live CSAT analytics from reviews
  const analytics = useMemo(() => {
    const list = r.reviews;
    const total = r.meta?.total ?? list.length;
    if (list.length === 0) {
      return {
        avgRating: 5.0,
        total,
        fiveStars: 0,
        fiveStarPct: 100,
        criticalCount: 0,
        resolvedCount: 0,
        resolutionPct: 100,
        starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      };
    }

    let sum = 0;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let critical = 0;
    let resolved = 0;

    for (const rev of list) {
      sum += rev.rating;
      if (counts[rev.rating] !== undefined) counts[rev.rating]++;
      if (rev.isLowRating) {
        critical++;
        if (rev.adminFollowedUp) resolved++;
      }
    }

    const avg = Number((sum / list.length).toFixed(1));
    const fiveStarPct = Math.round(((counts[5] ?? 0) / list.length) * 100);
    const resolutionPct = critical > 0 ? Math.round((resolved / critical) * 100) : 100;

    return {
      avgRating: avg,
      total,
      fiveStars: counts[5] ?? 0,
      fiveStarPct,
      criticalCount: critical,
      resolvedCount: resolved,
      resolutionPct,
      starCounts: counts,
    };
  }, [r.reviews, r.meta?.total]);

  // Client-side instant search filter
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return r.reviews;
    const q = searchQuery.toLowerCase().trim();
    return r.reviews.filter((item) => {
      const text = (item.reviewText ?? '').toLowerCase();
      const bNum = (item.booking?.bookingNumber ?? '').toLowerCase();
      const pName = (item.booking?.patient?.fullName ?? '').toLowerCase();
      const bId = item.bookingId.toLowerCase();
      return text.includes(q) || bNum.includes(q) || pName.includes(q) || bId.includes(q);
    });
  }, [r.reviews, searchQuery]);

  return (
    <SidebarLayout
      title="Patient Reviews & CSAT"
      description="Patient experience feedback, service quality telemetry, and clinical follow-up triage"
    >
      {/* ── Top Header & Command Bar ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 ring-4 ring-amber-50">
            <Star className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900 tracking-tight">Patient Experience & CSAT</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Verified Feedback
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Live feedback from fulfilled healthcare bookings & specialist home visits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-all shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
            Bookings Desk
          </Link>
          <button
            type="button"
            onClick={r.retry}
            disabled={r.isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${r.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── CSAT Metric Ribbon ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* CSAT Score Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-800">Average CSAT</span>
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 shadow-xs">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-900 tracking-tight">{analytics.avgRating}</span>
            <span className="text-xs font-semibold text-ink-400">/ 5.0</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3.5 w-3.5 ${
                  s <= Math.round(analytics.avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-ink-200'
                }`}
              />
            ))}
            <span className="text-[11px] font-medium text-ink-500 ml-1">Overall Satisfaction</span>
          </div>
        </div>

        {/* Total Feedback Count */}
        <div className="bg-gradient-to-br from-brand-50 to-indigo-50/50 p-4 rounded-2xl border border-brand-100 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-500">Total Reviews</span>
            <div className="p-2 rounded-xl bg-white/80 text-brand-600 shadow-xs ring-1 ring-ink-100">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-900 tracking-tight">{analytics.total}</span>
          </div>
          <p className="text-[11px] font-medium text-ink-500 mt-1">100% verified patient feedback</p>
        </div>

        {/* 5-Star Excellence Rate */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800">5-Star Praise</span>
            <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700 shadow-xs">
              <ThumbsUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-900 tracking-tight">{analytics.fiveStarPct}%</span>
            <span className="text-xs font-semibold text-emerald-600">({analytics.fiveStars} reviews)</span>
          </div>
          <p className="text-[11px] font-medium text-ink-500 mt-1">Exceeding patient expectations</p>
        </div>

        {/* Critical Follow-up Triage */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 p-4 rounded-2xl border border-rose-100 shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-rose-800">Critical (≤ 2★)</span>
            <div className="p-2 rounded-xl bg-rose-100/80 text-rose-700 shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-ink-900 tracking-tight">{analytics.criticalCount}</span>
            {analytics.criticalCount > 0 ? (
              <span className="text-xs font-semibold text-rose-600">
                ({analytics.resolvedCount} resolved)
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-medium text-ink-500 mt-1">
            {analytics.criticalCount === 0 ? 'No low ratings flagged' : 'Requires immediate triage'}
          </p>
        </div>
      </div>

      {/* ── Rating Distribution & Filter Toolbar ───────────────────── */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-ink-200/80 shadow-sm mb-6 space-y-4">
        {/* Rating Breakdown Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-700 uppercase tracking-wider">Rating Tiers:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  r.setRatingFilter(null);
                  r.setOnlyLowRating(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  r.ratingFilter === null && !r.onlyLowRating
                    ? 'bg-ink-900 text-white shadow-xs'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                }`}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = analytics.starCounts[stars] ?? 0;
                const active = r.ratingFilter === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => r.setRatingFilter(active ? null : stars)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-600'
                        : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/70 border border-amber-200/50'
                    }`}
                  >
                    <span>{stars}</span>
                    <Star className={`h-3 w-3 ${active ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-amber-200/60 text-amber-900'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Low rating toggle shortcut */}
          <button
            type="button"
            onClick={() => r.setOnlyLowRating(!r.onlyLowRating)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              r.onlyLowRating
                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Ratings Only (≤ 2★)</span>
            {analytics.criticalCount > 0 ? (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${r.onlyLowRating ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'}`}>
                {analytics.criticalCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Search Bar & Feedback Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback text, booking #, patient..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-ink-200 bg-white placeholder-ink-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="text-xs text-ink-500 font-medium">
            Showing <span className="font-bold text-ink-900">{filteredReviews.length}</span> patient reviews
          </div>
        </div>
      </div>

      {/* ── Error Notification ─────────────────────────────────────── */}
      {r.error ? (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="font-medium">{r.error}</span>
          </div>
          <button
            type="button"
            onClick={r.retry}
            className="px-3 py-1.5 rounded-xl bg-white ring-1 ring-danger-200 text-xs font-semibold text-danger-700 hover:bg-danger-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* ── Reviews Grid / List ────────────────────────────────────── */}
      {r.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white p-5 border border-ink-100 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-ink-100" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-28 bg-ink-100 rounded" />
                  <div className="h-3 w-20 bg-ink-50 rounded" />
                </div>
              </div>
              <div className="h-3 w-32 bg-ink-100 rounded" />
              <div className="h-12 bg-ink-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8 text-amber-500" />}
          title={searchQuery ? 'No reviews match your search' : 'No patient reviews found'}
          description={
            searchQuery
              ? `Clear your query "${searchQuery}" or select a different rating tier.`
              : r.onlyLowRating
              ? 'Great news! There are zero low ratings requiring attention.'
              : 'Customer reviews will automatically appear here once patients complete their post-visit assessments.'
          }
          action={
            r.onlyLowRating || r.ratingFilter !== null || searchQuery ? (
              <button
                onClick={() => {
                  r.setOnlyLowRating(false);
                  r.setRatingFilter(null);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl ring-1 ring-amber-200 hover:bg-amber-100 transition-all"
              >
                Reset All Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((review) => {
              const isToggling = r.togglingId === review.id;
              const sentiment = getSentiment(review.rating);

              return (
                <div
                  key={review.id}
                  className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md ${
                    review.isLowRating
                      ? 'border-rose-200/90 bg-gradient-to-br from-rose-50/20 to-white shadow-rose-500/5'
                      : 'border-ink-200/80 shadow-xs'
                  }`}
                >
                  {/* Card Header: Avatar, Name & Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 ${
                          review.isLowRating
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {review.booking?.patient?.fullName ? (
                          review.booking.patient.fullName.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-ink-900 truncate">
                            {review.booking?.patient?.fullName ?? 'Verified Patient'}
                          </p>
                          {review.booking?.serviceType?.name ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-ink-100 text-ink-700">
                              {review.booking.serviceType.name}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-ink-400 font-mono mt-0.5 flex items-center gap-1">
                          Ref: {review.booking?.bookingNumber ?? review.bookingId.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${sentiment.badgeCls}`}
                      >
                        {sentiment.icon}
                        <span>{review.rating}.0</span>
                      </span>
                      <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
                        {sentiment.label}
                      </span>
                    </div>
                  </div>

                  {/* Star Visualization */}
                  <div className="flex items-center gap-1 mt-3.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
                        }`}
                      />
                    ))}
                    <span className="text-2xs text-ink-400 ml-2 font-medium">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>

                  {/* Feedback Quote Block */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-ink-50/70 border border-ink-100">
                    {review.reviewText ? (
                      <p className="text-xs text-ink-800 leading-relaxed font-medium italic">
                        "{review.reviewText}"
                      </p>
                    ) : (
                      <p className="text-xs text-ink-400 italic">
                        Patient submitted a rating with no written remarks.
                      </p>
                    )}
                  </div>

                  {/* Footer & Follow-Up Action */}
                  <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between gap-2 flex-wrap">
                    {review.isLowRating ? (
                      <div className="flex items-center gap-1.5">
                        {review.adminFollowedUp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            Needs Follow-Up
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void r.toggleFollowUp(review.id)}
                          disabled={isToggling}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-ink-100 text-ink-700 hover:bg-ink-200 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {isToggling ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          <span>{review.adminFollowedUp ? 'Re-open' : 'Mark Resolved'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Verified Patient Satisfaction
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedReview(review)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors ml-auto"
                    >
                      <span>Full Details</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {r.meta && r.meta.total > r.meta.limit ? (
            <div className="p-4 bg-white rounded-2xl border border-ink-100 shadow-xs">
              <Pagination meta={r.meta} onPageChange={r.setPage} />
            </div>
          ) : null}
        </div>
      )}

      {/* ── Review Details Modal ───────────────────────────────────── */}
      {selectedReview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-ink-200 w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-start justify-between pb-4 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink-900">Patient Review Details</h2>
                  <p className="text-xs text-ink-500 font-mono mt-0.5">
                    ID: {selectedReview.id.slice(0, 12)}…
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-ink-50/70 border border-ink-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-ink-800">
                    {selectedReview.booking?.bookingNumber ?? selectedReview.bookingId}
                  </span>
                </div>
                {selectedReview.booking?.patient?.fullName ? (
                  <div className="flex justify-between">
                    <span className="text-ink-500">Patient:</span>
                    <span className="font-semibold text-ink-800">
                      {selectedReview.booking.patient.fullName}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-ink-500">Submitted:</span>
                  <span className="font-medium text-ink-700">
                    {formatDateTime(selectedReview.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Rating:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-700">
                    <span>{selectedReview.rating} / 5</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Written Feedback
                </p>
                <p className="p-3 rounded-xl bg-ink-50 text-ink-800 leading-relaxed italic border border-ink-100">
                  {selectedReview.reviewText ? `"${selectedReview.reviewText}"` : 'No written feedback was provided.'}
                </p>
              </div>

              {selectedReview.isLowRating ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span className="font-bold text-rose-800">Critical Feedback Follow-up</span>
                  </div>
                  <p className="text-rose-700 text-[11px] leading-relaxed">
                    This patient gave a low satisfaction score. Reach out to resolve their clinical or service concerns.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-ink-100">
              <Link
                to="/admin/bookings"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <span>Go to Bookings</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-700 bg-ink-100 rounded-xl hover:bg-ink-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SidebarLayout>
  );
}

// ── Sentiment Helper ──────────────────────────────────────────────────
function getSentiment(rating: number): { label: string; badgeCls: string; icon: JSX.Element } {
  if (rating === 5) {
    return {
      label: 'Exceptional',
      badgeCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: <Smile className="h-3.5 w-3.5 text-emerald-600" />,
    };
  }
  if (rating === 4) {
    return {
      label: 'Very Good',
      badgeCls: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      icon: <Smile className="h-3.5 w-3.5 text-cyan-600" />,
    };
  }
  if (rating === 3) {
    return {
      label: 'Average',
      badgeCls: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: <Meh className="h-3.5 w-3.5 text-amber-600" />,
    };
  }
  return {
    label: 'Needs Attention',
    badgeCls: 'bg-rose-50 text-rose-700 border border-rose-200',
    icon: <Frown className="h-3.5 w-3.5 text-rose-600" />,
  };
}
