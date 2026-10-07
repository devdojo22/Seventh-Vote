export function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col items-start justify-between gap-1 border-b border-line pt-4 pb-2 sm:flex-row sm:items-center">
      <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">{title}</h2>
      <span className="font-sans text-xs tracking-wider text-navy/60 uppercase">{note}</span>
    </div>
  );
}
