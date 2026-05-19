import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../constant/Card';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  unit?: string;
  icon?: ReactNode;
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger';
}

const TONE_ICON_BG: Record<NonNullable<KpiCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-100 text-accent-600',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
};

export function KpiCard({ label, value, delta, unit, icon, tone = 'brand' }: KpiCardProps): JSX.Element {
  const trend = delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-bold text-ink-900 tracking-tight">{value}</span>
            {unit ? <span className="text-sm font-medium text-ink-500">{unit}</span> : null}
          </div>
          {trend ? (
            <div
              className={clsx(
                'inline-flex items-center gap-1 mt-2 text-xs font-semibold',
                trend === 'up' && 'text-success-700',
                trend === 'down' && 'text-danger-700',
                trend === 'flat' && 'text-ink-500',
              )}
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : null}
              {trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
              {trend === 'flat' ? <Minus className="h-3 w-3" /> : null}
              {Math.abs(delta ?? 0)}% vs last period
            </div>
          ) : null}
        </div>
        {icon ? (
          <div className={clsx('h-11 w-11 rounded-xl flex items-center justify-center', TONE_ICON_BG[tone])}>
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
