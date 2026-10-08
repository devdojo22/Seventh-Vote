import { useEffect, useRef, type ReactNode } from 'react';
import { SourceLink } from '@/components/SourceLink';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BulletList } from '@/components/ui/BulletList';
import { Callout } from '@/components/ui/Callout';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloseIcon, LockIcon } from '@/components/ui/icons';
import { CATEGORY_LABELS } from '@/data/agenda';
import { alignment, fieldText, POSTURE_CLASSES, postureLabel, recordDepth } from '@/lib/members';
import { isHttpUrl } from '@/lib/url';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import type { CategoryId } from '@/types/simulation';
import { YourCallControl } from './YourCallControl';

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function issueLabel(key: string): string {
  return key in CATEGORY_LABELS ? CATEGORY_LABELS[key as CategoryId] : key.replace(/_/g, ' ');
}

export function MemberDrawer() {
  const memberId = useAppStore((s) => s.openMemberId);
  const closeMember = useAppStore((s) => s.closeMember);
  const member = useCouncilStore((s) => (memberId ? s.membersById[memberId] : undefined));
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, body scroll is locked, and focus returns to the opener on close.
  useEffect(() => {
    if (!member) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMember();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [member, closeMember]);

  if (!member) return null;

  const depth = recordDepth(member);
  const posture = alignment(member);
  const quotes = member.notable_quotes.filter((q) => isHttpUrl(q.source_url));
  const positions = Object.entries(member.issue_positions);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in justify-end bg-navy/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-name"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMember();
      }}
    >
      <div className="flex h-full w-full max-w-[720px] animate-slide-in-right flex-col overflow-y-auto bg-paper shadow-elevated">
        <div className="sticky top-0 z-20 shrink-0 bg-navy text-white shadow-[0_1px_0_rgb(200_155_60/0.55)]">
          <div className="flex items-center gap-4 p-5 sm:px-7 sm:py-6">
            <Avatar name={member.name} size="lg" inverted />
            <div className="min-w-0 flex-1">
              <h2
                id="drawer-name"
                className="truncate font-display text-2xl leading-tight font-bold sm:text-[28px]"
              >
                {member.name}
              </h2>
              <p className="mt-0.5 truncate text-[13px] text-white/65">
                {member.district} · {member.leadership_role}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label="Close dossier"
              onClick={closeMember}
            >
              <CloseIcon className="size-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 p-4 pb-16 text-[13px] leading-relaxed text-ink/80 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={POSTURE_CLASSES[posture]}>
              {postureLabel(posture)} mayor posture
            </Badge>
            <Badge>{depth.label} record depth</Badge>
          </div>

          <div className="space-y-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <Section title="Your call · private" icon={<LockIcon className="size-4 text-gold" />}>
              <YourCallControl member={member} />
            </Section>
          </div>

          <div className="divide-y divide-line2 rounded-2xl border border-line bg-white shadow-card *:p-5 sm:*:p-6">
            <Section title="Profile">
              <p>{member.bio}</p>
              <p>
                <strong className="font-semibold text-navy">Political style:</strong>{' '}
                {fieldText(member.political_style)}
              </p>
            </Section>

            <Section title="Committees & leadership">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(member.committees).map(([committee, role]) => (
                  <div className="rounded-xl bg-paper px-3.5 py-3 text-xs" key={committee}>
                    <strong className="mb-0.5 block font-semibold text-navy">{committee}</strong>
                    <span className="text-muted">{role}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Issue positions">
              {positions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {positions.map(([key, p]) => (
                    <div className="space-y-1.5 rounded-xl border border-line p-3.5" key={key}>
                      <h4 className="text-[13px] font-semibold text-navy capitalize">
                        {issueLabel(key)}
                      </h4>
                      <p className="text-xs">
                        <strong className="font-semibold text-navy">Stance:</strong> {p.stance}
                      </p>
                      <p className="text-xs">{p.evidence}</p>
                      <p className="text-xs">
                        <SourceLink name={p.source_name} url={p.source_url} label="Source" />
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No sourced positions found.</EmptyState>
              )}
            </Section>

            <Section title="Key record">
              <ol className="relative space-y-4 border-l border-line pl-5">
                {member.key_votes.map((v) => (
                  <li className="relative space-y-1" key={v.id}>
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[23.5px] size-2 rounded-full bg-gold ring-4 ring-white"
                    />
                    <h4 className="text-[13px] font-semibold text-ink">{v.item}</h4>
                    <div className="text-[11px] font-medium text-muted">
                      {v.date} · {v.position}
                    </div>
                    <div className="text-xs">
                      <SourceLink name={v.source_name} url={v.source_url} label="View source" />
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Voice evidence">
              <p>{fieldText(member.twin_voice)}</p>
              {quotes.length > 0 ? (
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <figure className="rounded-xl bg-paper p-4" key={q.id}>
                      <blockquote className="border-l-2 border-gold pl-3.5 font-display text-base leading-snug text-navy italic sm:text-[17px]">
                        &ldquo;{q.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-2 pl-4 text-xs">
                        <SourceLink name={q.source_name} url={q.source_url} label="Source" />
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <EmptyState>No verified direct quote available.</EmptyState>
              )}
            </Section>

            <Section title="Decision pattern">
              <p>
                <strong className="font-semibold text-navy">Voting bloc:</strong>{' '}
                {member.voting_bloc}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl bg-brick-bg/60 p-4">
                  <strong className="block text-xs font-bold tracking-wide text-brick uppercase">
                    Opposition triggers
                  </strong>
                  <BulletList items={member.opposition_triggers} />
                </div>
                <div className="space-y-2 rounded-xl bg-pine-bg/70 p-4">
                  <strong className="block text-xs font-bold tracking-wide text-pine uppercase">
                    Persuasion levers
                  </strong>
                  <BulletList items={member.persuasion_levers} />
                </div>
              </div>
            </Section>

            <Section title="Data gaps">
              <Callout>
                <BulletList items={member.data_gaps} />
              </Callout>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
