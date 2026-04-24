import { SITE } from "@/lib/config";
import type { SeoSettings } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { useSeoSettings, useSeoSettingsSave } from "./seo-hooks";
import type { SeoSettingsResponse, SeoSettingsPutBody } from "./seo-api";

const TWITTER_CARDS = [
  { value: "summary", label: "summary" },
  { value: "summary_large_image", label: "summary_large_image" },
  { value: "app", label: "app" },
  { value: "player", label: "player" },
] as const;

type FormState = {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string;
  defaultOgImageUrl: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  facebookAppId: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalBaseUrl: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  organizationName: string;
  organizationUrl: string;
  organizationLogoUrl: string;
  sameAsText: string;
};

const defaultForm = (): FormState => ({
  defaultTitle: SITE.title,
  titleTemplate: "{{title}} | {{site}}",
  defaultDescription: SITE.desc,
  defaultKeywords: "",
  defaultOgImageUrl: SITE.ogImage ?? "",
  twitterCard: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
  facebookAppId: "",
  robotsIndex: true,
  robotsFollow: true,
  canonicalBaseUrl: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  organizationName: "",
  organizationUrl: "",
  organizationLogoUrl: "",
  sameAsText: "",
});

const isSeoRow = (d: SeoSettingsResponse): d is SeoSettings =>
  "createdAt" in d && d.createdAt != null;

const rowToForm = (d: SeoSettingsResponse): FormState => {
  const base = defaultForm();
  if (!isSeoRow(d)) return base;
  return {
    defaultTitle: d.defaultTitle ?? base.defaultTitle,
    titleTemplate: d.titleTemplate ?? base.titleTemplate,
    defaultDescription: d.defaultDescription ?? base.defaultDescription,
    defaultKeywords: d.defaultKeywords ?? base.defaultKeywords,
    defaultOgImageUrl: d.defaultOgImageUrl ?? base.defaultOgImageUrl,
    twitterCard: d.twitterCard ?? base.twitterCard,
    twitterSite: d.twitterSite ?? base.twitterSite,
    twitterCreator: d.twitterCreator ?? base.twitterCreator,
    facebookAppId: d.facebookAppId ?? base.facebookAppId,
    robotsIndex: d.robotsIndex,
    robotsFollow: d.robotsFollow,
    canonicalBaseUrl: d.canonicalBaseUrl ?? base.canonicalBaseUrl,
    googleSiteVerification:
      d.googleSiteVerification ?? base.googleSiteVerification,
    bingSiteVerification: d.bingSiteVerification ?? base.bingSiteVerification,
    organizationName: d.organizationName ?? base.organizationName,
    organizationUrl: d.organizationUrl ?? base.organizationUrl,
    organizationLogoUrl: d.organizationLogoUrl ?? base.organizationLogoUrl,
    sameAsText: (d.sameAs ?? []).join("\n"),
  };
};

const formToPut = (f: FormState): SeoSettingsPutBody => ({
  defaultTitle: f.defaultTitle.trim() || null,
  titleTemplate: f.titleTemplate.trim() || null,
  defaultDescription: f.defaultDescription.trim() || null,
  defaultKeywords: f.defaultKeywords.trim() || null,
  defaultOgImageUrl: f.defaultOgImageUrl.trim() || null,
  twitterCard: f.twitterCard.trim() || null,
  twitterSite: f.twitterSite.trim() || null,
  twitterCreator: f.twitterCreator.trim() || null,
  facebookAppId: f.facebookAppId.trim() || null,
  robotsIndex: f.robotsIndex,
  robotsFollow: f.robotsFollow,
  canonicalBaseUrl: f.canonicalBaseUrl.trim() || null,
  googleSiteVerification: f.googleSiteVerification.trim() || null,
  bingSiteVerification: f.bingSiteVerification.trim() || null,
  organizationName: f.organizationName.trim() || null,
  organizationUrl: f.organizationUrl.trim() || null,
  organizationLogoUrl: f.organizationLogoUrl.trim() || null,
  sameAs: (() => {
    const urls = f.sameAsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return urls.length ? urls : null;
  })(),
});

const SeoForm = () => {
  const { data, isLoading, error, isFetching } = useSeoSettings();
  const save = useSeoSettingsSave();
  const [form, setForm] = React.useState<FormState>(defaultForm);

  React.useEffect(() => {
    if (data) {
      setForm(rowToForm(data));
    }
  }, [data]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(formToPut(form), {
      onSuccess: () => toast.success("Global SEO settings saved"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Save failed"),
    });
  };

  const isBusy = isLoading || (isFetching && !data) || save.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">
            Failed to load settings.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Core</CardTitle>
          <CardDescription>
            Default page title, description, keywords, and the title template.
            Use
            <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5 text-xs">
              {"{{title}}"}
            </code>
            and
            <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5 text-xs">
              {"{{site}}"}
            </code>{" "}
            in the template.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="defaultTitle">
              Default site name (brand title)
            </Label>
            <Input
              id="defaultTitle"
              value={form.defaultTitle}
              onChange={(e) =>
                setForm((s) => ({ ...s, defaultTitle: e.target.value }))
              }
              name="defaultTitle"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titleTemplate">Title template</Label>
            <Input
              id="titleTemplate"
              value={form.titleTemplate}
              onChange={(e) =>
                setForm((s) => ({ ...s, titleTemplate: e.target.value }))
              }
              name="titleTemplate"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultDescription">Default description</Label>
            <Textarea
              id="defaultDescription"
              name="defaultDescription"
              className="min-h-[88px]"
              value={form.defaultDescription}
              onChange={(e) =>
                setForm((s) => ({ ...s, defaultDescription: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultKeywords">
              Default keywords (comma-separated)
            </Label>
            <Textarea
              id="defaultKeywords"
              name="defaultKeywords"
              className="min-h-[64px]"
              value={form.defaultKeywords}
              onChange={(e) =>
                setForm((s) => ({ ...s, defaultKeywords: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultOgImageUrl">Default OG / social image</Label>
            <Input
              id="defaultOgImageUrl"
              name="defaultOgImageUrl"
              value={form.defaultOgImageUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, defaultOgImageUrl: e.target.value }))
              }
              autoComplete="off"
              placeholder="/og.png or https://..."
            />
            <p className="text-xs text-muted-foreground" id="og-help">
              Relative to site root or a full https URL
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social</CardTitle>
          <CardDescription>
            Open Graph, Twitter, and Facebook app
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="twitterCard">twitter:card</Label>
            <Select
              value={form.twitterCard}
              onValueChange={(v) => setForm((s) => ({ ...s, twitterCard: v }))}
            >
              <SelectTrigger
                className="w-full"
                id="twitterCard"
                name="twitterCard"
              >
                <SelectValue placeholder="Card type" />
              </SelectTrigger>
              <SelectContent>
                {TWITTER_CARDS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterSite">
              twitter:site (handle, e.g. @company)
            </Label>
            <Input
              id="twitterSite"
              name="twitterSite"
              value={form.twitterSite}
              onChange={(e) =>
                setForm((s) => ({ ...s, twitterSite: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterCreator">twitter:creator (handle)</Label>
            <Input
              id="twitterCreator"
              name="twitterCreator"
              value={form.twitterCreator}
              onChange={(e) =>
                setForm((s) => ({ ...s, twitterCreator: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookAppId">fb:app_id</Label>
            <Input
              id="facebookAppId"
              name="facebookAppId"
              value={form.facebookAppId}
              onChange={(e) =>
                setForm((s) => ({ ...s, facebookAppId: e.target.value }))
              }
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indexing</CardTitle>
          <CardDescription>
            Default robots and canonical base (optional override)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="robotsIndex"
                checked={form.robotsIndex}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, robotsIndex: v === true }))
                }
                name="robotsIndex"
                aria-label="Allow indexing (index vs noindex)"
              />
              <Label htmlFor="robotsIndex" className="cursor-pointer text-sm">
                index (uncheck for noindex)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="robotsFollow"
                checked={form.robotsFollow}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, robotsFollow: v === true }))
                }
                name="robotsFollow"
                aria-label="Allow following links (follow vs nofollow)"
              />
              <Label htmlFor="robotsFollow" className="cursor-pointer text-sm">
                follow (uncheck for nofollow)
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="canonicalBaseUrl">
              Canonical base URL (optional)
            </Label>
            <Input
              id="canonicalBaseUrl"
              name="canonicalBaseUrl"
              value={form.canonicalBaseUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, canonicalBaseUrl: e.target.value }))
              }
              type="url"
              placeholder="https://www.example.com"
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search verification</CardTitle>
          <CardDescription>
            Content values for site ownership meta tags
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="googleSiteVerification">
              google-site-verification
            </Label>
            <Input
              id="googleSiteVerification"
              name="googleSiteVerification"
              value={form.googleSiteVerification}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  googleSiteVerification: e.target.value,
                }))
              }
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bingSiteVerification">msvalidate.01 (Bing)</Label>
            <Input
              id="bingSiteVerification"
              name="bingSiteVerification"
              value={form.bingSiteVerification}
              onChange={(e) =>
                setForm((s) => ({ ...s, bingSiteVerification: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structured data (Organization)</CardTitle>
          <CardDescription>
            When a name is set, JSON-LD will prefer Organization; otherwise a
            generic Web page schema is used.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization name</Label>
            <Input
              id="organizationName"
              name="organizationName"
              value={form.organizationName}
              onChange={(e) =>
                setForm((s) => ({ ...s, organizationName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationUrl">Organization URL</Label>
            <Input
              id="organizationUrl"
              name="organizationUrl"
              value={form.organizationUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, organizationUrl: e.target.value }))
              }
              type="url"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationLogoUrl">Organization logo URL</Label>
            <Input
              id="organizationLogoUrl"
              name="organizationLogoUrl"
              value={form.organizationLogoUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, organizationLogoUrl: e.target.value }))
              }
              type="url"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sameAsText">sameAs (one URL per line)</Label>
            <Textarea
              id="sameAsText"
              name="sameAs"
              className="min-h-[100px] font-mono text-sm"
              value={form.sameAsText}
              onChange={(e) =>
                setForm((s) => ({ ...s, sameAsText: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isBusy}
          aria-disabled={isBusy}
          className="focus-visible:ring-2"
        >
          {save.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          )}
          Save
        </Button>
        {isLoading && (
          <span className="text-sm text-muted-foreground">Loading…</span>
        )}
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Changes apply to the public site on the next request; individual pages
          (blog, etc.) can still override in their layouts later.
        </p>
      </div>
    </form>
  );
};

export const SeoPage = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global SEO</h1>
        <p className="text-muted-foreground">
          Defaults for page titles, descriptions, social previews, and
          structured data. Use entity screens for product, category, team, and
          service-specific fields when those are added.
        </p>
      </div>
      <SeoForm />
    </div>
  );
};
