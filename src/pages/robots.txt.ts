import type { APIRoute } from "astro";

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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
