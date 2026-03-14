# Phase 6: Add Product Attribute Management UI to Admin Products Page - Research

**Researched:** 2026-03-13
**Domain:** React admin UI — junction table management, tabbed dialog, nested sub-dialog pattern
**Confidence:** HIGH (all findings drawn from direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Location**
- Attribute management is inline in the existing `ProductFormDialog`, not a separate product detail page
- The dialog gains two tabs: "Basic Info" (all current fields) and "Attributes" (new)
- The Attributes tab is only shown when editing an existing product (not during creation — create flow shows Basic Info only)
- This is consistent with how pricing tiers are managed inline today

**Attribute properties per assignment**
- When assigning an attribute to a product, the admin configures all three fields: `required` (boolean toggle), `additionalCost` ($), and `supportedOptions` (subset of allowed values)
- These fields are edited in a separate small dialog that opens when adding or clicking an assigned attribute — not inline in the row
- `supportedOptions` is only shown for `select` and `multi_select` attribute types, displayed as a multi-select checklist of the attribute's full option list

**Category attribute inheritance**
- The Attributes tab shows a read-only "From Category" section at the top, listing the attributes already assigned to the product's category (informational context)
- Product-level assignments appear below in an editable section
- Admin can assign an attribute that is already on the category — but the attribute is labeled "also on category" in the picker to make the overlap explicit
- No auto-inherit on category change — assignments are always manual

**CSV import**
- Attribute assignment is manual UI only for this phase
- CSV import/export continues to handle core product fields only (no attribute columns)
- Attribute columns in CSV are deferred to a future phase

### Claude's Discretion
- Loading skeleton design for the Attributes tab
- Exact tab component/layout (shadcn Tabs component is available)
- API endpoint design for product attributes (GET/POST/DELETE at `/api/admin/products/[id]/attributes`)
- Error state handling within the tab

### Deferred Ideas (OUT OF SCOPE)
- CSV attribute columns — future phase (attribute assignment via bulk import)
- Auto-inherit attributes from category when category is assigned/changed — future enhancement
</user_constraints>

---

## Summary

Phase 6 adds a product-level attribute assignment UI inside the existing `ProductFormDialog`. The dialog gains a two-tab layout (Basic Info / Attributes), where the Attributes tab is only accessible when editing an existing product. Each product attribute assignment has three editable properties: `required`, `additionalCost`, and `supportedOptions`. The sub-dialog pattern (a small configure dialog for each attribute) is the correct UX, matching CONTEXT.md decisions.

The entire codebase surface needed for this phase already exists. The `productAttributes` table is defined in schema.ts with the correct columns. The categories system provides a working reference implementation: `categoryAttributes` API route, `AddAttributeDialog`, and `CategoryAttributesCard` are direct analogs to what needs building for products. The only net-new elements are: (1) the new API route file at `src/pages/api/admin/products/[id]/attributes.ts`, (2) the Attributes tab content inside `ProductFormDialog`, (3) a configure sub-dialog for per-assignment properties, and (4) new hook/api functions in the products module.

**Primary recommendation:** Mirror the category-attributes API pattern exactly (GET/POST/DELETE on the same route, auth guard, inner join to `customizationAttributes`), then adapt the tab UI from the `CategoryDetailPage` approach — with the added complexity of the configure sub-dialog and the "From Category" read-only section.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query | existing | server state, cache invalidation | already used throughout admin |
| shadcn/ui Tabs | existing | tab layout in dialog | available in `src/components/ui/tabs.tsx` |
| shadcn/ui Switch | existing | `required` boolean toggle | available in `src/components/ui/switch.tsx` |
| shadcn/ui Checkbox | existing | `supportedOptions` multi-select checklist | available in `src/components/ui/checkbox.tsx` |
| shadcn/ui Dialog | existing | configure sub-dialog | available in `src/components/ui/dialog.tsx` |
| shadcn/ui Badge | existing | attribute type label | available in `src/components/ui/badge.tsx` |
| shadcn/ui Skeleton | existing | loading state | already used in `ProductFormDialog` |
| Drizzle ORM | existing | database queries | project standard |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── pages/api/admin/products/[id]/
│   └── attributes.ts              # NEW: GET / POST / DELETE / PUT
├── components/admin/products/
│   ├── product-form-dialog.tsx    # MODIFY: add Tabs, wire Attributes tab
│   ├── product-attributes-tab.tsx # NEW: Attributes tab content component
│   ├── assign-attribute-dialog.tsx # NEW: picker + configure sub-dialog (add flow)
│   ├── configure-attribute-dialog.tsx # NEW: configure sub-dialog (edit flow)
│   ├── hooks.ts                   # MODIFY: add useProductAttributes, useProductAttributeMutations
│   ├── api.ts                     # MODIFY: add fetchProductAttributes, assignProductAttribute, removeProductAttribute, updateProductAttribute
│   └── types.ts                   # MODIFY: add ProductAttribute type
```

### Pattern 1: API Route — Mirror Category Attributes

The existing `src/pages/api/admin/categories/[id]/attributes.ts` is the exact template to follow. For products, the differences are:
- Table: `productAttributes` instead of `categoryAttributes`
- Foreign key field: `productId` instead of `categoryId`
- Extra fields on insert: `required` (boolean), `additionalCost` (decimal), `supportedOptions` (jsonb)
- PUT handler needed (category attributes have no per-assignment config to update; product attributes do)

**GET** — inner join `customizationAttributes`, filter by `productId`, return enriched rows.
**POST** — accept `{ attributeId, required, additionalCost, supportedOptions }`, check duplicate, insert.
**DELETE** — accept `{ attributeId }` in request body, delete matching row.
**PUT** — accept `{ attributeId, required, additionalCost, supportedOptions }`, update matching row.

```typescript
// Source: src/pages/api/admin/categories/[id]/attributes.ts (reference pattern)
// Adapted for products — GET handler shape
const assignments = await db
  .select({
    id: productAttributes.id,
    attributeId: productAttributes.attributeId,
    required: productAttributes.required,
    additionalCost: productAttributes.additionalCost,
    supportedOptions: productAttributes.supportedOptions,
    attributeName: customizationAttributes.name,
    attributeType: customizationAttributes.attributeType,
    allOptions: customizationAttributes.options,
  })
  .from(productAttributes)
  .innerJoin(
    customizationAttributes,
    eq(productAttributes.attributeId, customizationAttributes.id),
  )
  .where(eq(productAttributes.productId, id));
```

### Pattern 2: Dialog Tab Layout

`ProductFormDialog` currently renders a single `<form>` inside `ResponsiveModalContent`. Adding tabs requires wrapping the form contents in `Tabs` + `TabsList` + `TabsContent` blocks. The `form` tag should wrap the entire `Tabs` component so the Basic Info tab submit continues to work.

The Attributes tab must not be inside the `<form>` element's submit — attribute mutations fire independently via TanStack mutations, not via form submit. Placing the Attributes tab content outside the form (but inside the same dialog) is the clean approach: move the form footer (`ResponsiveModalFooter` with Cancel/Submit) inside the Basic Info `TabsContent`, and give the Attributes tab its own self-contained UI.

```typescript
// Structural shape — product-form-dialog.tsx after modification
<ResponsiveModalContent>
  <ResponsiveModalHeader>...</ResponsiveModalHeader>
  {isEditing ? (
    <Tabs defaultValue="basic">
      <TabsList>
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="attributes">Attributes</TabsTrigger>
      </TabsList>
      <TabsContent value="basic">
        <form onSubmit={handleSubmit}>
          {/* existing form fields */}
          <ResponsiveModalFooter>...</ResponsiveModalFooter>
        </form>
      </TabsContent>
      <TabsContent value="attributes">
        <ProductAttributesTab productId={productId} categoryId={formData.categoryId} />
      </TabsContent>
    </Tabs>
  ) : (
    <form onSubmit={handleSubmit}>
      {/* existing form fields — create flow unchanged */}
      <ResponsiveModalFooter>...</ResponsiveModalFooter>
    </form>
  )}
</ResponsiveModalContent>
```

### Pattern 3: ProductAttributesTab Component

This is the main content of the Attributes tab. It owns:
1. A read-only "From Category" section — fetches the product's category ID from `formData.categoryId` and queries `/api/admin/categories/{categoryId}/attributes` (the existing endpoint; no new route needed)
2. An editable "Product Attributes" section — fetches from the new `/api/admin/products/{productId}/attributes`
3. An "Add Attribute" button that opens `AssignAttributeDialog`
4. A list of assigned attributes, each row clickable to open `ConfigureAttributeDialog`

```typescript
// Component signature
type ProductAttributesTabProps = {
  productId: string;
  categoryId: string; // needed to fetch category attributes for the read-only section
};
```

Loading skeleton: three `<Skeleton className="h-12 w-full" />` rows — matches existing usage in `CategoryAttributesCard`.

### Pattern 4: AssignAttributeDialog (add flow)

A small `Dialog` (not `ResponsiveModal` — this is a sub-dialog, keep it simple). It:
1. Shows a `Select` to pick an attribute from all attributes not already assigned at product level
2. Labels attributes that are "also on category" (compare picker list against category attribute IDs)
3. After picking, shows the configure fields (`required` Switch, `additionalCost` Input, `supportedOptions` Checkbox list if applicable)
4. On submit, calls POST `/api/admin/products/{productId}/attributes`

### Pattern 5: ConfigureAttributeDialog (edit flow)

Same UI as AssignAttributeDialog's configure section, but pre-populated with existing values and calls PUT `/api/admin/products/{productId}/attributes` on save, DELETE on remove.

### Pattern 6: TanStack Query Hooks

Follow `useCategoryAttributeMutations` pattern exactly. Cache key: `["admin-product-attributes", productId]`.

```typescript
// hooks.ts additions
export function useProductAttributes(productId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-product-attributes", productId],
    queryFn: () => fetchProductAttributes(productId),
    enabled,
  });
}

export function useProductAttributeMutations(productId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-product-attributes", productId] });

  const assignMut = useMutation({
    mutationFn: (data: ProductAttributeInput) => assignProductAttribute(productId, data),
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: (data: ProductAttributeInput & { attributeId: string }) =>
      updateProductAttribute(productId, data),
    onSuccess: invalidate,
  });

  const removeMut = useMutation({
    mutationFn: (attributeId: string) => removeProductAttribute(productId, attributeId),
    onSuccess: invalidate,
  });

  return { assignMut, updateMut, removeMut };
}
```

### Anti-Patterns to Avoid

- **Putting attribute mutations inside the Basic Info form submit:** Attribute changes must be fire-and-forget mutations, not bundled into the product PUT. The tab's mutations are independent.
- **Using `ResponsiveModal` for the configure sub-dialog:** The configure dialog opens inside an already-open `ResponsiveModal`. Use plain `Dialog` from shadcn to avoid nested responsive modal issues.
- **Fetching category attributes via a new endpoint:** The existing `/api/admin/categories/[id]/attributes` GET already returns what is needed for the "From Category" read-only section. No new API needed for this.
- **Blocking tab navigation during a pending mutation:** Tabs should be freely switchable; mutations are instant-fire. Show inline error in the Attributes tab, not a modal blocker.
- **Showing the Attributes tab during create:** CONTEXT.md locks this — tab is edit-only. The `isEditing` flag (`!!productId`) is the guard.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Attribute type label ("Select", "Multi-select", etc.) | Custom mapping | `getTypeLabel()` from `src/components/admin/categories/utils.ts` | Already implemented, shared |
| All-attributes picker list | Custom fetch | `useAttributes()` from `@/components/admin/attributes/hooks` | Already imported in `products-page.tsx`, same query key |
| Category attribute list (read-only section) | New endpoint | Existing `/api/admin/categories/[id]/attributes` GET | Route already exists and returns the right shape |
| Duplicate check on assign | Client-side filter | Server-side 409 check in API route | Category API already does this; mirror it |

**Key insight:** The category attributes system is a complete reference implementation. Every structural problem in this phase has already been solved for categories. Follow it precisely.

---

## Common Pitfalls

### Pitfall 1: `supportedOptions` displayed for wrong attribute types

**What goes wrong:** Showing the `supportedOptions` checklist for `text`, `number`, or `boolean` attribute types.
**Why it happens:** The condition is easy to forget when wiring the UI.
**How to avoid:** Gate the checklist on `attr.attributeType === "select" || attr.attributeType === "multi_select"`.
**Warning signs:** The configure dialog shows an empty or invisible checklist for a `text` attribute.

### Pitfall 2: Stale category attributes in the read-only section

**What goes wrong:** If the admin changes `categoryId` in the Basic Info tab without saving, the "From Category" section still shows the old category's attributes.
**Why it happens:** `formData.categoryId` is local React state that updates on Select change but the product hasn't been saved yet.
**How to avoid:** Pass `formData.categoryId` (the live local state value) to `ProductAttributesTab`, not the saved value from the server. The query will re-run when it changes. This is the correct behavior — it gives a preview of what categories contribute.

### Pitfall 3: `additionalCost` as number vs. string

**What goes wrong:** Sending `additionalCost` as a JavaScript number to the API; Drizzle schema uses `decimal` (string internally).
**Why it happens:** Input `type="number"` onChange gives a string, but parsing it gives a number; API expects a string decimal.
**How to avoid:** Keep `additionalCost` as a string in the UI state (like `logoCost` and `packagingCost` in `ProductFormData`). Send the raw string value to the API.

### Pitfall 4: Dialog-in-dialog scroll behavior on mobile

**What goes wrong:** The configure sub-dialog scrolls awkwardly inside `ResponsiveModal` on mobile viewports.
**Why it happens:** `ResponsiveModal` uses a drawer on mobile; a nested `Dialog` adds another scroll container.
**How to avoid:** Keep the configure sub-dialog as a standard `Dialog` (desktop-style only). The configure fields are compact (Switch + one Input + optional checklist) and fit without scrolling.

### Pitfall 5: Query enabled guard when productId is null

**What goes wrong:** `useProductAttributes` fires with an empty or null productId, causing a 400/404 from the API.
**Why it happens:** `ProductFormDialog` renders for create mode too (where `productId` is null).
**How to avoid:** `ProductAttributesTab` is only rendered when `isEditing`, so `productId` will always be a valid string when the hook is mounted. Still, pass `enabled: !!productId` to the query for defense-in-depth.

---

## Code Examples

### Product Attribute TypeScript type (types.ts addition)

```typescript
// Source: inferred from src/lib/db/schema.ts productAttributes table
export interface ProductAttribute {
  id: string;
  attributeId: string;
  required: boolean;
  additionalCost: string;         // decimal as string, matches Drizzle decimal
  supportedOptions: string[] | null;
  attributeName: string;          // joined from customizationAttributes
  attributeType: string;          // 'text' | 'number' | 'boolean' | 'select' | 'multi_select'
  allOptions: string[] | null;    // full option list from customizationAttributes.options
}

export interface ProductAttributeInput {
  attributeId: string;
  required: boolean;
  additionalCost: string;
  supportedOptions: string[] | null;
}
```

### API functions (api.ts additions)

```typescript
// Source: mirrors src/components/admin/categories/api.ts pattern
export async function fetchProductAttributes(productId: string): Promise<ProductAttribute[]> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`);
  if (!response.ok) throw new Error("Failed to fetch product attributes");
  return response.json();
}

export async function assignProductAttribute(
  productId: string,
  data: ProductAttributeInput,
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign attribute");
  }
}

export async function updateProductAttribute(
  productId: string,
  data: ProductAttributeInput & { attributeId: string },
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attribute");
  }
}

export async function removeProductAttribute(
  productId: string,
  attributeId: string,
): Promise<void> {
  const response = await fetch(`/api/admin/products/${productId}/attributes`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attributeId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove attribute");
  }
}
```

### "Also on category" detection logic

```typescript
// Inside AssignAttributeDialog — computes which attributes overlap with category
const categoryAttributeIds = new Set(categoryAttributes?.map((a) => a.attributeId) ?? []);
const alreadyAssignedIds = new Set(existingProductAttributeIds);

const availableAttributes = allAttributes?.filter(
  (attr) => !alreadyAssignedIds.has(attr.id)  // exclude already assigned at product level
);
// Then in the Select items:
// isOnCategory = categoryAttributeIds.has(attr.id)
// Label: attr.name + (isOnCategory ? " (also on category)" : "")
```

---

## Validation Architecture

nyquist_validation is enabled. This project has no test framework configured (no jest.config, vitest.config, or test directories). This phase is a pure admin UI feature — all behavior is human-verifiable through the admin interface.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | None — no test infrastructure exists |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | Status |
|----------|-----------|-------------------|--------|
| Attributes tab appears only in edit mode | manual | N/A | manual-only |
| Assigning attribute persists to `productAttributes` table | manual | N/A | manual-only |
| Required toggle, additionalCost, supportedOptions save correctly | manual | N/A | manual-only |
| "From Category" section is read-only and reflects correct category | manual | N/A | manual-only |
| "Also on category" label appears for overlapping attributes | manual | N/A | manual-only |
| Removing an attribute clears it from the list | manual | N/A | manual-only |
| Create mode shows only Basic Info tab (no Attributes tab) | manual | N/A | manual-only |

### Wave 0 Gaps

No test framework exists. All verification for this phase is manual UI testing. No Wave 0 test infrastructure setup is warranted for a UI-only phase without an existing test foundation.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/lib/db/schema.ts` — `productAttributes` table definition, columns, types
- Direct codebase inspection: `src/pages/api/admin/categories/[id]/attributes.ts` — reference implementation for all four HTTP verbs
- Direct codebase inspection: `src/components/admin/categories/` — `AddAttributeDialog`, `CategoryAttributesCard`, `hooks.ts`, `api.ts` — reference UI patterns
- Direct codebase inspection: `src/components/admin/products/product-form-dialog.tsx` — current dialog structure to be modified
- Direct codebase inspection: `src/components/ui/tabs.tsx`, `switch.tsx`, `checkbox.tsx`, `dialog.tsx` — confirmed components available

### Secondary (MEDIUM confidence)
- N/A — all findings come from direct codebase inspection, no external sources needed

### Tertiary (LOW confidence)
- N/A

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in project
- Architecture patterns: HIGH — reference implementation exists for every pattern in categories module
- API route design: HIGH — direct copy of category attributes route with column name substitution
- UI structure: HIGH — dialog/tab/sub-dialog shape confirmed against existing components
- Pitfalls: HIGH — derived from actual schema types and existing code patterns

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (stable codebase, patterns won't change)
