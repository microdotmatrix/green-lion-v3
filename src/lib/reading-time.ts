/**
 * Compute estimated reading time from an HTML string.
 * Strips all HTML tags, counts words, divides by 200 wpm.
 * Returns "N min read" (minimum 1 min).
 */
export function readingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
