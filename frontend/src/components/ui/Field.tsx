import type { ReactNode } from 'react';

export const LABEL_CLASS = 'text-[13px] font-semibold text-navy';

export const CONTROL_CLASS =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_1px_rgb(13_36_56/0.03)] transition placeholder:text-muted/60 hover:border-navy/25 focus:border-navy focus:ring-4 focus:ring-navy/8 focus:outline-none aria-invalid:border-brick aria-invalid:focus:ring-brick/10';

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="text-xs font-semibold text-brick">
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

export function Field({ id, label, required, hint, error, className = '', children }: FieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-brick"> *</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}
