import type { ComponentProps, ComponentType } from 'react';
import { CONTROL_CLASS } from './Field';
import type { IconProps } from './icons';

/** Positions a leading icon inside a `group relative` wrapper around a CONTROL_CLASS input. */
export const INPUT_ICON_CLASS =
  'pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted/70 transition-colors group-focus-within:text-navy';

export function IconInput({
  icon: Icon,
  className = '',
  ...props
}: ComponentProps<'input'> & { icon: ComponentType<IconProps> }) {
  return (
    <div className="group relative">
      <Icon className={INPUT_ICON_CLASS} />
      <input className={`${CONTROL_CLASS} pl-11 ${className}`} {...props} />
    </div>
  );
}
