import { initials } from '@/lib/members';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-12 text-base',
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  inverted?: boolean;
}

export function Avatar({ name, size = 'md', inverted = false }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold ring-2 ${SIZE_CLASSES[size]} ${
        inverted
          ? 'bg-white text-navy ring-gold2'
          : 'bg-linear-to-br from-navy2 to-navy text-gold2 ring-gold2/60'
      }`}
    >
      {initials(name)}
    </span>
  );
}
