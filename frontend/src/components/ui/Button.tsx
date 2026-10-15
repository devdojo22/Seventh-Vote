import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

const BASE_CLASS =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white shadow-card hover:bg-navy2',
  secondary:
    'border border-line bg-white text-navy shadow-card hover:border-navy/25 hover:bg-paper',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Stretch to the container width at every breakpoint, not only on mobile. */
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  type = 'button',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const widthClass = fullWidth ? 'w-full' : 'w-full sm:w-auto';
  return (
    <button
      type={type}
      className={`${BASE_CLASS} ${widthClass} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
