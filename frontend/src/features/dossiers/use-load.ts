import { useCallback, useEffect, useState } from 'react';
import { describeDossierError } from './dossier-errors';

export type Loaded<T> =
  { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: T };

const LOADING = { state: 'loading' } as const;

const MIN_LOADING_MS = 500;


export function useLoad<T>(fetcher: () => Promise<T>): { loaded: Loaded<T>; reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    fetcher: () => Promise<T>;
    attempt: number;
    loaded: Loaded<T>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const startedAt = Date.now();
    const settle = (loaded: Loaded<T>) => {
      const remaining = Math.max(MIN_LOADING_MS - (Date.now() - startedAt), 0);
      timer = window.setTimeout(() => {
        if (active) setResult({ fetcher, attempt, loaded });
      }, remaining);
    };
    fetcher().then(
      (data) => settle({ state: 'ready', data }),
      (error: unknown) => settle({ state: 'error', message: describeDossierError(error) }),
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fetcher, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  const sameRequest = result !== null && result.fetcher === fetcher;
  const loaded =
    sameRequest && (result.attempt === attempt || result.loaded.state === 'ready')
      ? result.loaded
      : LOADING;
  return { loaded, reload };
}
