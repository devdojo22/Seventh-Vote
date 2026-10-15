import { useEffect, useRef, type ReactNode } from 'react';

type ModalVariant = 'drawer' | 'dialog';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const OVERLAY_CLASSES: Record<ModalVariant, string> = {
  drawer: 'justify-end',
  dialog: 'items-end justify-center sm:items-center sm:p-6',
};

const PANEL_CLASSES: Record<ModalVariant, string> = {
  drawer: 'h-full w-full max-w-[560px] animate-slide-in-right overflow-y-auto bg-paper',
  dialog:
    'max-h-[100dvh] w-full max-w-[560px] overflow-hidden rounded-t-2xl bg-white sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl',
};

interface ModalProps {
  labelledBy: string;
  /** Must be stable across renders (e.g. a store action), or focus resets on every render. */
  onClose: () => void;
  variant?: ModalVariant;
  children: ReactNode;
}

/**
 * Overlay shell shared by drawers and dialogs: Escape and backdrop click close it, Tab is
 * kept inside, body scroll is locked, and focus returns to the opener on close. Focus starts
 * on the first `[data-autofocus]` element, else the first focusable one.
 */
export function Modal({ labelledBy, onClose, variant = 'dialog', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE)
    )?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex animate-fade-in bg-navy/50 backdrop-blur-sm ${OVERLAY_CLASSES[variant]}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`flex flex-col shadow-elevated ${PANEL_CLASSES[variant]}`}
      >
        {children}
      </div>
    </div>
  );
}

export const MODAL_CLOSE_BUTTON_CLASS =
  'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';
