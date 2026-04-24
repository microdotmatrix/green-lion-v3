import { SITE } from "@/lib/config";
import { db } from "@/lib/db";
import {
  SEO_SETTINGS_ROW_ID,
  seoSettings,
  type SeoSettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_TITLE_TEMPLATE = "{{title}} | {{site}}";
const DEFAULT_TWITTER_CARD = "summary_large_image";

/**
 * Merged global SEO with safe fallbacks to `SITE` when the DB has no row or null fields.
 * Per-page values still override in layouts via `meta.astro` props.
 */
export type EffectiveGlobalSeo = {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  /** Comma-separated keywords for <meta name="keywords">; may be empty */
  defaultKeywords: string;
  defaultOgImage: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  facebookAppId: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalBaseUrl: string | null;
  googleSiteVerification: string;
  bingSiteVerification: string;
  organizationName: string;
  organizationUrl: string;
  organizationLogoUrl: string;
  sameAs: string[];
  author: string;
  profile: string;
};

const normalizeSameAs = (s: string[] | null | undefined) =>
  (s ?? []).map((u) => u.trim()).filter(Boolean);

export function effectiveGlobalSeoFromRow(
  row: SeoSettings | null,
): EffectiveGlobalSeo {
  return {
    defaultTitle: row?.defaultTitle?.trim() || SITE.title,
    titleTemplate: row?.titleTemplate?.trim() || DEFAULT_TITLE_TEMPLATE,
    defaultDescription: row?.defaultDescription?.trim() || SITE.desc,
    defaultKeywords: (row?.defaultKeywords ?? "").trim(),
    defaultOgImage: (() => {
      const fromDb = row?.defaultOgImageUrl?.trim();
      if (fromDb) return fromDb;
      return SITE.ogImage ?? "og.png";
    })(),
    twitterCard: (row?.twitterCard ?? "").trim() || DEFAULT_TWITTER_CARD,
    twitterSite: (row?.twitterSite ?? "").trim(),
    twitterCreator: (row?.twitterCreator ?? "").trim(),
    facebookAppId: (row?.facebookAppId ?? "").trim(),
    robotsIndex: row?.robotsIndex ?? true,
    robotsFollow: row?.robotsFollow ?? true,
    canonicalBaseUrl: row?.canonicalBaseUrl?.trim() || null,
    googleSiteVerification: (row?.googleSiteVerification ?? "").trim(),
    bingSiteVerification: (row?.bingSiteVerification ?? "").trim(),
    organizationName: (row?.organizationName ?? "").trim(),
    organizationUrl: (row?.organizationUrl ?? "").trim(),
    organizationLogoUrl: (row?.organizationLogoUrl ?? "").trim(),
    sameAs: normalizeSameAs(row?.sameAs ?? null),
    author: SITE.author,
    profile: SITE.profile,
  };
}

export async function getSeoSettingsRow(): Promise<SeoSettings | null> {
  const [r] = await db
    .select()
    .from(seoSettings)
    .where(eq(seoSettings.id, SEO_SETTINGS_ROW_ID))
    .limit(1);
  return r ?? null;
}

export async function getEffectiveGlobalSeo(): Promise<EffectiveGlobalSeo> {
  const row = await getSeoSettingsRow();
  return effectiveGlobalSeoFromRow(row);
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Replaces `{{title}}` and `{{site}}` in a template. Unknown tokens are left as-is.
 */
export function applyTitleTemplate(
  template: string,
  pageTitle: string,
  siteName: string,
): string {
  let t = template;
  t = t.replace(new RegExp(escapeRegExp("{{title}}"), "g"), pageTitle);
  t = t.replace(new RegExp(escapeRegExp("{{site}}"), "g"), siteName);
  return t;
}

export function buildDocumentTitle(
  pageTitle: string,
  effective: Pick<EffectiveGlobalSeo, "defaultTitle" | "titleTemplate">,
): string {
  return applyTitleTemplate(
    effective.titleTemplate,
    pageTitle,
    effective.defaultTitle,
  );
}

/**
 * Resolves a relative path or absolute URL to a full href for og:image and twitter:image.
 */
export function resolveSocialImageHref(
  pageOgImage: string | undefined,
  siteOrigin: string,
  siteFromConfig: string | undefined,
  effective: Pick<EffectiveGlobalSeo, "defaultOgImage">,
): string {
  const raw =
    (pageOgImage?.trim() || effective.defaultOgImage).trim() || "og.png";
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).href;
    } catch {
      // fall through
    }
  }
  const base = (siteFromConfig && tryUrl(siteFromConfig)) || siteOrigin;
  return new URL(raw, base).href;
}

function tryUrl(s: string): string {
  try {
    return new URL(s).origin;
  } catch {
    return s;
  }
}

/**
 * Canonical URL for the current request path, optionally with a custom site origin.
 */
export function buildCanonicalForRequest(options: {
  pathname: string;
  site: string | undefined;
  requestOrigin: string;
  canonicalBaseUrl: string | null;
}): URL {
  const base = options.canonicalBaseUrl?.trim();
  if (base) {
    try {
      const o = new URL(base.endsWith("/") ? base : `${base}/`);
      return new URL(options.pathname || "/", o);
    } catch {
      // fall back
    }
  }
  const s =
    (options.site && tryUrlForOrigin(options.site)) || options.requestOrigin;
  return new URL(options.pathname || "/", s);
}

function tryUrlForOrigin(s: string): string {
  try {
    return new URL(s).origin;
  } catch {
    return s;
  }
}

export function formatRobotsMetaContent(
  robotsIndex: boolean,
  robotsFollow: boolean,
): string {
  const a = robotsIndex ? "index" : "noindex";
  const b = robotsFollow ? "follow" : "nofollow";
  return `${a}, ${b}`;
}

export type PageJsonLdOptions = {
  documentTitle: string;
  pageDescription: string;
  imageHref: string;
  effective: EffectiveGlobalSeo;
};

export function buildPageJsonLd(options: PageJsonLdOptions): object {
  const { documentTitle, pageDescription, imageHref, effective } = options;

  if (effective.organizationName) {
    const org: Record<string, unknown> = {
      "@type": "Organization",
      name: effective.organizationName,
    };
    if (effective.organizationUrl) {
      try {
        org.url = new URL(effective.organizationUrl).href;
      } catch {
        org.url = effective.organizationUrl;
      }
    }
    if (effective.organizationLogoUrl) {
      try {
        org.logo = new URL(effective.organizationLogoUrl).href;
      } catch {
        org.logo = effective.organizationLogoUrl;
      }
    }
    if (effective.sameAs.length) {
      org.sameAs = effective.sameAs
        .map((u) => {
          try {
            return new URL(u).href;
          } catch {
            return u;
          }
        })
        .filter(Boolean);
    }
    return {
      "@context": "https://schema.org",
      "@graph": [
        org,
        {
          "@type": "WebPage",
          name: documentTitle,
          description: pageDescription,
          image: imageHref,
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: documentTitle,
    description: pageDescription,
    image: imageHref,
    author: {
      "@type": "Person",
      name: effective.author,
      url: effective.profile,
    },
  };
}

export function buildAdminPageTitle(
  areaTitle: string,
  effective: Pick<EffectiveGlobalSeo, "defaultTitle">,
): string {
  return `${areaTitle} | Admin | ${effective.defaultTitle}`;
}
