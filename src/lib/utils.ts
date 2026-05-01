export function formatUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.length > 30 ? pathname.slice(0, 30) + "…" : pathname;
    return hostname + path;
  } catch {
    return url;
  }
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
