import { CATEGORY_LABELS } from '@/data/agenda';
import type { CategoryId } from '@/types/simulation';
import type { KeyRecord } from './dossier-api';

export function issueLabel(topic: string): string {
  return topic in CATEGORY_LABELS ? CATEGORY_LABELS[topic as CategoryId] : topic.replace(/_/g, ' ');
}

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const MONTH = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatDateAndTime(iso: string): { date: string; time: string } {
  const value = new Date(iso);
  return { date: DATE.format(value), time: TIME.format(value) };
}

export function recordDate(record: Pick<KeyRecord, 'date' | 'datePrecision' | 'dateText'>): string {
  if (record.dateText) return record.dateText;
  if (!record.date) return '';
  const date = new Date(`${record.date}T00:00:00Z`);
  switch (record.datePrecision) {
    case 'year':
      return record.date.slice(0, 4);
    case 'month':
      return MONTH.format(date);
    default:
      return DAY.format(date);
  }
}
