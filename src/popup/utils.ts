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

export type Bucket =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "This Month"
  | "Older";

export function bucketLabel(timestamp: number): Bucket {
  const now = new Date();
  const date = new Date(timestamp);

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";

  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(
    startOfToday.getTime() - mondayOffset * 86400000,
  );
  if (date >= startOfWeek) return "This Week";

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (date >= startOfMonth) return "This Month";

  return "Older";
}

export function groupByBucket<T extends { timestamp: number }>(
  items: T[],
): { bucket: Bucket; items: T[] }[] {
  const order: Bucket[] = [
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Older",
  ];
  const groups = new Map<Bucket, T[]>();

  for (const item of items) {
    const bucket = bucketLabel(item.timestamp);
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket)!.push(item);
  }

  return order
    .filter((b) => groups.has(b))
    .map((b) => ({ bucket: b, items: groups.get(b)! }));
}
