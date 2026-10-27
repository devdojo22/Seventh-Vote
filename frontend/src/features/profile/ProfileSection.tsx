import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface ProfileSectionProps {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ProfileSection({ id, title, description, action, children }: ProfileSectionProps) {
  return (
    <Card padded={false} className="scroll-mt-20">
      <section aria-labelledby={`${id}-title`}>
        <header className="flex flex-col gap-3 border-b border-line2 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-title`} className="font-display text-lg font-bold text-navy">
              {title}
            </h2>
            <p className="text-xs leading-relaxed text-muted">{description}</p>
          </div>
          {action}
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </Card>
  );
}
