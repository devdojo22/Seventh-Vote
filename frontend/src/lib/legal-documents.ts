/**
 * Addresses of the legal documents users accept at registration, from the build-time environment
 * (VITE_TERMS_OF_SERVICE_URL, VITE_PRIVACY_POLICY_URL). Only absolute https URLs are used (plain http is
 * tolerated in development); anything missing or malformed yields null, and the page shows the
 * document name without a link rather than a guessed address.
 */
function documentUrl(name: string, value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || (import.meta.env.DEV && url.protocol === 'http:'))
      return url.href;
  } catch {
    // Not a URL; reported below.
  }
  if (import.meta.env.DEV) console.warn(`${name} is not a valid https URL; the link is not shown.`);
  return null;
}

export const TERMS_OF_SERVICE_URL = documentUrl(
  'VITE_TERMS_OF_SERVICE_URL',
  import.meta.env.VITE_TERMS_OF_SERVICE_URL,
);
export const PRIVACY_POLICY_URL = documentUrl(
  'VITE_PRIVACY_POLICY_URL',
  import.meta.env.VITE_PRIVACY_POLICY_URL,
);
