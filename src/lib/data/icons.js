const CODE_HOSTS = ['github.com', 'gitlab.com', 'codeberg.org'];

/** Where a service's icon can come from, best first: the list's own, then its site's favicon */
export function iconSources({ icon, url }) {
  const host = URL.canParse(url ?? '') && new URL(url).hostname.replace(/^www\./, '');
  const favicon = host && !CODE_HOSTS.includes(host) && `https://icon.horse/icon/${host}`;
  return [URL.canParse(icon ?? '') && icon, favicon].filter(Boolean);
}
