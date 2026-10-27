
function documentUrl(name: string, value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || (import.meta.env.DEV && url.protocol === 'http:'))
      return url.href;
  } catch {
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
