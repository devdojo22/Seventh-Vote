import { CATEGORY_LABELS } from '@/data/agenda';
import type { Option } from '@/lib/options';
import {
  ASKS,
  CATEGORY_IDS,
  type Ask,
  type AttendanceStatus,
  type CategoryId,
  type DistrictImpact,
  type FiscalImpact,
  type Priority,
} from '@/types/simulation';

export const CATEGORY_OPTIONS: Option<CategoryId>[] = CATEGORY_IDS.map((id) => ({
  value: id,
  label: CATEGORY_LABELS[id],
}));

export const ASK_OPTIONS: Option<Ask>[] = ASKS.map((ask) => ({ value: ask, label: ask }));

export const FISCAL_OPTIONS: Option<FiscalImpact>[] = [
  { value: 'cost', label: 'Costs the city money' },
  { value: 'neutral', label: 'Revenue-neutral' },
  { value: 'revenue', label: 'Generates revenue or savings' },
];

export const IMPACT_OPTIONS: Option<DistrictImpact>[] = [
  { value: 'citywide', label: 'Citywide' },
  { value: 'specific', label: 'Specific seat(s)' },
  { value: 'super', label: 'Super districts' },
];

export const PRIORITY_OPTIONS: Option<Priority>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const ATTENDANCE_OPTIONS: Option<AttendanceStatus>[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'recused', label: 'Recused' },
];
