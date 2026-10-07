import { LABEL_CLASS } from './form';

interface RadioPillGroupProps<T extends string> {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A labelled row of radio pills for a small fixed set of values. */
export function RadioPillGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  className = '',
}: RadioPillGroupProps<T>) {
  return (
    <fieldset className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <legend className={`${LABEL_CLASS} mb-1.5`}>{legend}</legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`inline-flex cursor-pointer items-center justify-center rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all select-none has-focus-visible:ring-2 has-focus-visible:ring-gold sm:text-sm ${
                checked
                  ? 'border-navy bg-navy text-gold shadow-xs'
                  : 'border-line bg-white text-navy/80 hover:border-navy/30 hover:bg-paper/50'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
