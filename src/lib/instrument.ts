export function trackPageView(path: string) {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!endpoint || typeof window === 'undefined') return;

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'page_view', path }),
    keepalive: true,
  }).catch(() => undefined);
}
