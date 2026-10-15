import { useState, type ComponentProps } from 'react';
import { Callout } from '@/components/ui/Callout';
import { CONTROL_CLASS } from '@/components/ui/Field';
import { INPUT_ICON_CLASS } from '@/components/ui/IconInput';
import { EyeIcon, EyeOffIcon, LockIcon } from '@/components/ui/icons';

export function PasswordInput({
  id,
  className = '',
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="group relative">
      <LockIcon className={INPUT_ICON_CLASS} />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`${CONTROL_CLASS} pr-12 pl-11 [&::-ms-reveal]:hidden ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-controls={id}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-navy focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        {visible ? <EyeOffIcon className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
      </button>
    </div>
  );
}

export interface AuthNoticeContent {
  title: string;
  body: string;
}

export function AuthNotice({ notice }: { notice: AuthNoticeContent | null }) {
  return (
    <div role="status" aria-live="polite">
      {notice && (
        <Callout title={notice.title} className="animate-fade-in">
          {notice.body}
        </Callout>
      )}
    </div>
  );
}

interface AuthHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  titleId?: string;
}

export function AuthHeading({ eyebrow, title, description, titleId }: AuthHeadingProps) {
  return (
    <header className="mb-7">
      <p className="mb-2 text-xs font-bold tracking-[0.14em] text-gold uppercase">{eyebrow}</p>
      <h1
        id={titleId}
        tabIndex={titleId ? -1 : undefined}
        className="font-display text-[30px] leading-[1.1] font-bold tracking-tight text-navy focus:outline-none sm:text-[34px]"
      >
        {title}
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted sm:text-[15px]">{description}</p>
    </header>
  );
}

export function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const TEXT_LINK_CLASS =
  'cursor-pointer rounded font-semibold text-navy underline decoration-gold/50 decoration-2 underline-offset-4 transition-colors hover:decoration-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';
