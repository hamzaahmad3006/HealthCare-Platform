import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, containerClassName, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hasError = Boolean(error);

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
              {leftIcon}
            </div>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={hasError}
            className={clsx(
              'w-full bg-white text-ink-900 placeholder:text-ink-400',
              'rounded-xl border ring-0 outline-none',
              'transition-all duration-150',
              'px-4 py-2.5 text-sm',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              hasError
                ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : 'border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
              'disabled:bg-ink-50 disabled:cursor-not-allowed',
              className,
            )}
            {...rest}
          />
          {rightIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-400">{rightIcon}</div>
          ) : null}
        </div>
        {error ? (
          <p className="text-xs font-medium text-danger-700 animate-slide-down">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
