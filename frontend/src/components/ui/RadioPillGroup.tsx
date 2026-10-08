import { LABEL_CLASS } from './Field';

interface RadioPillGroupProps<T extends string> {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

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
      <div className="inline-flex flex-wrap gap-1 self-start rounded-xl border border-line bg-paper p-1">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all select-none has-focus-visible:ring-2 has-focus-visible:ring-gold ${
                checked
                  ? 'bg-white text-navy shadow-card ring-1 ring-line'
                  : 'text-muted hover:text-navy'
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
