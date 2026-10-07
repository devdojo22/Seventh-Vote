/** True for absolute http(s) URLs only — the app never renders other hrefs. */
export function isHttpUrl(url: string | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}
