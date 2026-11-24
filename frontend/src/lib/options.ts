export interface Option<T extends string> {
  value: T;
  label: string;
}

export function optionLabel<T extends string>(options: readonly Option<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
