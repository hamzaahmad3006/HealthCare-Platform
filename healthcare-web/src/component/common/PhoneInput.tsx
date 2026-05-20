import { forwardRef, useId } from 'react';
import clsx from 'clsx';

interface PhoneInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  // Value must be the 10-digit local portion (no +92). The form is the source
  // of truth; the +92 prefix is rendered visually only and prepended at submit.
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

const PREFIX = '+92';
const MAX_DIGITS = 10;

// Sanitise any pasted/typed input down to at most MAX_DIGITS digits. If the
// user types or pastes a leading 0 (the local Pakistani habit, e.g. "0300…"),
// strip it so "0300" becomes "300" and the +92 prefix isn't doubled up.
function normalise(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  const withoutCountry = digitsOnly.startsWith('92') ? digitsOnly.slice(2) : digitsOnly;
  const withoutLeadingZero = withoutCountry.startsWith('0')
    ? withoutCountry.slice(1)
    : withoutCountry;
  return withoutLeadingZero.slice(0, MAX_DIGITS);
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      onBlur,
      name,
      autoComplete = 'tel-national',
      disabled = false,
      placeholder = '3001234567',
      id,
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-msg`;
    const hasError = Boolean(error);
    const hasMessage = hasError || Boolean(helperText);

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        ) : null}
        <div
          className={clsx(
            'flex items-stretch rounded-xl border bg-white transition-all',
            'focus-within:ring-2',
            hasError
              ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20'
              : 'border-ink-200 hover:border-ink-300 focus-within:border-brand-500 focus-within:ring-brand-500/20',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        >
          <span
            aria-hidden
            className="flex items-center px-4 text-sm font-semibold text-ink-700 bg-ink-50 rounded-l-xl border-r border-ink-200 select-none"
          >
            {PREFIX}
          </span>
          <input
            id={inputId}
            ref={ref}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            maxLength={MAX_DIGITS}
            aria-invalid={hasError}
            aria-describedby={hasMessage ? messageId : undefined}
            onChange={(e) => onChange(normalise(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text');
              onChange(normalise(text));
            }}
            onBlur={onBlur}
            className="flex-1 bg-transparent text-ink-900 placeholder:text-ink-400 px-3 py-2.5 text-sm outline-none rounded-r-xl"
          />
        </div>
        {hasError ? (
          <p id={messageId} role="alert" className="text-xs font-medium text-danger-700 animate-slide-down">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-ink-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

// Helpers exposed so callers can ship the assembled E.164 number to the API
// without each caller re-implementing the same concat / format logic.
export function toE164(localDigits: string): string {
  return `${PREFIX}${localDigits}`;
}

export function fromE164(e164: string): string {
  // Reverse of toE164 — useful when pre-filling the input from API data.
  if (e164.startsWith(PREFIX)) return e164.slice(PREFIX.length);
  return normalise(e164);
}
