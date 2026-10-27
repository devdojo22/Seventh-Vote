import dots from '@/assets/brand/seventh-vote-dots.png';

export function BrandLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <img src={dots} alt="" width={503} height={65} className="h-3 w-auto shrink-0" />
      <span className="font-display text-[17px] font-bold tracking-tight">Seventh Vote</span>
    </span>
  );
}
