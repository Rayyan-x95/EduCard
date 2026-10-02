const dateCache = new Map<string, string>();

/**
 * Fast, cached date formatter for ISO timestamps to avoid expensive
 * toLocaleDateString calculations during list rendering.
 */
export function formatDate(
  isoDateString?: string | null,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
  if (!isoDateString) return "";

  const cacheKey = `${isoDateString}_${options.month || ""}_${options.day || ""}_${options.year || ""}`;
  const cached = dateCache.get(cacheKey);
  if (cached) return cached;

  try {
    const formatted = new Date(isoDateString).toLocaleDateString(undefined, options);
    // Keep cache bounded to 500 entries
    if (dateCache.size > 500) {
      const firstKey = dateCache.keys().next().value;
      if (firstKey) dateCache.delete(firstKey);
    }
    dateCache.set(cacheKey, formatted);
    return formatted;
  } catch {
    return "";
  }
}
