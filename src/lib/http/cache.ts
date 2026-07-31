/**
 * CDN cache helpers for server-rendered responses on Netlify.
 *
 * Netlify strips `Netlify-CDN-Cache-Control` before the response reaches the
 * browser, so browsers always revalidate while Netlify's edge + durable cache
 * absorb repeat traffic (crawlers included) without invoking the function —
 * and therefore without waking the Neon database.
 */

const PAGE_TTL_SECONDS = 300;
const PAGE_SWR_SECONDS = 86_400;

/**
 * Sitemaps only need to be roughly fresh for crawlers. A long TTL keeps
 * scheduled crawler refetches from waking the database every hour.
 */
export const SITEMAP_CACHE = {
  ttl: 21_600,
  staleWhileRevalidate: 86_400,
} as const;

export interface PublicCacheOptions {
  /** Seconds the CDN serves the response without revalidating. */
  ttl?: number;
  /**
   * Seconds the CDN may keep serving the stale response while it
   * revalidates in the background (ISR-equivalent behaviour).
   */
  staleWhileRevalidate?: number;
}

export function setPublicPageCache(
  headers: Headers,
  {
    ttl = PAGE_TTL_SECONDS,
    staleWhileRevalidate = PAGE_SWR_SECONDS,
  }: PublicCacheOptions = {},
): void {
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  headers.set(
    "Netlify-CDN-Cache-Control",
    `public, durable, s-maxage=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
}

/** Header bag for `new Response(...)` call sites (sitemaps, feeds). */
export function publicCacheHeaders(
  contentType: string,
  options: PublicCacheOptions = {},
): Headers {
  const headers = new Headers({ "Content-Type": contentType });
  setPublicPageCache(headers, options);
  return headers;
}
