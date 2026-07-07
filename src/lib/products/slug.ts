// Category slugs are derived from the category name at request time —
// there is no slug column on categories. Keep this in sync with the
// public product routes under src/pages/products/.
export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
