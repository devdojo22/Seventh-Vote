import { useEffect, useRef, type ReactNode } from 'react';
import { SourceLink } from '@/components/SourceLink';
import { CATEGORY_LABELS } from '@/data/agenda';
import {
  alignment,
  fieldText,
  initials,
  POSTURE_CLASSES,
  postureLabel,
  recordDepth,
} from '@/lib/members';
import { isHttpUrl } from '@/lib/url';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import type { CategoryId } from '@/types/simulation';
import { YourCallControl } from './YourCallControl';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 border-t border-line pt-2">
      <h3 className="font-display text-[18px] font-semibold text-navy sm:text-[21px]">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function issueLabel(key: string): string {
  return key in CATEGORY_LABELS ? CATEGORY_LABELS[key as CategoryId] : key.replace(/_/g, ' ');
}

/** Full dossier drawer for the member selected in the app store. */
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
      className="fixed inset-0 z-50 flex animate-fade-in justify-end bg-[#04101a]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-name"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMember();
      }}
    >
      <div className="flex h-full w-full max-w-[690px] animate-slide-in-right flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex shrink-0 items-center gap-3.5 border-b-4 border-gold bg-navy p-4.5 text-white sm:p-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-gold2 bg-white font-display text-[18px] font-bold text-navy">
            {initials(member.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="drawer-name"
              className="truncate font-display text-[22px] leading-tight font-semibold sm:text-[28px]"
            >
              {member.name}
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-[#c8d5de]">
              {member.district} · {member.leadership_role}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ml-auto flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-transparent text-xl text-white transition-colors hover:bg-white/10"
            aria-label="Close dossier"
            onClick={closeMember}
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-6 p-4.5 pb-16 text-[13px] text-[#405565] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${POSTURE_CLASSES[posture]}`}
            >
              {postureLabel(posture)} mayor posture
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2f4] px-2.5 py-1 text-[11px] font-bold text-[#405565]">
              {depth.label} record depth
            </span>
          </div>

          <Section title="Your call · private">
            <YourCallControl member={member} />
          </Section>

          <Section title="Profile">
            <p className="leading-relaxed">{member.bio}</p>
            <p className="leading-relaxed">
              <strong className="font-semibold text-navy">Political style:</strong>{' '}
              {fieldText(member.political_style)}
            </p>
          </Section>

          <Section title="Committees & leadership">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(member.committees).map(([committee, role]) => (
                <div className="rounded-lg bg-[#f3f6f7] p-2.5 text-[12px]" key={committee}>
                  <strong className="mb-0.5 block font-semibold text-navy">{committee}</strong>
                  <span>{role}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Issue positions">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {positions.map(([key, p]) => (
                <div className="space-y-1.5 rounded-lg border border-line bg-white p-3" key={key}>
                  <h4 className="text-[13px] font-semibold text-navy capitalize">
                    {issueLabel(key)}
                  </h4>
                  <p className="text-[12px]">
                    <strong className="font-semibold text-navy">Stance:</strong> {p.stance}
                  </p>
                  <p className="text-[12px] leading-relaxed">{p.evidence}</p>
                  <SourceLink name={p.source_name} url={p.source_url} label="Source" />
                </div>
              ))}
              {positions.length === 0 && <p className="text-muted">No sourced positions found.</p>}
            </div>
          </Section>

          <Section title="Key record">
            <div className="divide-y divide-line2">
              {member.key_votes.map((v) => (
                <div className="space-y-1 py-3 first:pt-0 last:pb-0" key={v.id}>
                  <h4 className="text-[13px] font-semibold text-ink">{v.item}</h4>
                  <div className="text-[11px] text-muted">
                    {v.date} · {v.position}
                  </div>
                  <SourceLink name={v.source_name} url={v.source_url} label="View source" />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Voice evidence">
            <p className="leading-relaxed">{fieldText(member.twin_voice)}</p>
            {quotes.length > 0 ? (
              <div className="space-y-3 pt-1">
                {quotes.map((q) => (
                  <div className="space-y-1" key={q.id}>
                    <p className="border-l-3 border-gold py-0.5 pl-3 font-display text-[16px] leading-snug text-navy italic sm:text-[18px]">
                      &ldquo;{q.quote}&rdquo;
                    </p>
                    <div className="pl-3">
                      <SourceLink name={q.source_name} url={q.source_url} label="Source" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No verified direct quote available.</p>
            )}
          </Section>

          <Section title="Decision pattern">
            <p>
              <strong className="font-semibold text-navy">Voting bloc:</strong> {member.voting_bloc}
            </p>
            <div className="space-y-1">
              <strong className="block font-semibold text-navy">Opposition triggers</strong>
              <BulletList items={member.opposition_triggers} />
            </div>
            <div className="space-y-1 pt-1">
              <strong className="block font-semibold text-navy">Persuasion levers</strong>
              <BulletList items={member.persuasion_levers} />
            </div>
          </Section>

          <Section title="Data gaps">
            <div className="rounded-lg border border-[#ead5a7] bg-amber-bg p-3 text-[12px] text-[#775218]">
              <BulletList items={member.data_gaps} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
