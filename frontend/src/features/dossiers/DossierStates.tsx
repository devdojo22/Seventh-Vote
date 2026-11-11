import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Callout } from '@/components/ui/Callout';
import { ArrowLeftIcon } from '@/components/ui/icons';

const COPY = {
  'no-access': {
    title: 'Dossiers aren’t available',
    body: 'Choose a workspace you belong to from the workspace menu to see its dossiers.',
  },
  'no-edit': {
    title: 'You can’t edit dossiers',
    body: 'Editing dossiers needs the Principal’s permission. Ask them if your access needs to change.',
  },
} as const;

export function DossierNotAvailable({ reason }: { reason: keyof typeof COPY }) {
  const copy = COPY[reason];
  return (
    <section className="space-y-8">
      <PageHeader eyebrow="Member dossiers" title={copy.title} description={copy.body} />
      {reason === 'no-edit' && <BackLink />}
    </section>
  );
}

export function BackLink({ to = '/dossiers', label = 'All dossiers' }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-muted transition-colors hover:text-navy focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
    >
      <ArrowLeftIcon className="size-4" />
      {label}
    </Link>
  );
}

export function LoadError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Callout title={title}>
      <span role="alert">{message}</span>{' '}
      <button type="button" className="cursor-pointer font-semibold underline" onClick={onRetry}>
        Try again
      </button>
    </Callout>
  );
}
