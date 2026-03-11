# Phase 5: Product CSV Import/Export - Research

**Researched:** 2026-03-10
**Domain:** CSV parsing/generation, Astro API routes, Drizzle ORM upsert, React dialog UI
**Confidence:** HIGH

## Summary

This phase adds two admin capabilities to the existing products page: bulk importing products from a CSV file and exporting the full product catalog as a CSV. The implementation is entirely additive — no schema changes, no new pages, no background jobs. All required DB tables (`products`, `pricingTiers`, `categories`) and their Drizzle insert schemas are already defined and in use.

The primary technical decisions are: (1) which CSV library to use on both client and server, (2) how to handle multipart file upload in an Astro API route, and (3) how to structure the upsert logic (SKU conflict → update, new SKU → insert, bad row → skip and report). The existing `[id].ts` PUT handler already demonstrates the exact delete-then-reinsert pattern for pricing tiers, making the import logic a direct extension of established code.

The recommended CSV library is **papaparse** (7.6 kB minified+gzip, no dependencies, works in both browser and Node.js). For the import endpoint, the file arrives via `request.formData()` — standard Web Platform API that Astro's Node adapter handles natively. Export is a plain GET endpoint that returns `text/csv` with `Content-Disposition: attachment`.

**Primary recommendation:** Use papaparse for both parsing (import endpoint, server-side) and generating (export endpoint, server-side unparse). No streaming required for typical catalog sizes.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CSV format — data scope**
- Columns: `sku`, `name`, `description`, `category`, `min_order_qty`, `order_qty_increment`, `logo_cost`, `packaging_cost`, `image_url`, then pricing tier columns
- Pricing tiers: flattened into fixed columns — `tier1_min_qty`, `tier1_price`, `tier2_min_qty`, `tier2_price`, ... up to 5 tiers (tier1–tier5)
- Empty tier columns are ignored on import (not required to fill all 5)
- Images: single `image_url` column (first/primary image URL only). Not required on import; on export, first element of the images JSON array
- Attributes: excluded entirely

**Import conflict handling**
- SKU conflict: upsert — rows with an existing SKU update the product's name, description, category, costs, MOQ, and pricing tiers
- Pricing tier update: replace strategy — delete all existing tiers for the product, then insert tiers from the CSV row fresh
- Invalid rows: skip bad rows, import valid ones. Return a results summary: X inserted, Y updated, Z skipped (with per-row error details)
- Required fields for a valid row: `sku` and `name` at minimum

**Category resolution**
- Category column matches by name (case-insensitive)
- If category name doesn't exist in DB: auto-create it (name only)
- If category column is empty: product is imported with `categoryId = null`
- On export: category column contains the human-readable category name, not the ID

**Import/export UX**
- Location: "Export CSV" and "Import CSV" buttons added to the existing products admin page toolbar/header — no new page
- Import flow: admin clicks "Import CSV" → file picker opens → on file selection, import runs immediately → dialog shows results
- Export: clicking "Export CSV" triggers an immediate browser download — always full catalog export
- File input: plain `<input type="file" accept=".csv">` — UploadThing not used

### Claude's Discretion
- CSV parsing library choice (e.g., `papaparse` or Node's built-in streaming — whichever is smaller and SSR-compatible)
- Column header casing convention (snake_case vs camelCase — snake_case preferred for Excel readability)
- Exact import dialog visual (loading state while processing, results table layout)
- Export filename format (e.g., `products-2026-03-10.csv`)
- Handling of trailing whitespace and BOM in uploaded CSV files

### Deferred Ideas (OUT OF SCOPE)
- Export respecting active filters/search
- Preview-before-commit import flow
- Background/async import for large catalogs
- Attribute import/export
- Download blank CSV template (headers only)
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| papaparse | 5.4.x (latest) | CSV parse + unparse (both server + browser) | 7.6 kB gzipped, no deps, works in Node.js, `header: true` mode returns objects keyed by column name — direct match for this use case |
| drizzle-orm | ^0.45.1 (already installed) | Upsert via `.onConflictDoUpdate()` + delete/reinsert pattern for tiers | Already in project; `onConflictDoUpdate` with `excluded` reference handles SKU conflict natively |
| @tanstack/react-query | ^5.90.19 (already installed) | `useMutation` for import POST; plain fetch for export | Established pattern in products hooks |
| sonner | ^2.0.7 (already installed) | `toast.success` / `toast.error` for quick feedback | Established pattern throughout admin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.5 (already installed) | Per-row validation of CSV data | Reuse `insertProductSchema` partial for row validation before DB write |
| lucide-react | ^0.562.0 (already installed) | `Upload`, `Download` icons for toolbar buttons | Consistent with existing admin UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| papaparse | Node built-in `readline` / manual split | Manual parsing fails on quoted fields containing commas, newlines, or escaped quotes — papaparse handles all RFC 4180 edge cases |
| papaparse | csv-parse (stream-focused) | csv-parse is 30+ kB and async-stream oriented; overkill for synchronous server-side parsing of in-memory string from `request.formData()` |
| papaparse | fast-csv | Similar size tradeoff to csv-parse; papaparse's sync string parse is simpler for this use case |

**Installation:**
```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/api/admin/products/
│   ├── import.ts          # POST — multipart/form-data CSV upload, parse, upsert, return results JSON
│   └── export.ts          # GET — query all products + tiers + categories, return CSV text
└── components/admin/products/
    ├── products-page.tsx  # ADD: Export + Import buttons; Import opens Dialog
    ├── csv-import-dialog.tsx  # NEW: file picker + results display
    └── api.ts             # ADD: importProducts(), exportProducts() fetch helpers
```

### Pattern 1: Multipart File Upload in Astro API Route

**What:** Use `request.formData()` — standard Web Platform API that works in Astro's Node adapter without any additional middleware.

**When to use:** All file uploads to Astro API routes in server/SSR mode.

**Example:**
```typescript
// src/pages/api/admin/products/import.ts
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  const text = await file.text(); // reads file as UTF-8 string
  // strip BOM if present (Excel exports UTF-8 with BOM)
  const csvText = text.replace(/^\uFEFF/, "");

  // pass csvText to papaparse...
};
```

### Pattern 2: Papaparse Server-Side Parse (Node.js)

**What:** Parse a CSV string synchronously in Node.js. `header: true` returns rows as objects keyed by column name. `skipEmptyLines: true` handles trailing newlines.

**When to use:** Import endpoint — CSV arrives as a string from `file.text()`.

**Example:**
```typescript
// Source: https://www.papaparse.com/docs
import Papa from "papaparse";

const result = Papa.parse<Record<string, string>>(csvText, {
  header: true,
  skipEmptyLines: true,
  transform: (value: string) => value.trim(), // strip whitespace per cell
});

// result.data = array of row objects, e.g. [{ sku: "GL-001", name: "Widget", ... }]
// result.errors = parse-level errors (structural, not row validation)
```

### Pattern 3: Drizzle Upsert (onConflictDoUpdate) for Products

**What:** Single INSERT ... ON CONFLICT DO UPDATE using Drizzle's `.onConflictDoUpdate()`. The `excluded` reference points to the proposed row values.

**When to use:** Upsert products by SKU during import. More efficient than SELECT then INSERT/UPDATE per row.

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/guides/upsert
import { sql } from "drizzle-orm";

// Batch upsert products (all valid rows in one query)
await db
  .insert(products)
  .values(productRows)  // array of insert-ready objects
  .onConflictDoUpdate({
    target: products.sku,
    set: {
      name: sql`excluded.name`,
      description: sql`excluded.description`,
      categoryId: sql`excluded.category_id`,
      minimumOrderQuantity: sql`excluded.minimum_order_quantity`,
      orderQuantityIncrement: sql`excluded.order_quantity_increment`,
      logoCost: sql`excluded.logo_cost`,
      packagingCost: sql`excluded.packaging_cost`,
      updatedAt: new Date(),
    },
  })
  .returning({ id: products.id, sku: products.sku });
```

Note: The `products.sku` column is defined `.notNull().unique()` in schema — safe upsert target.

### Pattern 4: Pricing Tier Replace Strategy

**What:** For each upserted product, delete all existing pricing tiers then insert fresh tiers from the CSV row. This is already the established pattern in `[id].ts` PUT handler.

**When to use:** Import — CSV is source of truth for pricing.

**Example (mirrors existing PUT pattern):**
```typescript
// From src/pages/api/admin/products/[id].ts (established pattern)
await db.delete(pricingTiers).where(eq(pricingTiers.productId, productId));
if (tiersFromRow.length > 0) {
  await db.insert(pricingTiers).values(
    tiersFromRow.map((tier) => ({
      productId,
      minQuantity: tier.minQuantity,
      pricePerUnit: tier.pricePerUnit,
    })),
  );
}
```

For batch import, this runs per-product after the batch upsert resolves product IDs.

### Pattern 5: CSV Export Response

**What:** GET endpoint returns `text/csv` with `Content-Disposition: attachment` header. Browser treats this as a file download automatically.

**When to use:** Export endpoint.

**Example:**
```typescript
// src/pages/api/admin/products/export.ts
import Papa from "papaparse";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Query all products + tiers + categories
  // ...build rows array (one row per product, tiers flattened to tier1_min_qty etc.)

  const csvString = Papa.unparse(rows, { header: true });
  const date = new Date().toISOString().split("T")[0]; // "2026-03-10"

  return new Response(csvString, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
    },
  });
};
```

### Pattern 6: Client-Side Export Trigger (no TanStack Query needed)

**What:** A plain `fetch()` call that reads the blob and creates a temporary anchor to trigger download. No React Query caching needed for one-shot downloads.

**Example:**
```typescript
async function handleExport() {
  const response = await fetch("/api/admin/products/export");
  if (!response.ok) { toast.error("Export failed"); return; }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 7: Import Results Dialog

**What:** Dialog with file input + results summary. Same Dialog component as catalog upload dialog. Opens on "Import CSV" click, shows spinner while POST is in flight, then shows result counts and skipped rows.

**When to use:** After import completes (mutation onSuccess/onError).

Mirrors: `src/components/admin/catalogs/catalog-upload-dialog.tsx` — same Dialog/DialogContent/DialogFooter structure, same pattern of resetting state on close.

### Anti-Patterns to Avoid

- **Sending CSV via JSON body:** CSV files must be sent as `multipart/form-data` — not stringified JSON. The import endpoint must consume `request.formData()`.
- **Validating rows with the full `insertProductSchema`:** The insert schema requires `description` and `images` to be non-null — but the CSV allows `description` to be empty and images to be absent. Build a dedicated CSV row validation schema (Zod, inline) that only requires `sku` and `name`, with all other fields optional.
- **Using `db.batch()` for the tier delete+insert loop:** Neon serverless batch is for read queries. For the tier replace pattern, sequential awaits are correct (delete, then insert per product).
- **Importing Papa from the wrong path:** PapaParse ships as a CommonJS/UMD module. In ESM Astro projects use `import Papa from "papaparse"` (default import). Named exports are not provided.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Manual `.split(",")` | papaparse | Quoted fields containing commas, embedded newlines, escaped quotes all break naive splitting. RFC 4180 edge cases require a real parser. |
| CSV generation | Manual string concatenation | `Papa.unparse()` | Fields with commas or quotes must be quoted and escaped. Manual concat produces invalid CSV that Excel mangles. |
| BOM detection | Manual byte check | `text.replace(/^\uFEFF/, "")` | Single-line fix; no library needed. Excel UTF-8 exports add a BOM. |
| Row-level validation | Custom type checking | Zod schema `.safeParse()` | Per-row validation with structured error messages; same pattern as existing API endpoints use. |

**Key insight:** The CSV domain has two deceptively hard problems — parsing fields that contain the delimiter character, and generating correctly escaped output. Both are solved by papaparse's 7.6 kB package.

---

## Common Pitfalls

### Pitfall 1: Excel UTF-8 BOM

**What goes wrong:** Excel saves CSV files with a UTF-8 BOM (`\uFEFF`) prepended. When papaparse reads this, the first column header becomes `"\uFEFFsku"` instead of `"sku"`, causing all rows to fail validation (the `sku` field is never found).

**Why it happens:** Excel adds the BOM so Windows tools can auto-detect encoding. It's invisible in most text editors.

**How to avoid:** Strip the BOM before parsing: `const csvText = text.replace(/^\uFEFF/, "");`

**Warning signs:** First column data always undefined; zero products inserted despite valid-looking file.

### Pitfall 2: Pricing Tier Columns Require a Specific Round-Trip Mapping

**What goes wrong:** The flat `tier1_min_qty, tier1_price, ...tier5_min_qty, tier5_price` columns must be consistently named on both import and export. If export uses different column names than import expects, the CSV is not round-trip safe.

**How to avoid:** Define a single `TIER_COLUMNS` constant (or function) shared by both import and export logic. Lock on snake_case names as decided: `tier1_min_qty`, `tier1_price`, etc.

### Pitfall 3: `insertProductSchema` Rejects CSV Rows

**What goes wrong:** `insertProductSchema` (from `drizzle-zod createInsertSchema`) requires `description` as a non-null string (matches DB `notNull()`). CSV rows may have blank description. Using the schema directly causes valid-looking rows to be skipped.

**How to avoid:** Build a dedicated CSV row Zod schema that only requires `sku` (string, non-empty) and `name` (string, non-empty). All other fields are `.optional()` with sensible defaults applied before DB insert.

### Pitfall 4: Category Case-Insensitive Lookup at Scale

**What goes wrong:** If you perform a separate DB query per row for category lookup, a 500-row CSV produces 500 category queries.

**How to avoid:** Pre-fetch all categories into a `Map<string (lower), id>` once before the row loop. Track newly created categories in the same map as you create them inline — so subsequent rows with the same new category name hit the map, not the DB.

### Pitfall 5: Decimal Precision for Pricing

**What goes wrong:** Pricing columns (`logo_cost`, `packaging_cost`, `tier1_price`) from CSV are strings. Drizzle's `decimal` columns accept string numbers. Passing `"1.5"` is fine, but `"$1.50"` or `"1,500.00"` (thousands separator) will fail the DB insert or be stored as `null`/`NaN`.

**How to avoid:** Normalize price values in the row parsing step: strip non-numeric characters except `.` and `-`, validate the result is a valid finite number string before inserting.

### Pitfall 6: Skipped Row Reporting Requires Row Numbers

**What goes wrong:** The results dialog says "3 rows skipped" but the admin can't identify which rows to fix without row numbers.

**How to avoid:** Track the original CSV row index (1-based, with header = row 1) for each skipped row. Return `{ row: number, sku: string | undefined, reason: string }` per skip. The results dialog renders a scrollable list with row number and reason.

---

## Code Examples

Verified patterns from official sources:

### Import Endpoint Structure (server-side)
```typescript
// Source: Astro docs + papaparse docs + drizzle upsert docs
import Papa from "papaparse";
import { db } from "@/lib/db";
import { categories, pricingTiers, products } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

// CSV row validation — only sku + name required
const csvRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  category: z.string().optional(),
  min_order_qty: z.coerce.number().int().positive().optional().default(1),
  order_qty_increment: z.coerce.number().int().positive().optional().default(1),
  logo_cost: z.string().optional().default("0"),
  packaging_cost: z.string().optional().default("0"),
  image_url: z.string().optional(),
  tier1_min_qty: z.coerce.number().int().positive().optional(),
  tier1_price: z.string().optional(),
  // ... tier2 through tier5
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  const rawText = await file.text();
  const csvText = rawText.replace(/^\uFEFF/, ""); // strip Excel BOM

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (v: string) => v.trim(),
  });

  // Pre-fetch all categories into a Map
  const existingCategories = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

  const inserted: string[] = [];
  const updated: string[] = [];
  const skipped: Array<{ row: number; sku?: string; reason: string }> = [];

  // Process each row...
  // (upsert product, delete+reinsert tiers, track results)

  return new Response(
    JSON.stringify({ inserted: inserted.length, updated: updated.length, skipped }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
```

### Export Query Pattern (server-side)
```typescript
// Query all products with joined category name and all tiers
const allProducts = await db
  .select({
    sku: products.sku,
    name: products.name,
    description: products.description,
    category: categories.name,
    minimumOrderQuantity: products.minimumOrderQuantity,
    orderQuantityIncrement: products.orderQuantityIncrement,
    logoCost: products.logoCost,
    packagingCost: products.packagingCost,
    images: products.images,
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id));

const tiers = await db.select().from(pricingTiers);
const tiersByProduct = new Map<string, typeof tiers>();
for (const tier of tiers) {
  if (!tiersByProduct.has(tier.productId)) tiersByProduct.set(tier.productId, []);
  tiersByProduct.get(tier.productId)!.push(tier);
}

// Build flat row objects with tier columns + image_url from images[0]
```

### Client Import Mutation (React)
```typescript
// Source: TanStack Query docs + established products hooks pattern
const importMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      body: formData, // no Content-Type header — browser sets multipart boundary automatically
    });
    if (!res.ok) throw new Error("Import failed");
    return res.json() as Promise<{ inserted: number; updated: number; skipped: SkippedRow[] }>;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    setImportResults(data);
  },
  onError: () => toast.error("Import failed"),
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual CSV parsing with regex/split | papaparse with `header: true` | Industry standard since ~2013 | Handles all RFC 4180 edge cases transparently |
| Separate SELECT + INSERT/UPDATE per row | Drizzle `.onConflictDoUpdate()` batch | drizzle-orm v0.28+ | Single INSERT...ON CONFLICT for batch; eliminates N+1 DB round trips for product upserts |
| Streaming large file uploads | `request.formData()` with `file.text()` | Astro 3+ with Node adapter | Synchronous for typical catalog sizes (<5MB); no streaming infrastructure needed |

**Deprecated/outdated:**
- `FileReader` API for reading file contents client-side: Not needed — the file is sent to the server via FormData; server reads it with `file.text()`.
- `multer` middleware for file parsing: Not needed in Astro Node adapter — `request.formData()` is built-in Web Platform API.

---

## Open Questions

1. **Neon batch vs sequential for tier operations**
   - What we know: `db.batch()` in Neon is for read queries; the existing PUT endpoint uses sequential awaits for delete+reinsert tiers
   - What's unclear: Whether wrapping the per-product tier replacement in a Drizzle transaction improves atomicity
   - Recommendation: For a batch import, sequential per-product (upsert all products first, then loop tiers) avoids transaction overhead. If atomicity matters (partial import = bad), wrap the entire import in a single Drizzle transaction — but the CONTEXT.md decision is skip-bad-rows, which implies partial success is acceptable, so a transaction is not required.

2. **papaparse types in ESM + TypeScript**
   - What we know: `pnpm add -D @types/papaparse` provides types; default import works
   - What's unclear: Whether `@types/papaparse` covers the `transform` option in the generic overload
   - Recommendation: Use `Papa.parse<Record<string, string>>(...)` with explicit generic to ensure type safety. The `transform` option is typed in current `@types/papaparse`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files or test directories found in project |
| Config file | None — Wave 0 task required |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map

No formal requirement IDs defined for Phase 5 (this is a phase added to the roadmap beyond the v1 requirements). Behavioral requirements derived from CONTEXT.md:

| Behavior | Test Type | Notes |
|----------|-----------|-------|
| Import: valid row → product inserted | Integration | Requires DB |
| Import: existing SKU → product updated | Integration | Requires DB |
| Import: missing sku/name → row skipped with reason | Unit | Pure logic |
| Import: category by name (case-insensitive match) | Unit | Pure map lookup |
| Import: category auto-create when not found | Integration | Requires DB |
| Import: pricing tiers replaced on upsert | Integration | Requires DB |
| Import: BOM stripped before parsing | Unit | Pure string transform |
| Export: returns text/csv with Content-Disposition | Integration | HTTP response check |
| Export: category name (not ID) in output | Unit | Row mapping logic |
| Export: tier columns flattened correctly | Unit | Row mapping logic |
| CSV round-trip: export then re-import produces same data | Integration | Requires DB |

### Wave 0 Gaps
- [ ] No test framework installed — research recommends vitest (native ESM, fast, no DOM needed for server-side logic)
- [ ] Install: `pnpm add -D vitest`
- [ ] Create `vitest.config.ts` at project root

*(If testing is deferred: the planner may treat Validation Architecture as out-of-scope for this phase given no existing test infrastructure and the additive, low-risk nature of this feature.)*

---

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM upsert docs](https://orm.drizzle.team/docs/guides/upsert) — `onConflictDoUpdate` API + `excluded` reference
- [Drizzle ORM insert docs](https://orm.drizzle.team/docs/insert) — batch insert pattern
- [Papa Parse official docs](https://www.papaparse.com/docs) — `Papa.parse()` / `Papa.unparse()` API, options reference
- Project source: `src/pages/api/admin/products/[id].ts` — delete+reinsert pricing tier pattern (HIGH — direct code read)
- Project source: `src/lib/db/schema.ts` — table definitions, insert schemas, `products.sku` unique constraint (HIGH — direct code read)
- Project source: `src/components/admin/catalogs/catalog-upload-dialog.tsx` — Dialog + file input UI pattern (HIGH — direct code read)
- Project source: `src/components/admin/products/products-page.tsx` — toolbar structure for button placement (HIGH — direct code read)

### Secondary (MEDIUM confidence)
- [Astro Endpoints docs](https://docs.astro.build/en/guides/endpoints/) — API route Response patterns, `request.formData()` usage
- [papaparse npm / Best of JS](https://bestofjs.org/projects/papa-parse) — bundle size (7.58 kB minified+gzip, version 5.5.3+)
- [BetterStack PapaParse Node.js guide](https://betterstack.com/community/guides/scaling-nodejs/parsing-csv-files-with-papa-parse/) — server-side string parse pattern
- [DEV: Using FormData with Astro](https://dev.to/okikio/using-formdata-with-astro-5545) — multipart handling confirmed

### Tertiary (LOW confidence)
- [DEV Community: BOM handling](https://dev.to/omardulaimi/how-to-properly-handle-utf-8-bom-files-in-nodejs-1nmj) — BOM stripping pattern (single-source; however the `\uFEFF` stripping approach is standard and independently verifiable)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — papaparse is the established JS CSV library, all other libraries are already installed in project
- Architecture: HIGH — all patterns derived from official docs (Drizzle, Astro) or direct codebase reads
- Pitfalls: HIGH — BOM issue, decimal normalization, and category pre-fetch are documented problems with clear fixes
- Validation architecture: LOW — no test infrastructure exists; test framework recommendation is provisional

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (stable libraries; Drizzle API changes infrequently, papaparse v5 has been stable since 2021)
