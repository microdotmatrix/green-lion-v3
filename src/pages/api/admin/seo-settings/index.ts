import { getSeoSettingsRow } from "@/lib/seo/global-seo";
import { db } from "@/lib/db";
import {
  SEO_SETTINGS_ROW_ID,
  seoSettings,
  type SeoSettings,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { z } from "zod";

const emptyToNull = (s: string | null | undefined) => {
  if (s === undefined) return undefined;
  const t = s?.trim();
  return t === "" || t === undefined ? null : t;
};

const optionalUrl = z
  .union([z.string().url().max(2000), z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === "" || v === null) return null;
    return v;
  });

const sameAsList = z
  .array(z.string().min(1).max(2000))
  .max(30)
  .optional()
  .nullable()
  .transform((arr) => {
    if (arr == null) return arr;
    const u = arr.map((s) => s.trim()).filter(Boolean);
    return u.length ? u : null;
  });

const putBodySchema = z
  .object({
    defaultTitle: z.string().max(200).optional().nullable(),
    titleTemplate: z.string().max(500).optional().nullable(),
    defaultDescription: z.string().max(2000).optional().nullable(),
    defaultKeywords: z.string().max(2000).optional().nullable(),
    defaultOgImageUrl: z.string().max(2000).optional().nullable(),
    twitterCard: z
      .string()
      .max(32)
      .optional()
      .nullable()
      .refine(
        (v) =>
          v == null ||
          v === "" ||
          ["summary", "summary_large_image", "app", "player"].includes(v),
        { message: "Invalid twitter:card" },
      ),
    twitterSite: z.string().max(64).optional().nullable(),
    twitterCreator: z.string().max(64).optional().nullable(),
    facebookAppId: z.string().max(32).optional().nullable(),
    robotsIndex: z.boolean().optional(),
    robotsFollow: z.boolean().optional(),
    canonicalBaseUrl: optionalUrl,
    googleSiteVerification: z.string().max(200).optional().nullable(),
    bingSiteVerification: z.string().max(200).optional().nullable(),
    organizationName: z.string().max(200).optional().nullable(),
    organizationUrl: optionalUrl,
    organizationLogoUrl: optionalUrl,
    sameAs: sameAsList,
  })
  .strict();

type PutIn = z.infer<typeof putBodySchema>;

const normalize = (b: PutIn) => ({
  defaultTitle: emptyToNull(b.defaultTitle as string | null | undefined),
  titleTemplate: emptyToNull(b.titleTemplate as string | null | undefined),
  defaultDescription: emptyToNull(
    b.defaultDescription as string | null | undefined,
  ),
  defaultKeywords: emptyToNull(b.defaultKeywords as string | null | undefined),
  defaultOgImageUrl: emptyToNull(
    b.defaultOgImageUrl as string | null | undefined,
  ),
  twitterCard: emptyToNull(b.twitterCard as string | null | undefined),
  twitterSite: emptyToNull(b.twitterSite as string | null | undefined),
  twitterCreator: emptyToNull(b.twitterCreator as string | null | undefined),
  facebookAppId: emptyToNull(b.facebookAppId as string | null | undefined),
  robotsIndex: b.robotsIndex,
  robotsFollow: b.robotsFollow,
  canonicalBaseUrl: b.canonicalBaseUrl,
  googleSiteVerification: emptyToNull(
    b.googleSiteVerification as string | null | undefined,
  ),
  bingSiteVerification: emptyToNull(
    b.bingSiteVerification as string | null | undefined,
  ),
  organizationName: emptyToNull(
    b.organizationName as string | null | undefined,
  ),
  organizationUrl: b.organizationUrl,
  organizationLogoUrl: b.organizationLogoUrl,
  sameAs: b.sameAs,
});

const mergeForUpdate = (
  existing: SeoSettings,
  n: ReturnType<typeof normalize>,
): Omit<SeoSettings, "createdAt" | "updatedAt"> & { updatedAt: Date } => ({
  id: existing.id,
  defaultTitle:
    n.defaultTitle !== undefined ? n.defaultTitle : existing.defaultTitle,
  titleTemplate:
    n.titleTemplate !== undefined ? n.titleTemplate : existing.titleTemplate,
  defaultDescription:
    n.defaultDescription !== undefined
      ? n.defaultDescription
      : existing.defaultDescription,
  defaultKeywords:
    n.defaultKeywords !== undefined
      ? n.defaultKeywords
      : existing.defaultKeywords,
  defaultOgImageUrl:
    n.defaultOgImageUrl !== undefined
      ? n.defaultOgImageUrl
      : existing.defaultOgImageUrl,
  twitterCard:
    n.twitterCard !== undefined ? n.twitterCard : existing.twitterCard,
  twitterSite:
    n.twitterSite !== undefined ? n.twitterSite : existing.twitterSite,
  twitterCreator:
    n.twitterCreator !== undefined ? n.twitterCreator : existing.twitterCreator,
  facebookAppId:
    n.facebookAppId !== undefined ? n.facebookAppId : existing.facebookAppId,
  robotsIndex:
    n.robotsIndex !== undefined ? n.robotsIndex : existing.robotsIndex,
  robotsFollow:
    n.robotsFollow !== undefined ? n.robotsFollow : existing.robotsFollow,
  canonicalBaseUrl:
    n.canonicalBaseUrl !== undefined
      ? n.canonicalBaseUrl
      : existing.canonicalBaseUrl,
  googleSiteVerification:
    n.googleSiteVerification !== undefined
      ? n.googleSiteVerification
      : existing.googleSiteVerification,
  bingSiteVerification:
    n.bingSiteVerification !== undefined
      ? n.bingSiteVerification
      : existing.bingSiteVerification,
  organizationName:
    n.organizationName !== undefined
      ? n.organizationName
      : existing.organizationName,
  organizationUrl:
    n.organizationUrl !== undefined
      ? n.organizationUrl
      : existing.organizationUrl,
  organizationLogoUrl:
    n.organizationLogoUrl !== undefined
      ? n.organizationLogoUrl
      : existing.organizationLogoUrl,
  sameAs: n.sameAs !== undefined ? n.sameAs : existing.sameAs,
  updatedAt: new Date(),
});

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const row = await getSeoSettingsRow();
    return new Response(
      JSON.stringify(
        row ?? {
          id: SEO_SETTINGS_ROW_ID,
        },
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch SEO settings" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid data",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const n = normalize(parsed.data);

  try {
    const existing = await getSeoSettingsRow();

    if (!existing) {
      const [inserted] = await db
        .insert(seoSettings)
        .values({
          id: SEO_SETTINGS_ROW_ID,
          defaultTitle: n.defaultTitle ?? null,
          titleTemplate: n.titleTemplate ?? null,
          defaultDescription: n.defaultDescription ?? null,
          defaultKeywords: n.defaultKeywords ?? null,
          defaultOgImageUrl: n.defaultOgImageUrl ?? null,
          twitterCard: n.twitterCard ?? null,
          twitterSite: n.twitterSite ?? null,
          twitterCreator: n.twitterCreator ?? null,
          facebookAppId: n.facebookAppId ?? null,
          robotsIndex: n.robotsIndex ?? true,
          robotsFollow: n.robotsFollow ?? true,
          canonicalBaseUrl: n.canonicalBaseUrl ?? null,
          googleSiteVerification: n.googleSiteVerification ?? null,
          bingSiteVerification: n.bingSiteVerification ?? null,
          organizationName: n.organizationName ?? null,
          organizationUrl: n.organizationUrl ?? null,
          organizationLogoUrl: n.organizationLogoUrl ?? null,
          sameAs: n.sameAs ?? null,
        })
        .returning();
      return new Response(JSON.stringify(inserted), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    const merged = mergeForUpdate(existing, n);
    const [updated] = await db
      .update(seoSettings)
      .set({
        defaultTitle: merged.defaultTitle,
        titleTemplate: merged.titleTemplate,
        defaultDescription: merged.defaultDescription,
        defaultKeywords: merged.defaultKeywords,
        defaultOgImageUrl: merged.defaultOgImageUrl,
        twitterCard: merged.twitterCard,
        twitterSite: merged.twitterSite,
        twitterCreator: merged.twitterCreator,
        facebookAppId: merged.facebookAppId,
        robotsIndex: merged.robotsIndex,
        robotsFollow: merged.robotsFollow,
        canonicalBaseUrl: merged.canonicalBaseUrl,
        googleSiteVerification: merged.googleSiteVerification,
        bingSiteVerification: merged.bingSiteVerification,
        organizationName: merged.organizationName,
        organizationUrl: merged.organizationUrl,
        organizationLogoUrl: merged.organizationLogoUrl,
        sameAs: merged.sameAs,
        updatedAt: merged.updatedAt,
      })
      .where(eq(seoSettings.id, SEO_SETTINGS_ROW_ID))
      .returning();
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving SEO settings:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save SEO settings" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
