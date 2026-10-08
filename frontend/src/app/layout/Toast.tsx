import { CheckCircleIcon } from '@/components/ui/icons';
import { useAppStore } from '@/stores/app-store';

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 animate-fade-in items-center gap-2.5 rounded-xl bg-navy px-4 py-3 text-[13px] font-medium whitespace-nowrap text-white shadow-elevated lg:bottom-8"
    >
      <CheckCircleIcon className="size-4 text-gold" />
      {toast}
    </div>
  );
}
