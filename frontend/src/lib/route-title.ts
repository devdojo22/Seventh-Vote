import { useMatches } from 'react-router';

export interface RouteHandle {
  title: string;
}

function hasTitle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'title' in handle &&
    typeof handle.title === 'string'
  );
}

export function useRouteTitle(): string | undefined {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const handle = matches[i]?.handle;
    if (hasTitle(handle)) return handle.title;
  }
  return undefined;
}
