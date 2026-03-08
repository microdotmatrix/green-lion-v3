import sanitizeHtml from "sanitize-html";

const FIRST_PARAGRAPH_PATTERN = /<p\b[^>]*>([\s\S]*?)<\/p>/i;
export const BLOG_EXCERPT_LENGTHS = {
  base: 180,
  lg: 240,
  xxxl: 360,
} as const;

function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return normalizeWhitespace(
    sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }),
  );
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength).trimEnd();
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  const safeTruncation =
    lastSpaceIndex > maxLength * 0.6
      ? truncated.slice(0, lastSpaceIndex)
      : truncated;

  return `${safeTruncation}...`;
}

export function resolveBlogExcerpt(
  excerpt: string | null | undefined,
  body: string | null | undefined,
  maxLength: number = BLOG_EXCERPT_LENGTHS.base,
): string {
  const manualExcerpt = normalizeWhitespace(excerpt);
  if (manualExcerpt) {
    return manualExcerpt;
  }

  const sourceHtml = body ?? "";
  const firstParagraphMatch = sourceHtml.match(FIRST_PARAGRAPH_PATTERN);
  const fallbackText = stripHtml(firstParagraphMatch?.[1] ?? sourceHtml);

  return fallbackText ? truncateText(fallbackText, maxLength) : "";
}

export function resolveResponsiveBlogExcerpts(
  excerpt: string | null | undefined,
  body: string | null | undefined,
) {
  return {
    base: resolveBlogExcerpt(excerpt, body, BLOG_EXCERPT_LENGTHS.base),
    lg: resolveBlogExcerpt(excerpt, body, BLOG_EXCERPT_LENGTHS.lg),
    xxxl: resolveBlogExcerpt(excerpt, body, BLOG_EXCERPT_LENGTHS.xxxl),
  };
}
