import { passwordStrength, type PasswordStrength } from './auth-schema';

const LEVELS: Record<
  PasswordStrength,
  { label: string; filled: number; bar: string; text: string }
> = {
  weak: { label: 'Weak', filled: 1, bar: 'bg-brick', text: 'text-brick' },
  medium: { label: 'Medium', filled: 2, bar: 'bg-gold', text: 'text-amber' },
  strong: { label: 'Strong', filled: 3, bar: 'bg-pine', text: 'text-pine' },
};

const SEGMENTS = [1, 2, 3] as const;

export function PasswordStrengthMeter({ id, password }: { id: string; password: string }) {
  const strength = passwordStrength(password);
  const level = strength === null ? null : LEVELS[strength];

  return (
    <div id={id} className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-3 gap-1" aria-hidden="true">
        {SEGMENTS.map((n) => (
          <span
            key={n}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              level && n <= level.filled ? level.bar : 'bg-line'
            }`}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className={`min-w-14 shrink-0 text-right text-xs font-semibold whitespace-nowrap ${level ? level.text : 'text-muted'}`}
      >
        {level ? level.label : ''}
        {level && <span className="sr-only"> password</span>}
      </span>
    </div>
  );
}
