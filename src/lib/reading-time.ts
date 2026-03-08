/**
 * Compute estimated reading time from an HTML string.
 * Strips all HTML tags, counts words, divides by 200 wpm.
 */
export function readingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatReadingTime(minutes: number | null | undefined): string {
  return `${Math.max(1, minutes ?? 1)} min read`;
}

export function readingTime(html: string): string {
  return formatReadingTime(readingTimeMinutes(html));
}
