import { SEO_SETTINGS_ROW_ID } from "@/lib/db/schema";
import type { SeoSettings } from "@/lib/db/schema";

export type SeoSettingsResponse =
  | SeoSettings
  | { id: typeof SEO_SETTINGS_ROW_ID };

export async function fetchSeoSettings(): Promise<SeoSettingsResponse> {
  const response = await fetch("/api/admin/seo-settings");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load SEO settings",
    );
  }
  return response.json() as Promise<SeoSettingsResponse>;
}

export type SeoSettingsPutBody = {
  defaultTitle: string | null;
  titleTemplate: string | null;
  defaultDescription: string | null;
  defaultKeywords: string | null;
  defaultOgImageUrl: string | null;
  twitterCard: string | null;
  twitterSite: string | null;
  twitterCreator: string | null;
  facebookAppId: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalBaseUrl: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  organizationName: string | null;
  organizationUrl: string | null;
  organizationLogoUrl: string | null;
  sameAs: string[] | null;
};

export async function putSeoSettings(
  data: SeoSettingsPutBody,
): Promise<SeoSettings> {
  const response = await fetch("/api/admin/seo-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg =
      (err as { error?: string; details?: unknown }).error ||
      "Failed to save SEO settings";
    throw new Error(msg);
  }
  return response.json() as Promise<SeoSettings>;
}
