import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'gradient';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white shadow-card ring-1 ring-ink-100',
  elevated: 'bg-white shadow-card-hover ring-1 ring-ink-100',
  flat: 'bg-white ring-1 ring-ink-200',
  gradient:
    'bg-gradient-to-br from-white via-brand-50/40 to-brand-100/30 ring-1 ring-brand-200/40 shadow-card',
};

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, padding = 'md', className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-2xl',
          VARIANT_CLASSES[variant],
          PADDING_CLASSES[padding],
          hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
