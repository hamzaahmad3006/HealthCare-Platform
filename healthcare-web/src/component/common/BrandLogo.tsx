import { Link } from 'react-router-dom';
import clsx from 'clsx';

export interface BrandLogoProps {
  variant?: 'light' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  asLink?: boolean;
  to?: string;
  className?: string;
  iconOnly?: boolean;
}

export function BrandLogo({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  subtitleText = 'PAKISTAN',
  asLink = false,
  to = '/',
  className,
  iconOnly = false,
}: BrandLogoProps): JSX.Element {
  const isWhite = variant === 'white';

  const sizeMap = {
    sm: { icon: 34, title: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { icon: 42, title: 'text-lg', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { icon: 50, title: 'text-2xl', sub: 'text-xs', gap: 'gap-3' },
    xl: { icon: 64, title: 'text-3xl', sub: 'text-sm', gap: 'gap-3.5' },
  }[size];

  const content = (
    <div className={clsx('inline-flex items-center select-none group', sizeMap.gap, className)}>
      {/* Medical Cross Squircle Badge — identical to the mobile app design */}
      <div
        style={{ width: sizeMap.icon, height: sizeMap.icon }}
        className={clsx(
          'relative rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
          isWhite
            ? 'bg-white shadow-lg text-brand-700'
            : 'bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-brand text-white',
        )}
        aria-hidden="true"
      >
        {/* Horizontal cross bar */}
        <div
          className={clsx(
            'absolute rounded-full transition-colors',
            isWhite ? 'bg-brand-700' : 'bg-white',
          )}
          style={{
            width: Math.round(sizeMap.icon * 0.54),
            height: Math.round(sizeMap.icon * 0.22),
            borderRadius: Math.max(2, Math.round(sizeMap.icon * 0.08)),
          }}
        />
        {/* Vertical cross bar */}
        <div
          className={clsx(
            'absolute rounded-full transition-colors',
            isWhite ? 'bg-brand-700' : 'bg-white',
          )}
          style={{
            width: Math.round(sizeMap.icon * 0.22),
            height: Math.round(sizeMap.icon * 0.54),
            borderRadius: Math.max(2, Math.round(sizeMap.icon * 0.08)),
          }}
        />
      </div>

      {!iconOnly && (
        <div className="leading-tight">
          <p
            className={clsx(
              'font-extrabold tracking-tight',
              sizeMap.title,
              isWhite ? 'text-white' : 'text-ink-900',
            )}
          >
            HomeHealth
          </p>
          {showSubtitle && (
            <p
              className={clsx(
                'font-bold uppercase tracking-[0.22em] -mt-0.5',
                sizeMap.sub,
                isWhite ? 'text-brand-200' : 'text-brand-600',
              )}
            >
              {subtitleText}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center no-underline focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
