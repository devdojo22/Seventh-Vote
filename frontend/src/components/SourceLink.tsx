import { isHttpUrl } from '@/lib/url';

interface SourceLinkProps {
  name?: string;
  url?: string;
  label?: string;
}

/** Citation link. Only absolute http(s) URLs become anchors; anything else is plain text. */
export function SourceLink({ name, url, label }: SourceLinkProps) {
  const text = label || name;
  if (isHttpUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#245f87] underline underline-offset-[3px] transition-colors hover:text-[#153e5b] wrap-break-word"
      >
        {text}
      </a>
    );
  }
  return <span className="wrap-break-word">{text || 'No source link'}</span>;
}
