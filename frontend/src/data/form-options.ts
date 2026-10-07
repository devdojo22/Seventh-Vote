import type { AttendanceStatus, DistrictImpact, FiscalImpact, Priority } from '@/types/simulation';

interface Option<T extends string> {
  value: T;
  label: string;
}

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
