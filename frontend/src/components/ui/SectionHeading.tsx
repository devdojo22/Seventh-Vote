interface SectionHeadingProps {
  title: string;
  note?: string;
}

export function SectionHeading({ title, note }: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-1 pt-2 sm:flex-row sm:items-end">
      <h2 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        {title}
      </h2>
      {note && <span className="text-xs font-medium text-muted">{note}</span>}
    </div>
  );
}
