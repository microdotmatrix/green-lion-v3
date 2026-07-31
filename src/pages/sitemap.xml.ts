import type { APIRoute } from "astro";
import { publicCacheHeaders, SITEMAP_CACHE } from "@/lib/http/cache";
import { buildUrlSetXml, getPublicSitemapEntries } from "@/lib/seo/sitemap";

export const GET: APIRoute = async ({ request, site }) => {
  const siteUrl = site ?? new URL("/", request.url);
  const entries = await getPublicSitemapEntries(siteUrl);

  return new Response(buildUrlSetXml(entries), {
    headers: publicCacheHeaders("application/xml; charset=utf-8", SITEMAP_CACHE),
  });
};
