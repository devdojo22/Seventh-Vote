import type { ComponentProps, ReactNode } from 'react';

export function Checkbox({
  label,
  className = '',
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-muted select-none ${className}`}
    >
      <input
        type="checkbox"
        className="mt-px size-4 shrink-0 cursor-pointer rounded accent-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
