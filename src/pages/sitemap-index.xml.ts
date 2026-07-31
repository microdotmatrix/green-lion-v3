import type { APIRoute } from "astro";
import { publicCacheHeaders, SITEMAP_CACHE } from "@/lib/http/cache";
import {
  buildSitemapIndexXml,
  formatSitemapDate,
  toAbsoluteUrl,
} from "@/lib/seo/sitemap";

export const GET: APIRoute = ({ request, site }) => {
  const siteUrl = site ?? new URL("/", request.url);
  const entries = [
    {
      loc: toAbsoluteUrl(siteUrl, "/sitemap-0.xml"),
      lastmod: formatSitemapDate(new Date()),
    },
  ];

  return new Response(buildSitemapIndexXml(entries), {
    headers: publicCacheHeaders("application/xml; charset=utf-8", SITEMAP_CACHE),
  });
};
