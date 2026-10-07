import type { ReactNode } from 'react';

export const LABEL_CLASS =
  'font-sans text-xs font-semibold tracking-wider text-navy uppercase sm:text-sm';

export const CONTROL_CLASS =
  'w-full rounded-lg border border-line bg-paper/40 px-3.5 py-2.5 font-sans text-sm text-navy transition-colors placeholder:text-navy/40 focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/10 focus:outline-none';

export const PRIMARY_BUTTON_CLASS =
  'w-full cursor-pointer rounded-xl bg-navy px-8 py-3 font-display text-sm font-bold tracking-wider text-gold uppercase shadow-md transition-all hover:bg-navy/90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto';

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="font-sans text-xs font-semibold text-brick">
      {message}
    </p>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Label, control slot, optional hint and validation error. */
export function Field({ id, label, required, hint, error, className = '', children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="font-bold text-brick"> *</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 font-sans text-xs text-navy/60 italic">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}
