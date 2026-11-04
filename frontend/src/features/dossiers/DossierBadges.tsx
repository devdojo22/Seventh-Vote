import { Badge } from '@/components/ui/Badge';
import { ArchiveIcon } from '@/components/ui/icons';
import {
  REVIEW_STATUS_CLASSES,
  REVIEW_STATUS_DOTS,
  REVIEW_STATUS_LABELS,
  STANCE_LABEL_CLASSES,
  STANCE_LABEL_LABELS,
} from '@/data/dossier-options';
import type { ReviewStatus, StanceLabelValue } from '@/types/dossier';

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge className={REVIEW_STATUS_CLASSES[status]}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${REVIEW_STATUS_DOTS[status]}`} />
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}

export function VersionBadge({ number, current }: { number: number; current?: boolean }) {
  return (
    <Badge className={current ? 'bg-navy text-gold2' : undefined}>
      Version {number}
      {current && <span className="font-medium opacity-80">· current</span>}
    </Badge>
  );
}

export function StanceLabelBadge({ value }: { value: StanceLabelValue }) {
  return <Badge className={STANCE_LABEL_CLASSES[value]}>{STANCE_LABEL_LABELS[value]}</Badge>;
}

export function ArchivedBadge() {
  return (
    <Badge className="border border-line bg-paper text-muted">
      <ArchiveIcon className="size-3.5" />
      Archived
    </Badge>
  );
}
