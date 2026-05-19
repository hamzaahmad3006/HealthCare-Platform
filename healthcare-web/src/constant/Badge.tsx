import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  leftIcon?: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  success: 'bg-success-50 text-success-700 ring-success-500/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  accent: 'bg-accent-100 text-accent-600 ring-accent-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-500/20',
};

const DOT_TONE: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  accent: 'bg-accent-500',
  info: 'bg-sky-500',
};

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  leftIcon,
  className,
  children,
  ...rest
}: BadgeProps): JSX.Element {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {dot ? <span className={clsx('h-1.5 w-1.5 rounded-full', DOT_TONE[tone])} /> : null}
      {leftIcon}
      {children}
    </span>
  );
}
