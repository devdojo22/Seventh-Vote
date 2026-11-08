import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router';
import { Callout } from '@/components/ui/Callout';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTROL_CLASS } from '@/components/ui/Field';
import { INPUT_ICON_CLASS } from '@/components/ui/IconInput';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  EyeIcon,
  HistoryIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  SortIcon,
  SourceDocIcon,
  type IconProps,
} from '@/components/ui/icons';
import {
  REVIEW_STATUS_CAPTIONS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STEPS,
} from '@/data/dossier-options';
import { REVIEW_STATUSES, type ReviewStatus } from '@/types/dossier';
import { dossierHref, listDossiers, type DossierSummary } from './dossier-api';
import { ArchivedBadge, ReviewStatusBadge } from './DossierBadges';
import { formatDateAndTime } from './dossier-format';
import { DossierNotAvailable, LoadError, LoadingText } from './DossierStates';
import { PRIMARY_LINK_CLASS } from './link-classes';
import { useDossierAccess } from './use-dossier-access';
import { useLoad } from './use-load';

type StatusFilter = ReviewStatus | 'all';
type SortKey = 'updated' | 'name' | 'district';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'updated', label: 'Last updated' },
  { id: 'name', label: 'Name' },
  { id: 'district', label: 'District' },
];

const COMPARE: Record<SortKey, (a: DossierSummary, b: DossierSummary) => number> = {
  updated: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  name: (a, b) => a.member.name.localeCompare(b.member.name),
  district: (a, b) =>
    a.member.district.localeCompare(b.member.district, 'en', { numeric: true }) ||
    a.member.name.localeCompare(b.member.name),
};

const STATUS_CARD: Record<ReviewStatus, { Icon: ComponentType<IconProps>; tile: string }> = {
  draft: { Icon: PencilIcon, tile: 'bg-paper text-muted' },
  in_review: { Icon: EyeIcon, tile: 'bg-steel-bg text-steel' },
  approved: { Icon: ShieldIcon, tile: 'bg-pine-bg text-pine' },
};

const STATUS_BAR: Record<ReviewStatus, string> = {
  draft: 'bg-muted/60',
  in_review: 'bg-steel',
  approved: 'bg-pine',
};

const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_4rem_minmax(0,1.1fr)_5.5rem] md:items-center md:gap-4';

const IS_MAC = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

// --- Pieces --------------------------------------------------------------------------------------------

function MemberInitials({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-navy2 to-navy font-display text-sm font-bold text-gold2"
    >
      {initials || '?'}
    </span>
  );
}

function ReviewProgress({ status }: { status: ReviewStatus }) {
  const { step, label } = REVIEW_STATUS_STEPS[status];
  return (
    <div className="min-w-0">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full ${n <= step ? STATUS_BAR[status] : 'bg-line'}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Step {step} of 3 · {label}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tile,
  children,
}: {
  label: string;
  value: number;
  caption?: string;
  icon: ComponentType<IconProps>;
  tile: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink/80">{label}</span>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tile}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <strong className="mt-3 block font-display text-[34px] leading-none font-bold text-navy">
        {value}
      </strong>
      {caption && <p className="mt-4 text-xs text-muted">{caption}</p>}
      {children}
    </div>
  );
}

/** The Total card's bar: each status's share of the dossiers. */
function StatusShare({ counts, total }: { counts: Record<ReviewStatus, number>; total: number }) {
  return (
    <div
      className="mt-5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-line"
      aria-hidden="true"
    >
      {total > 0 &&
        REVIEW_STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <span
            key={s}
            className={STATUS_BAR[s]}
            style={{ width: `${String((counts[s] / total) * 100)}%` }}
          />
        ))}
    </div>
  );
}

/** A row's "⋮" menu. Links only, so nothing is changed from the list without opening the dossier. */
function RowMenu({ dossier, canEdit }: { dossier: DossierSummary; canEdit: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const base = dossierHref(dossier);
  const items = [
    { label: 'Open dossier', to: base },
    ...(canEdit && !dossier.member.archived ? [{ label: 'Edit dossier', to: `${base}/edit` }] : []),
    { label: 'Version history', to: `${base}?tab=versions` },
    { label: 'Review history', to: `${base}?tab=review` },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${dossier.member.name}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-navy focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <MoreVerticalIcon className="size-[18px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1.5 w-48 animate-fade-in rounded-xl border border-line bg-white p-1.5 shadow-elevated"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void navigate(item.to);
              }}
              className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-navy transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DossierRow({ dossier, canEdit }: { dossier: DossierSummary; canEdit: boolean }) {
  const { member } = dossier;
  const role = member.leadershipRole && !/^none/i.test(member.leadershipRole);
  const updated = formatDateAndTime(dossier.updatedAt);
  const href = dossierHref(dossier);
  return (
    <div
      className={`group relative flex flex-col gap-3 border-l-[3px] border-transparent py-4 pr-4 pl-4 transition-colors hover:border-gold hover:bg-amber-bg/45 sm:pl-5 md:pr-5 ${ROW_GRID}`}
    >
      <Link
        to={href}
        className="flex min-w-0 items-center gap-3 rounded-lg pr-24 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none md:pr-0"
      >
        <MemberInitials initials={member.initials} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] leading-tight font-bold text-navy">
            {member.name}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              {[member.district, role ? member.leadershipRole : ''].filter(Boolean).join(' · ') ||
                'No district recorded'}
            </span>
          </span>
        </span>
      </Link>
      <span className="flex flex-wrap items-center gap-1.5">
        <ReviewStatusBadge status={dossier.status} />
        {member.archived && <ArchivedBadge />}
      </span>
      <ReviewProgress status={dossier.status} />
      <span>
        <span className="inline-flex rounded-md border border-line bg-paper px-2 py-0.5 text-xs font-semibold text-navy">
          v{dossier.currentVersionNo}
        </span>
      </span>
      <span className="text-xs leading-snug">
        <span className="block font-semibold text-navy">{updated.date}</span>
        <span className="text-muted">{updated.time}</span>
      </span>
      <span className="absolute top-4 right-4 flex items-center gap-1 md:static md:justify-self-end">
        <Link
          to={href}
          aria-label={`Open ${member.name}’s dossier`}
          className="grid size-9 place-items-center rounded-lg border border-line bg-white text-navy shadow-card transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <ArrowUpRightIcon className="size-4" />
        </Link>
        <RowMenu dossier={dossier} canEdit={canEdit} />
      </span>
    </div>
  );
}

function DossierTable({
  dossiers,
  canEdit,
  archived,
}: {
  dossiers: DossierSummary[];
  canEdit: boolean;
  archived: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('updated');
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K jumps to the search.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const result: Record<ReviewStatus, number> = { draft: 0, in_review: 0, approved: 0 };
    for (const d of dossiers) result[d.status] += 1;
    return result;
  }, [dossiers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dossiers
      .filter(
        (d) =>
          (status === 'all' || d.status === status) &&
          (!q || `${d.member.name} ${d.member.district}`.toLowerCase().includes(q)),
      )
      .sort(COMPARE[sort]);
  }, [dossiers, query, status, sort]);

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: dossiers.length },
    ...REVIEW_STATUSES.map((s) => ({ id: s, label: REVIEW_STATUS_LABELS[s], count: counts[s] })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={archived ? 'Archived dossiers' : 'Total dossiers'}
          value={dossiers.length}
          icon={SourceDocIcon}
          tile="border border-line bg-paper text-navy"
        >
          <StatusShare counts={counts} total={dossiers.length} />
        </StatCard>
        {REVIEW_STATUSES.map((s) => (
          <StatCard
            key={s}
            label={REVIEW_STATUS_LABELS[s]}
            value={counts[s]}
            caption={REVIEW_STATUS_CAPTIONS[s]}
            icon={STATUS_CARD[s].Icon}
            tile={STATUS_CARD[s].tile}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-line2 p-3 sm:p-4 xl:flex-row xl:items-center">
          <div className="group relative min-w-0 flex-1">
            <label htmlFor="dossier-search" className="sr-only">
              Search dossiers
            </label>
            <SearchIcon className={INPUT_ICON_CLASS} />
            <input
              ref={searchRef}
              id="dossier-search"
              type="search"
              placeholder="Search by name or district"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${CONTROL_CLASS} pr-16 pl-11`}
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted sm:block">
              {IS_MAC ? '⌘K' : 'Ctrl K'}
            </kbd>
          </div>
          <div
            role="group"
            aria-label="Filter by review status"
            className="flex gap-1 overflow-x-auto rounded-xl bg-paper p-1"
          >
            {filters.map((f) => {
              const selected = f.id === status;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setStatus(f.id)}
                  className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    selected
                      ? 'bg-white font-semibold text-navy shadow-card'
                      : 'font-medium text-muted hover:text-navy'
                  }`}
                >
                  {f.label} · {f.count}
                </button>
              );
            })}
          </div>
          <div className="relative xl:w-48">
            <label htmlFor="dossier-sort" className="sr-only">
              Sort dossiers
            </label>
            <SortIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-navy" />
            <select
              id="dossier-sort"
              className={`${CONTROL_CLASS} cursor-pointer appearance-none pr-10 pl-10 font-semibold text-navy`}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy" />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title={
                dossiers.length > 0
                  ? 'No matching dossiers'
                  : archived
                    ? 'No archived dossiers'
                    : 'No dossiers yet'
              }
            >
              {dossiers.length > 0
                ? 'Try a different name, district or status.'
                : archived
                  ? 'Archived dossiers appear here, where they can be restored.'
                  : canEdit
                    ? 'Create the first dossier for this workspace.'
                    : 'Dossiers will appear here once they are added.'}
            </EmptyState>
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className={`hidden border-b border-line2 py-3 pr-5 pl-[23px] text-[11px] font-bold tracking-[0.1em] text-muted uppercase md:grid ${ROW_GRID}`}
            >
              <span>Council member</span>
              <span>Status</span>
              <span>Review progress</span>
              <span>Version</span>
              <span>Last updated</span>
              <span className="text-right">Actions</span>
            </div>
            <ul aria-label="Dossiers" className="divide-y divide-line2">
              {visible.map((d) => (
                <li key={d.id}>
                  <DossierRow dossier={d} canEdit={canEdit} />
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex flex-col gap-2 rounded-b-2xl border-t border-line2 bg-paper/60 px-5 py-3.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <strong className="font-semibold text-navy">{visible.length}</strong> of{' '}
            {dossiers.length} {dossiers.length === 1 ? 'dossier' : 'dossiers'}
          </span>
          <span className="flex items-center gap-1.5">
            <HistoryIcon className="size-3.5" />
            Every edit is versioned — open a dossier to see its full history
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Page ----------------------------------------------------------------------------------------------

export function DossiersPage() {
  const access = useDossierAccess();
  const [archived, setArchived] = useState(false);
  // Both lists at once, so each tab shows its count.
  const fetchDossiers = useCallback(
    () =>
      Promise.all([listDossiers(), listDossiers({ archived: true })]).then(
        ([active, archivedList]) => ({ active, archived: archivedList }),
      ),
    [],
  );
  const { loaded, reload } = useLoad(fetchDossiers);

  if (!access.canView) return <DossierNotAvailable reason="no-access" />;

  const shown =
    loaded.state === 'ready' ? (archived ? loaded.data.archived : loaded.data.active) : [];

  const tabs = [
    {
      archived: false,
      label: 'Active',
      count: loaded.state === 'ready' ? loaded.data.active.length : null,
    },
    {
      archived: true,
      label: 'Archived',
      count: loaded.state === 'ready' ? loaded.data.archived.length : null,
    },
  ];

  return (
    <section>
      {/* Header band: white edge to edge; the list below sits on the page background. It is widened with
          box-shadows, which paint past the edges without making the page wider (no horizontal scroll); the
          second shadow, 1px lower, is the line under the band. */}
      <div className="bg-white pt-1 shadow-[0_0_0_100vmax_#fff,0_1px_0_100vmax_var(--color-line)] [clip-path:inset(0_-100vmax_-1px)] lg:-mt-10 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-[13px]">
          <ol className="flex items-center gap-1.5 text-muted">
            <li>
              <Link
                to="/"
                className="rounded transition-colors hover:text-navy focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                Workspace
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronDownIcon className="size-3.5 -rotate-90 text-muted/60" />
            </li>
            <li aria-current="page" className="font-semibold text-navy">
              Dossiers
            </li>
          </ol>
        </nav>

        <header className="mt-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] text-gold uppercase">
              <span aria-hidden="true" className="h-px w-5 bg-current" />
              Member dossiers
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[1.05] font-bold tracking-tight text-navy sm:text-[46px]">
              Dossiers
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">
              The public-record profile behind each council member — with its sources, review status
              and full edit history.
            </p>
          </div>
          {access.canEdit && !archived && (
            <Link to="/dossiers/new" className={`${PRIMARY_LINK_CLASS} sm:shrink-0`}>
              <PlusIcon className="size-4" />
              New dossier
            </Link>
          )}
        </header>

        <div role="tablist" aria-label="Show dossiers" className="mt-7 flex gap-7">
          {tabs.map((tab) => {
            const selected = tab.archived === archived;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="dossiers-panel"
                onClick={() => setArchived(tab.archived)}
                className={`flex cursor-pointer items-center gap-2 border-b-2 pb-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  selected
                    ? 'border-gold font-semibold text-navy'
                    : 'border-transparent font-medium text-muted hover:text-navy'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-bold ${
                      selected ? 'bg-navy text-white' : 'bg-line2 text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id="dossiers-panel" role="tabpanel" className="space-y-6 pt-8">
        {!access.canEdit && (
          <Callout title="View only">
            You can read every dossier and its history. Editing needs the Principal’s permission.
          </Callout>
        )}

        {loaded.state === 'loading' && <LoadingText>Loading dossiers…</LoadingText>}
        {loaded.state === 'error' && (
          <LoadError
            title="Dossiers couldn’t be loaded"
            message={loaded.message}
            onRetry={reload}
          />
        )}
        {loaded.state === 'ready' && (
          <DossierTable
            key={String(archived)}
            dossiers={shown}
            canEdit={access.canEdit}
            archived={archived}
          />
        )}
      </div>
    </section>
  );
}
