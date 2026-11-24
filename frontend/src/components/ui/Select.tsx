import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { optionLabel, type Option } from '@/lib/options';
import { ChevronDownIcon } from './icons';

type SelectSize = 'md' | 'sm';

const TRIGGER_SIZE_CLASSES: Record<SelectSize, string> = {
  md: 'w-full gap-2.5 rounded-xl px-3.5 py-2.5 text-sm shadow-[inset_0_1px_1px_rgb(13_36_56/0.03)]',
  sm: 'w-24 gap-1.5 rounded-lg py-1.5 pr-2 pl-3 text-xs',
};

const MENU_SIZE_CLASSES: Record<SelectSize, string> = {
  md: 'inset-x-0 mt-1.5 rounded-xl p-1.5',
  sm: 'right-0 mt-1 min-w-full rounded-lg p-1',
};

const OPTION_SIZE_CLASSES: Record<SelectSize, string> = {
  md: 'rounded-lg px-2.5 py-2 text-[13px]',
  sm: 'rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap',
};

interface SelectProps<T extends string> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  onBlur?: () => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
  id?: string;
  size?: SelectSize;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  onBlur,
  buttonRef,
  id,
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: SelectProps<T>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const currentLabel = optionLabel(options, value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    const list = listRef.current;
    (
      list?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      list?.querySelector<HTMLButtonElement>('[role="option"]')
    )?.focus();
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const setTrigger = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    buttonRef?.(node);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const choose = (next: T) => {
    close();
    if (next !== value) onChange(next);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    setOpen(true);
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${size === 'sm' ? 'shrink-0' : ''} ${className}`}
    >
      <button
        ref={setTrigger}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        onBlur={onBlur}
        className={`flex cursor-pointer items-center border bg-white text-left font-medium text-navy transition-colors hover:border-navy/40 focus-visible:border-navy focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-brick ${TRIGGER_SIZE_CLASSES[size]} ${
          open ? 'border-navy' : 'border-line'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{currentLabel}</span>
        <ChevronDownIcon
          className={`shrink-0 text-muted transition-transform ${size === 'sm' ? 'size-3.5' : 'size-4'} ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : id}
          onKeyDown={onListKeyDown}
          className={`absolute top-full z-40 grid max-h-72 animate-fade-in gap-0.5 overflow-y-auto bg-white shadow-elevated ring-1 ring-line ${MENU_SIZE_CLASSES[size]}`}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => choose(o.value)}
                  className={`w-full cursor-pointer text-left transition-colors focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none ${OPTION_SIZE_CLASSES[size]} ${
                    selected
                      ? 'bg-navy font-semibold text-white'
                      : 'font-medium text-navy hover:bg-navy/8 focus-visible:bg-navy/8'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
