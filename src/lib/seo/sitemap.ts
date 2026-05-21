import { db } from "@/lib/db";
import {
  blogCategories,
  blogPosts,
  categories,
  products,
} from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

const STATIC_PATHS = [
  "/",
  "/about",
  "/products",
  "/catalog",
  "/services",
  "/blog",
  "/contact",
  "/quote",
];

export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatSitemapDate(value: Date | string | null | undefined) {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function toAbsoluteUrl(site: URL, pathname: string) {
  return new URL(pathname, site).href;
}

export function buildUrlSetXml(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `<lastmod>${entry.lastmod}</lastmod>`
        : "";

      return `<url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
  );
}

export function buildSitemapIndexXml(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `<lastmod>${entry.lastmod}</lastmod>`
        : "";

      return `<sitemap><loc>${xmlEscape(entry.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
  );
}

export async function getPublicSitemapEntries(
  site: URL,
): Promise<SitemapEntry[]> {
  const staticEntries = STATIC_PATHS.map((pathname) => ({
    loc: toAbsoluteUrl(site, pathname),
  }));

  const categoryRows = await db
    .select({
      name: categories.name,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .orderBy(categories.displayOrder, categories.name);

  const productRows = await db
    .select({
      sku: products.sku,
      updatedAt: products.updatedAt,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(isNotNull(products.categoryId))
    .orderBy(categories.name, products.name);

  const blogPostRows = await db
    .select({
      slug: blogPosts.slug,
      updatedAt: blogPosts.updatedAt,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(
      and(eq(blogPosts.status, "published"), isNotNull(blogPosts.publishedAt)),
    )
    .orderBy(blogPosts.publishedAt);

  const blogCategoryRows = await db
    .selectDistinct({
      slug: blogCategories.slug,
      createdAt: blogCategories.createdAt,
    })
    .from(blogCategories)
    .innerJoin(
      blogPosts,
      and(
        eq(blogPosts.categoryId, blogCategories.id),
        eq(blogPosts.status, "published"),
      ),
    )
    .orderBy(blogCategories.slug);

  const categoryEntries = categoryRows.map((category) => ({
    loc: toAbsoluteUrl(site, `/products/${slugifySegment(category.name)}`),
    lastmod: formatSitemapDate(category.createdAt),
  }));

  const productEntries = productRows.map((product) => ({
    loc: toAbsoluteUrl(
      site,
      `/products/${slugifySegment(product.categoryName)}/${product.sku.toLowerCase()}`,
    ),
    lastmod: formatSitemapDate(product.updatedAt),
  }));

  const blogEntries = blogPostRows.map((post) => ({
    loc: toAbsoluteUrl(site, `/blog/${post.slug}`),
    lastmod: formatSitemapDate(post.publishedAt ?? post.updatedAt),
  }));

  const blogCategoryEntries = blogCategoryRows.map((category) => ({
    loc: toAbsoluteUrl(site, `/blog/category/${category.slug}`),
    lastmod: formatSitemapDate(category.createdAt),
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries,
    ...blogCategoryEntries,
  ];
}
