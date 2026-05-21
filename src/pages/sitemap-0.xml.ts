import type { APIRoute } from "astro";
import { buildUrlSetXml, getPublicSitemapEntries } from "@/lib/seo/sitemap";

export const GET: APIRoute = async ({ request, site }) => {
  const siteUrl = site ?? new URL("/", request.url);
  const entries = await getPublicSitemapEntries(siteUrl);

  return new Response(buildUrlSetXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
};
