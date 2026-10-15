import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

const CELL_CLASS =
  'h-12 w-full min-w-0 rounded-xl border border-line bg-white text-center font-display text-xl font-bold text-navy tabular-nums shadow-[inset_0_1px_1px_rgb(13_36_56/0.03)] transition caret-gold hover:border-navy/25 focus:border-navy focus:ring-4 focus:ring-navy/8 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-brick aria-invalid:focus:ring-brick/10 sm:h-14 sm:text-2xl';

const SEPARATORS = /[\s-]/g;

interface CodeInputProps {
  id: string;
  digits: string[];
  onChange: (digits: string[]) => void;
  onRejectedInput: () => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
}

export function CodeInput({
  id,
  digits,
  onChange,
  onRejectedInput,
  labelledBy,
  describedBy,
  invalid = false,
  disabled = false,
}: CodeInputProps) {
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const length = digits.length;
  const half = Math.ceil(length / 2);

  const focusCell = (index: number) => {
    const cell = cells.current[Math.max(0, Math.min(index, length - 1))];
    cell?.focus();
    cell?.select();
  };

  const fill = (start: number, incoming: string) => {
    const next = [...digits];
    const written = incoming.slice(0, length - start).split('');
    written.forEach((d, k) => (next[start + k] = d));
    onChange(next);
    focusCell(start + written.length);
  };

  const accept = (index: number, raw: string) => {
    const text = raw.replace(SEPARATORS, '');
    if (!text) return;
    if (!/^\d+$/.test(text)) {
      onRejectedInput();
      return;
    }
    fill(text.length >= length ? 0 : index, text);
  };

  const handleChange = (index: number, raw: string) => {
    if (raw === '') {
      const next = [...digits];
      next[index] = '';
      onChange(next);
      return;
    }
    const current = digits[index];
    if (raw.length === 2 && current && raw.includes(current)) {
      accept(index, raw[0] === current ? raw.slice(1) : raw.slice(0, 1));
      return;
    }
    accept(index, raw);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Backspace':
        if (!digits[index] && index > 0) {
          e.preventDefault();
          const next = [...digits];
          next[index - 1] = '';
          onChange(next);
          focusCell(index - 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusCell(index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusCell(index + 1);
        break;
      case 'Home':
        e.preventDefault();
        focusCell(0);
        break;
      case 'End':
        e.preventDefault();
        focusCell(length - 1);
        break;
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    accept(index, e.clipboardData.getData('text'));
  };

  const renderCell = (index: number) => (
    <input
      key={index}
      ref={(el) => {
        cells.current[index] = el;
      }}
      id={index === 0 ? id : `${id}-${index + 1}`}
      type="text"
      inputMode="numeric"
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      pattern="[0-9]*"
      aria-label={`Digit ${index + 1} of ${length}`}
      aria-invalid={invalid}
      disabled={disabled}
      value={digits[index]}
      onChange={(e) => handleChange(index, e.target.value)}
      onKeyDown={(e) => handleKeyDown(index, e)}
      onPaste={(e) => handlePaste(index, e)}
      onFocus={(e) => e.target.select()}
      className={CELL_CLASS}
    />
  );

  const indexes = digits.map((_, i) => i);
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="flex items-center gap-1.5 sm:gap-2"
    >
      <div className="flex flex-1 gap-1.5 sm:gap-2">{indexes.slice(0, half).map(renderCell)}</div>
      <span aria-hidden="true" className="h-0.5 w-2.5 shrink-0 rounded-full bg-line sm:w-3" />
      <div className="flex flex-1 gap-1.5 sm:gap-2">{indexes.slice(half).map(renderCell)}</div>
    </div>
  );
}
