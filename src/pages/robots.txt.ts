import type { APIRoute } from "astro";
import { publicCacheHeaders, SITEMAP_CACHE } from "@/lib/http/cache";

const getRobotsTxt = (sitemapUrl: URL) => `User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /signin
Disallow: /signup

Sitemap: ${sitemapUrl.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap-index.xml", site);

  return new Response(getRobotsTxt(sitemapUrl), {
    headers: publicCacheHeaders("text/plain; charset=utf-8", SITEMAP_CACHE),
  });
};
