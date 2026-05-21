import type { APIRoute } from "astro";
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
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
};
