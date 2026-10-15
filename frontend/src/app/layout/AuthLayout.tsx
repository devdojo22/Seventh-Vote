import type { ComponentType } from 'react';
import { Outlet, useLocation } from 'react-router';
import { LockIcon, ShieldIcon, SourceDocIcon, type IconProps } from '@/components/ui/icons';
import { useCouncilStore } from '@/stores/council-store';

interface Assurance {
  Icon: ComponentType<IconProps>;
  title: string;
  body: string;
}

const ASSURANCES: Assurance[] = [
  {
    Icon: LockIcon,
    title: 'Multi-factor sign-in',
    body: 'After your password, you confirm a one-time code from your authenticator app.',
  },
  {
    Icon: ShieldIcon,
    title: 'Workspace access control',
    body: 'You see only the council workspaces your role has been granted.',
  },
  {
    Icon: SourceDocIcon,
    title: 'Every read is cited',
    body: 'Member reads trace back to the public record, so each claim can be checked.',
  },
];

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 place-items-center rounded-lg bg-linear-to-br from-gold to-[#a77d27] font-display text-[17px] font-bold text-navy shadow-sm ${className}`}
    >
      7
    </span>
  );
}

function BrandPanel() {
  const seatCount = useCouncilStore((s) => s.config.seatCount);
  const snapshotLabel = useCouncilStore((s) => s.config.snapshotLabel);

  return (
    <aside className="relative hidden w-[44%] max-w-[560px] shrink-0 flex-col overflow-hidden bg-navy px-10 py-10 text-white shadow-[1px_0_0_rgb(200_155_60/0.55)] lg:flex xl:px-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgb(200_155_60/0.14),transparent_55%)]"
      />

      <div className="relative flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-[17px] font-bold tracking-tight">Seventh Vote</span>
      </div>

      <div className="relative my-auto py-12">
        <p className="mb-3 text-xs font-bold tracking-[0.14em] text-gold uppercase">
          Secure council simulation
        </p>
        <h2 className="max-w-md font-display text-[40px] leading-[1.08] font-bold tracking-tight">
          Know your count before the count.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
          Rehearse agenda items against {seatCount} public-record dossiers, find the pivotal vote,
          and plan the conversations that matter.
        </p>

        <ul className="mt-10 grid max-w-md gap-5">
          {ASSURANCES.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                <Icon className="size-[18px] text-gold" />
              </span>
              <div className="min-w-0">
                <strong className="block text-sm font-semibold">{title}</strong>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-white/60">
                  {body}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/55">
        <span>
          <strong className="font-semibold text-white/80">Rehearsal, not prediction.</strong>{' '}
          Public-record hypotheses for preparation.
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium whitespace-nowrap text-white/80">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
          {snapshotLabel}
        </span>
      </div>
    </aside>
  );
}

export function AuthLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      <BrandPanel />

      <main id="main" className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2.5 bg-navy px-4 text-white shadow-[0_1px_0_rgb(200_155_60/0.55)] sm:px-6 lg:hidden">
          <LogoMark />
          <span className="font-display text-[17px] font-bold tracking-tight">Seventh Vote</span>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div key={pathname} className="w-full max-w-[440px] animate-fade-in">
            <Outlet />
          </div>
        </div>

        <p className="px-4 pb-6 text-center text-xs leading-relaxed text-muted lg:hidden">
          <strong className="font-semibold text-navy">Rehearsal, not prediction.</strong>{' '}
          Public-record hypotheses for preparation.
        </p>
      </main>
    </div>
  );
}
