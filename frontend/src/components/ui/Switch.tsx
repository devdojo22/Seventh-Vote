import type { ReactNode } from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  id,
  checked,
  onChange,
  label,
  describedBy,
  disabled = false,
  className = '',
}: SwitchProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'border-navy bg-navy' : 'border-line bg-line'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0.5 size-[18px] rounded-full bg-white shadow-card transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="cursor-pointer text-[13px] font-semibold text-navy select-none"
      >
        {label}
      </label>
    </div>
  );
}
