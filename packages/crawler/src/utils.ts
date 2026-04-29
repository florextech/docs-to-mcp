const IGNORED_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|tar|gz|mp4|mp3|wav|woff2?|ttf|eot|css|js)$/i;

export function normalizeUrl(raw: string): string {
  const url = new URL(raw);
  url.hash = '';
  url.search = '';
  return url.href.replace(/\/+$/, '');
}

export function isSameOrigin(base: string, target: string): boolean {
  try {
    return new URL(base).origin === new URL(target).origin;
  } catch {
    return false;
  }
}

export function shouldFollow(base: string, href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return false;
  }
  try {
    const resolved = new URL(href, base);
    if (IGNORED_EXTENSIONS.test(resolved.pathname)) return false;
    return isSameOrigin(base, resolved.href);
  } catch {
    return false;
  }
}
