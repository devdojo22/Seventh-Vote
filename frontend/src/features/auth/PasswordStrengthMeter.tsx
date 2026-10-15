import { CheckCircleIcon } from '@/components/ui/icons';
import { passwordChecks, passwordStrength, type PasswordStrength } from './auth-schema';

const LEVELS: Record<Exclude<PasswordStrength, 0>, { label: string; bar: string; text: string }> = {
  1: { label: 'Weak', bar: 'bg-brick', text: 'text-brick' },
  2: { label: 'Fair', bar: 'bg-gold', text: 'text-amber' },
  3: { label: 'Good', bar: 'bg-steel', text: 'text-steel' },
  4: { label: 'Strong', bar: 'bg-pine', text: 'text-pine' },
};

const SEGMENTS = [1, 2, 3, 4] as const;

export function PasswordStrengthMeter({ id, password }: { id: string; password: string }) {
  const strength = passwordStrength(password);
  const level = strength === 0 ? null : LEVELS[strength];

  return (
    <div id={id} className="grid gap-2.5 rounded-xl border border-line2 bg-paper/70 p-3">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
          {SEGMENTS.map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                level && n <= strength ? level.bar : 'bg-line'
              }`}
            />
          ))}
        </div>
        <span
          aria-live="polite"
          className={`shrink-0 text-right text-xs font-semibold whitespace-nowrap ${level ? level.text : 'text-muted'}`}
        >
          {level ? `${level.label} password` : 'Not set'}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        {passwordChecks(password).map(({ label, met }, i) => (
          <li
            key={label}
            className={`flex items-center gap-1.5 transition-colors ${met ? 'text-pine' : 'text-muted'}`}
          >
            {met ? (
              <CheckCircleIcon className="size-3.5 shrink-0" />
            ) : (
              <span aria-hidden="true" className="grid size-3.5 shrink-0 place-items-center">
                <span className="size-1 rounded-full bg-muted/60" />
              </span>
            )}
            <span>
              {label}
              {i === 0 && <span className="text-muted"> (required)</span>}
              <span className="sr-only">{met ? ', met' : ', not met'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
